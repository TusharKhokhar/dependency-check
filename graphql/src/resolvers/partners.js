const { PartnersAccess, Customers} = require('../../models/collections')
const bcrypt = require('bcryptjs');
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer, getDualDb,
  verifyUserAccess
} = require('../../helpers/util')
const { GraphQLError } = require('graphql')
const {
  REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING,
  DISASSOCIATE_BEFORE_DELETION, INVALID_STATUS
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const { v4: uuidv4 } = require('uuid');
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const {STANDARD_TIER} = require("../../helpers/constants");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addPartner (_, { addPartnerInput }, context, info) {
      log.lambdaSetup(context, 'partners', 'addPartner')
      const {
        CustomerID,
        IsActive = true,
        IsDeleted = false,
        Read = true,
        Write = true,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addPartnerInput
      verifyUserAccess(context, CustomerID)
      const newApiKey = uuidv4()
      const newSecret = uuidv4()
      const response = {
        ApiKey: newApiKey,
        Secret: newSecret,
        CustomerID,
        IsActive
      }
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(newSecret, salt)
      let newPartner = {
        ApiKey: newApiKey,
        Secret: hash,
        CustomerID: CustomerID,
        IsActive: IsActive,
        IsDeleted: IsDeleted,
        Read: Read,
        Write: Write,
        CreatedBy: CreatedBy
      }
      try {
        newPartner = formObjectIds(newPartner)
        newPartner = addCreateTimeStamp(newPartner)
        let { db, commonDb } = await getDualDb(context, CustomerID)
        const customerDetails = await db.collection(Customers).findOne({_id: ObjectId.createFromHexString(CustomerID)})
        const partnerData = await db.collection(PartnersAccess).insertOne(newPartner)
        if (customerDetails.Tier !== STANDARD_TIER) {
          newPartner._id = partnerData.insertedId
          await commonDb.collection(PartnersAccess).insertOne(newPartner)
          return response
        } else {
          return response
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updatePartner (_, { updatePartnerInput, partnerId }, context, info) {
      log.lambdaSetup(context, 'partners', 'updatePartner')
      let { db, commonDb } = await getDualDb(context, updatePartnerInput.CustomerID)
      let customerDetails = await db.collection(Customers).findOne({_id: ObjectId.createFromHexString(CustomerID)})
      verifyUserAccess(context, updatePartnerInput.CustomerID)
      dot.remove('CustomerID', updatePartnerInput)
      updatePartnerInput = await addUpdateTimeStamp(updatePartnerInput)
      let updateObject = await dot.dot(updatePartnerInput)
      updateObject = await formObjectIds(updateObject, true)
      updatePartnerInput.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      await db.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, {
        $set:
        updateObject
      })
      if (customerDetails.Tier !== STANDARD_TIER) {
        await commonDb.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, {
          $set:
          updateObject
        })
      }
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async partnerDeleted (_, { IsDeleted, partnerId, customerId }, context, info) {
      log.lambdaSetup(context, 'partners', 'partnerDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!partnerId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let { db, commonDb } = await getDualDb(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('partners', partnerId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          if (commonDb) {
            await commonDb.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          }
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async partnerStatus (_, { IsActive, partnerId, customerId }, context) {
      log.lambdaSetup(context, 'partners', 'partnerStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!partnerId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const { db, commonDb } = await getDualDb(context, customerId)
        await db.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, { $set: { IsActive: IsActive } })
        if (commonDb) {
          await commonDb.collection(PartnersAccess).updateOne({ _id: ObjectId.createFromHexString(partnerId) }, { $set: { IsActive: IsActive } })
        }
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }
  },

  Query: {
    async getPartners (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'partners', 'getPartners')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabase(context, customerIds)
      const collection = db.collection(PartnersAccess)
      return await model.partners.getPartnersInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection
      }).then(partnerList => {
        // groupList.total = groupList.total.length
        return partnerList
      }).catch(err => {
        throw new Error(err)
      })
    },

    async getPartner (_, { partnerId, customerId }, context) {
      log.lambdaSetup(context, 'partners', 'getPartner')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        return await db.collection(PartnersAccess).findOne({ _id: ObjectId.createFromHexString(partnerId) })
      } catch (err) {
        throw new Error(err)
      }
    },

    async getPartnerById (_, { paginationInput, customerId }, context) {
      log.lambdaSetup(context, 'partners', 'getPartnerById')
      try {
        let {
          pageNumber,
          limit,
          status,
          pattern,
          sort,
          sortKey
        } = paginationInput
        pageNumber = pageNumber ? parseInt(pageNumber) : undefined
        limit = limit ? parseInt(limit) : undefined
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        const collection = db.collection(PartnersAccess)
        return await model.partners.getApiKeysByCustomerID({
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerId,
          collection
        }).then(apiKeyList => {
          return apiKeyList
        }).catch(err => {
          throw new Error(err)
        })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
