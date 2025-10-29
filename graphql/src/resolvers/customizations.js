const { Customizations } = require('../../models/collections')
const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const {
  REQUIRED_INPUT_MISSING,
  REQUIRED_ID_MISSING,
  CUSTOMIZATION_ALREADY_EXIST,
  MISSING_INPUT, SOMETHING_WENT_WRONG
} = require('../../helpers/error-messages')
const { generatePalette } = require('../../services/themeGenerator')
const { uploadSignedUrl } = require('../../helpers/imageUpload')
const dot = require('dot-object')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { getDatabase, getDatabaseOneCustomer, verifyUserAccess} = require('../../helpers/util')
const { STANDARD_TIER } = require('../../helpers/constants')
const { isolatedDatabase } = require('../../config/dbHandler')
const { customerSecurity } = require('../../utils/validation')
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async updateCustomization (_, { updateCustomizationInput, customerId }, context, info) {
      log.lambdaSetup(context, 'customizations', 'updateCustomization')
      const {
        themeCode
      } = updateCustomizationInput
      if (!themeCode) {
        throw new GraphQLError(MISSING_INPUT, {
          extensions: {
            code: '121'
          }
        })
      } else {
        verifyUserAccess(context, customerId)
        dot.remove('CustomerID', updateCustomizationInput)
        let db = await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        const themeGenerator = await generatePalette(themeCode)
        updateCustomizationInput.Hex50 = themeGenerator[50]
        updateCustomizationInput.Hex100 = themeGenerator[100]
        updateCustomizationInput.Hex200 = themeGenerator[200]
        updateCustomizationInput.Hex300 = themeGenerator[300]
        updateCustomizationInput.Hex400 = themeGenerator[400]
        updateCustomizationInput.Hex500 = themeGenerator[500]
        updateCustomizationInput.Hex600 = themeGenerator[600]
        updateCustomizationInput.Hex700 = themeGenerator[700]
        updateCustomizationInput.Hex800 = themeGenerator[800]
        updateCustomizationInput.Hex900 = themeGenerator[900]
        updateCustomizationInput.Rgb50 = themeGenerator.rgb50
        updateCustomizationInput.Rgb100 = themeGenerator.rgb100
        updateCustomizationInput.Rgb200 = themeGenerator.rgb200
        updateCustomizationInput.Rgb300 = themeGenerator.rgb300
        updateCustomizationInput.Rgb400 = themeGenerator.rgb400
        updateCustomizationInput.Rgb500 = themeGenerator.rgb500
        updateCustomizationInput.Rgb600 = themeGenerator.rgb600
        updateCustomizationInput.Rgb700 = themeGenerator.rgb700
        updateCustomizationInput.Rgb800 = themeGenerator.rgb800
        updateCustomizationInput.Rgb900 = themeGenerator.rgb900
        let updateObject = await dot.dot(updateCustomizationInput)
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        await db.collection(Customizations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, {
          $set: updateObject
        })
        return updateCustomizationInput
      }
    },

    async customizationDeleted (_, { IsDeleted, customizationId, customerId }, context, info) {
      log.lambdaSetup(context, 'customizations', 'customizationDeleted')
      try {
        if (IsDeleted === null || IsDeleted === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customizationId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        await db.collection(Customizations).updateOne({ _id: ObjectId.createFromHexString(customizationId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async customizationStatus (_, { IsActive, customizationId, customerId }, context) {
      log.lambdaSetup(context, 'customizations', 'customizationStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customizationId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        await db.collection(Customizations).updateOne({ _id: ObjectId.createFromHexString(customizationId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getCustomization (_, { customizationId, customerId }, context) {
      log.lambdaSetup(context, 'customizations', 'getCustomization')
      try {
        verifyUserAccess(context, customerId)
        let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        return await db.collection(Customizations).findOne({ $or: [{ CustomerID: ObjectId.createFromHexString(customerId) }, { _id: ObjectId.createFromHexString(customizationId) }] })
      } catch (err) {
        log.error(err)
        throw new Error(err)
      }
    },

    async uploadLogo (_, { logoMetaData }, context) {
      log.lambdaSetup(context, 'customizations', 'uploadLogo')
      try {
        verifyUserAccess(context, logoMetaData.customerId)
        return await uploadSignedUrl(logoMetaData)
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
