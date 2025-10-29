const model = require('../../models/index')
const { Areas } = require('../../models/collections')
const { GraphQLError } = require('graphql')
const { AREA_ALREADY_EXIST, REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, SOMETHING_WENT_WRONG, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
const stringConstant = require('../../helpers/success-constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, getDatabase, addCreateTimeStamp, addUpdateTimeStamp, getDatabaseOneCustomer,
  getDatabaseForGetAllAPI, verifyUserAccess
} = require('../../helpers/util')
const { customerSecurity } = require('../../utils/validation')
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addArea (_, { addAreaInput }, context, info) {
      log.lambdaSetup(context, 'areas', 'addArea')
      const {
        Label,
        Area,
        Description,
        CustomerID,
        LocationID,
        GroupIDs,
        RulesID,
        CustomizationID,
        Rule,
        Tags,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addAreaInput
      let newArea = {
        Label: Label,
        Area: Area,
        Description: Description,
        CustomerID,
        LocationID,
        GroupIDs,
        RulesID,
        CustomizationID,
        Rule: Rule,
        Tags: Tags,
        CreatedBy: CreatedBy
      }
      verifyUserAccess(context, CustomerID)
      newArea = formObjectIds(newArea)
      newArea = addCreateTimeStamp(newArea)
      try {
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const validateArea = await db.collection(Areas).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          LocationID: ObjectId.createFromHexString(LocationID),
          Area: { $regex: `^${Area}$`, $options: 'i' },
          IsDeleted: false
        })
        if (validateArea) {
          throw new GraphQLError(AREA_ALREADY_EXIST, '406')
        } else {
          const { acknowledged, insertedId } = await db.collection(Areas).insertOne(newArea)
          return await db.collection(Areas).findOne({ _id: insertedId })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateArea (_, { updateAreaInput, areaId }, context, info) {
      log.lambdaSetup(context, 'areas', 'updateArea')
      const {
        Area,
        CustomerID,
        LocationID
      } = updateAreaInput
      verifyUserAccess(context, CustomerID)
      const db = await getDatabaseOneCustomer(context, CustomerID)
      const validateAreaDuplicacy = await db.collection(Areas).findOne({
        _id: { $ne: ObjectId.createFromHexString(areaId) },
        Area: { $regex: `^${Area}$`, $options: 'i' },
        LocationID: ObjectId.createFromHexString(LocationID),
        CustomerID: ObjectId.createFromHexString(CustomerID)
      })
      if (validateAreaDuplicacy) {
        throw new GraphQLError(AREA_ALREADY_EXIST, '406')
      } else {
        dot.remove('CustomerID', updateAreaInput)
        updateAreaInput = addUpdateTimeStamp(updateAreaInput)
        let updateObject = await dot.dot(updateAreaInput)
        updateObject = formObjectIds(updateObject, true)
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        try {
          await db.collection(Areas).updateOne({ _id: ObjectId.createFromHexString(areaId) }, {
            $set:
            updateObject
          })
          return {
            message: 'Updated successfully',
            statusCode: 200
          }
        } catch (error) {
          return {
            message: 'Updated failed',
            statusCode: 400
          }
        }
      }
    },

    async areaDeleted (_, { IsDeleted, areaId, customerId }, context) {
      log.lambdaSetup(context, 'areas', 'areaDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!areaId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        await db.collection(Areas).updateOne({ _id: ObjectId.createFromHexString(areaId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async areaStatus (_, { IsActive, areaId, customerId }, context) {
      log.lambdaSetup(context, 'areas', 'areaStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!areaId) {
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
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        await db.collection(Areas).updateOne({ _id: ObjectId.createFromHexString(areaId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getAreas (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'areas', 'getAreas')
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
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(Areas)
      return await model.areas.getAreasInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          collection
        })
        .then(areaList => {
          areaList.total = areaList.total.length
          return areaList
        }).catch(err => {
          log.error(err)
          throw new Error(err)
        })
    },

    async getArea (_, { areaId, customerId }, context) {
      log.lambdaSetup(context, 'areas', 'getArea')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        return await db.collection(Areas).findOne({ _id: ObjectId.createFromHexString(areaId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
