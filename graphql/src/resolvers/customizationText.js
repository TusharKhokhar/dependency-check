const { GraphQLError } = require('graphql')
const { DATABASE_ERROR, REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, CUSTOMIZATIONTEXT_ALREADY_EXIST, INVALID_STATUS } = require('../../helpers/error-messages')
const Customer = require('../../models/customers')
const { CUSTOMER_TYPE_CHECK, UPLOAD_PATH } = require('../../utils/constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const dot = require('dot-object')
const model = require('../../models/index')
const { Customers, CustomizationTexts } = require('../../models/collections')
const stringConstant = require('../../helpers/success-constants')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess
} = require('../../helpers/util')
const { customizationTexts } = require('../../models')
const { bucketName, domainName} = require('../../config/config')
const { STANDARD_TIER } = require('../../helpers/constants')
const { isolatedDatabase } = require('../../config/dbHandler')
const { customerSecurity } = require('../../utils/validation')
const {aliasEmails, aliasEmailsGroup} = require("../../helpers/responseChange");
const sanitizeHtml = require('sanitize-html');
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addCustomizationText (_, { addCustomizationTextInput }, context, info) {
      log.lambdaSetup(context, 'customizationTexts', 'addCustomizationText')
      const {
        Languages,
        CustomerID,
        MainSection,
        LocationHoursSection,
        SelectFileSection,
        UserInformationSection,
        HowToLogoSection,
        AdvancedEmailConfiguration,
        LogoMobile,
        BrandScheme,
        LocationSearchRange,
        GlobalDecimalSetting,
        CustomEmailMessage,
        MobileConfiguration,
        Layout,
        SignUpGroup,
        EnableSignUp,
        HideEmailPrinting,
        DecimalSeperator,
        TermsAndServiceAdditions,
        AddValuePageAmount,
        PriceToggle,
        DisplayUpload,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted = false
      } = addCustomizationTextInput
      let newCustomizationText = {
        MainSection: MainSection,
        LocationHoursSection: LocationHoursSection,
        SelectFileSection: SelectFileSection,
        UserInformationSection: UserInformationSection,
        HowToLogoSection: HowToLogoSection,
        AdvancedEmailConfiguration,
        LogoMobile: LogoMobile,
        BrandScheme: BrandScheme,
        LocationSearchRange: LocationSearchRange,
        GlobalDecimalSetting: GlobalDecimalSetting,
        CustomEmailMessage: CustomEmailMessage,
        TermsAndServiceAdditions: TermsAndServiceAdditions,
        MobileConfiguration: MobileConfiguration,
        Layout: Layout,
        PriceToggle: PriceToggle,
        Languages,
        SignUpGroup: SignUpGroup,
        EnableSignUp: EnableSignUp,
        HideEmailPrinting: HideEmailPrinting,
        DecimalSeperator: DecimalSeperator,
        DisplayUpload: DisplayUpload,
        CustomerID: ObjectId.createFromHexString(CustomerID),
        CreatedBy,
        AddValuePageAmount,
        IsDeleted
      }
      verifyUserAccess(context, CustomerID)
      newCustomizationText = formObjectIds(newCustomizationText)
      newCustomizationText.IsActive = true;
      newCustomizationText = addCreateTimeStamp(newCustomizationText)
      const db = await getDatabase(context)
      const customerData = await db.collection(Customers).findOne({ _id: ObjectId.createFromHexString(CustomerID) }, { CustomerType: 1 })
      if (customerData && customerData.CustomerType.toLowerCase() === CUSTOMER_TYPE_CHECK) {
        HowToLogoSection.EmailAddressAssignedGrayscale = `bw-${context.headers.subDomain}@${process.env.domainName}`
        HowToLogoSection.EmailAddressAssignedColor = `color-${context.headers.subDomain}@${process.env.domainName}`
      } else {
        HowToLogoSection.EmailAddressAssignedCustomer = `${context.headers.subDomain}@${process.env.domainName}`
      }
      HowToLogoSection.UploadURL = `https://${context.headers.subDomain}.${process.env.domainName}/${UPLOAD_PATH}`
      try {
        const validateCustomizationText = await db.collection(CustomizationTexts).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID) })
        if (validateCustomizationText) {
          throw new GraphQLError(CUSTOMIZATIONTEXT_ALREADY_EXIST, {
            extensions: {
              code: '406'
            }
          })
        } else {
          const { insertedId } = await db.collection(CustomizationTexts).insertOne(newCustomizationText)
          return await await db.collection(CustomizationTexts).findOne({ _id: insertedId })
        }
      } catch (error) {
        throw new Error(error)
      }
    },
    async updateCustomizationText (_, {
      updateCustomizationTextInput,
      customizationTextId,
      customerId
    }, context, info) {
      log.lambdaSetup(context, 'cutomizationTexts', 'updateCustomizationText')
      try {
        verifyUserAccess(context, customerId)
        let db = await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        dot.remove('CustomerID', updateCustomizationTextInput)
        updateCustomizationTextInput = await addUpdateTimeStamp(updateCustomizationTextInput)
        const validateCustomizationText = await db.collection(CustomizationTexts).findOne({
          _id: { $ne: ObjectId.createFromHexString(customizationTextId) },
          CustomerID: ObjectId.createFromHexString(customerId)
        })
        if (validateCustomizationText) {
          throw new GraphQLError(CUSTOMIZATIONTEXT_ALREADY_EXIST, {
            extensions: {
              code: '406'
            }
          })
        } else {
          if (updateCustomizationTextInput?.MainSection?.TopSection &&
          updateCustomizationTextInput.MainSection.TopSection.CustomerLogo &&
            updateCustomizationTextInput.MainSection.TopSection.CustomerLogo.includes(`https://api.${domainName}/logo`)) {
            dot.remove('MainSection.TopSection.CustomerLogo', updateCustomizationTextInput)
          }
          if (updateCustomizationTextInput?.MainSection?.TopSection &&
          updateCustomizationTextInput.MainSection.TopSection.CustomerLogo &&
            updateCustomizationTextInput.MainSection.TopSection.CustomerLogo.includes(`https://api.${domainName}/logo`)) {
            dot.remove('MainSection.TopSection.CustomerLogo', updateCustomizationTextInput)
          }
          if (updateCustomizationTextInput.HowToLogoSection && updateCustomizationTextInput.HowToLogoSection.PartnerLogo &&
            updateCustomizationTextInput.HowToLogoSection.PartnerLogo !== 'assets/images/logo/tbs-logo-image.png' &&
            updateCustomizationTextInput.HowToLogoSection.PartnerLogo.includes(`https://api.${domainName}/logo`)
          ) {
            dot.remove('HowToLogoSection.PartnerLogo', updateCustomizationTextInput)
          }
          if (updateCustomizationTextInput?.LogoMobile?.Url &&
            updateCustomizationTextInput.LogoMobile.Url.includes(`https://api.${domainName}/logo`)
          ) {
            dot.remove('LogoMobile.Url', updateCustomizationTextInput)
          }
          if (updateCustomizationTextInput?.TermsAndServiceAdditions) {
            updateCustomizationTextInput.TermsAndServiceAdditions =
              sanitizeHtmlText(updateCustomizationTextInput.TermsAndServiceAdditions)
          }
          let updateObject = await dot.dot(updateCustomizationTextInput)
          updateCustomizationTextInput.UpdatedBy = ObjectId.createFromHexString(context.data._id)
          updateCustomizationTextInput.CustomerID = ObjectId.createFromHexString(customerId)
          updateObject = await formObjectIds(updateObject, true)
          await db.collection(CustomizationTexts).updateOne({ _id: ObjectId.createFromHexString(customizationTextId) },
                  { $set: updateObject })
          return {
            message: 'Updated successfully',
            statusCode: 200
          }
        }
      } catch (e) {
        log.error(e)
        throw new Error(e)
      }
    },

    async customizationTextDeleted (_, { IsDeleted, customizationTextId, customerId }, context, info) {
      log.lambdaSetup(context, 'customizationTexts', 'customizationTextDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customizationTextId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customizationTextId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        const response = {
          message: IsDeleted ? 'Deleted Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        await db.collection(CustomizationTexts).updateOne({ _id: ObjectId.createFromHexString(customizationTextId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async customizationTextStatus (_, { IsActive, customizationTextId, customerId }, context) {
      log.lambdaSetup(context, 'customizationTexts', 'customizationTextStatus')
      try {
        if (IsActive === null) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customizationTextId) {
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
        await db.collection(CustomizationTexts).updateOne({ _id: ObjectId.createFromHexString(customizationTextId) },
          { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async generateEmail (_, {customerId, combination }, context) {
      log.lambdaSetup(context, 'customizationTexts', 'generateEmail')
      try {
        verifyUserAccess(context, customerId)
        combination = combination.toLowerCase()
        let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        const customizationText = await db.collection('CustomizationTexts').findOne({ CustomerID: ObjectId.createFromHexString(customerId), 'AdvancedEmailConfiguration.AdvancedEmailAlias.CombinationType': combination })
        if (customizationText) {
          throw new Error('Email combination already exists')
        } else {
          let obj = {
            CombinationType: combination,
            Email: `${combination.split('_').join('-')}-${customerData.DomainName}@${domainName}`,
            AliasEmails: null
          }
          const customizationText = await db.collection('CustomizationTexts').findOne({ CustomerID: ObjectId.createFromHexString(customerId)})

          if(customizationText?.AdvancedEmailConfiguration?.AdvancedEmailAlias && customizationText.AdvancedEmailConfiguration.AdvancedEmailAlias.length > 0){
            await db.collection(CustomizationTexts).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) },
              { $push: {'AdvancedEmailConfiguration.AdvancedEmailAlias': obj  }, $set: {'AdvancedEmailConfiguration.Enabled': true} })
          } else {
            await db.collection(CustomizationTexts).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) },
              { $set: {'AdvancedEmailConfiguration.AdvancedEmailAlias': [obj], 'AdvancedEmailConfiguration.Enabled': true  } })
          }
          return obj
        }
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {

    async getCustomizationTexts (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'customizationTexts', 'getCustomizationTexts')
      let {
        pattern,
        pageNumber = 1,
        limit = 10,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const collection = await db.collection(CustomizationTexts)
      return await model.customizationTexts.getCustomizationTextsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection
      })
        .then(customizationTextList => {
          customizationTextList.total = customizationTextList.total.length
          return customizationTextList
        }).catch(error => {
          log.error(error)
          throw new Error(error)
        })
    },

    async getCustomizationText (_, { customerId }, context) {
      log.lambdaSetup(context, 'customizationTexts', 'getCustomizationText')
      try {
        verifyUserAccess(context, customerId)
        let db = await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        let customizationTextsData = await db.collection(CustomizationTexts).aggregate([
          { $match: {CustomerID: ObjectId.createFromHexString(customerId)} },
          {
            $lookup: {
              from: 'Groups',
              localField: 'SignUpGroup',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, GroupName: 1, GroupType: 1 } }
              ],
              as: 'GroupData'
            }
          },
          {
            $unwind: {
              path: '$GroupData',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'Locations',
              localField: 'MobileConfiguration.LocationConfiguration',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, Location: 1} }
              ],
              as: 'LocationConfiguration'
            }
          },
          {
            $unwind: {
              path: '$LocationConfiguration',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'Locations',
              localField: 'MobileConfiguration.MultipleLocationConfiguration',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, Location: 1} }
              ],
              as: 'MultipleLocationConfiguration'
            }
          }
        ]).toArray()
        customizationTextsData = customizationTextsData[0]
        customizationTextsData?.MainSection?.TopSection &&
        customizationTextsData.MainSection.TopSection.CustomerLogo
          ? customizationTextsData.MainSection.TopSection.CustomerLogo =
            `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationTextsData.MainSection.TopSection.CustomerLogo.split('Logos')[1]).toString('base64')}`
          : {}
        if (customizationTextsData.HowToLogoSection && customizationTextsData.HowToLogoSection.PartnerLogo) {
          customizationTextsData.HowToLogoSection.PartnerLogo !== 'assets/images/logo/tbs-logo-image.png'
            ? customizationTextsData.HowToLogoSection.PartnerLogo =
              `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationTextsData.HowToLogoSection.PartnerLogo.split('Logos')[1]).toString('base64')}`
            : {}
        }
        if (customizationTextsData?.LogoMobile?.Url) {
          customizationTextsData.LogoMobile.Url = `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationTextsData.LogoMobile.Url.split('Logos')[1]).toString('base64')}`
        }
        if (customizationTextsData?.AdvancedEmailConfiguration?.AdvancedEmailAlias &&
          customizationTextsData.AdvancedEmailConfiguration.AdvancedEmailAlias.length > 0){
          customizationTextsData.AdvancedEmailConfiguration.AdvancedEmailAlias =
            aliasEmailsGroup(customizationTextsData.AdvancedEmailConfiguration.AdvancedEmailAlias)
        }
        if (customizationTextsData?.MobileConfiguration){
          customizationTextsData.MobileConfiguration.MultipleLocationConfiguration = customizationTextsData.MultipleLocationConfiguration
          customizationTextsData.MobileConfiguration.LocationConfiguration = customizationTextsData.LocationConfiguration
        }
        return customizationTextsData
      } catch (err) {
        throw new Error(err)
      }
    }
  }

}


const sanitizeHtmlText = (terms) => {
  return sanitizeHtml(terms, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'span', 'h1', 's', 'u', 'pre', 'sub', 'sup', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'li', 'ol', 'br'],  // Specify allowed tags
    allowedAttributes: {
      'a': ['href'],
      '*' : ['style']
    }
  })
}