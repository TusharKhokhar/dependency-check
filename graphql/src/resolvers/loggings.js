const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, SOMETHING_WENT_WRONG, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
const { Logging } = require('../../models/collections')
const model = require('../../models/index')
const stringConstant = require('../../helpers/success-constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { getDatabase, formObjectIds, addCreateTimeStamp, verifyUserAccess } = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addLogging (_, { addLoggingInput }, context, info) {
      log.lambdaSetup(context, 'loggings', 'addLogging')
      const {
        Action,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addLoggingInput
      let newLogging = {
        Action: Action,
        CreatedBy: CreatedBy
      }
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        newLogging = await formObjectIds(newLogging)
        newLogging = await addCreateTimeStamp(newLogging)
        const db = await getDatabase(context)
        const { acknowledged, insertedId } = await db.collection(Logging).insertOne(newLogging)
        if (acknowledged) {
          return {
            message: stringConstant.ADDED_SUCCESSFULLY,
            statusCode: 201,
            insertedId: insertedId
          }
        } else {
          throw new GraphQLError(SOMETHING_WENT_WRONG, {
            extensions: {
              code: '406'
            }
          })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateLogging (_, { updateLoggingInput, loggingId }, context, info) {
      log.lambdaSetup(context, 'loggings', 'updateLogging')
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      let updateObject = await dot.dot(updateLoggingInput)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = await formObjectIds(updateObject, true)
      const db = await getDatabase(context)
      await  db.collection(Logging).updateOne({ _id: ObjectId.createFromHexString(loggingId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async loggingDeleted (_, { IsDeleted, loggingId }, context) {
      log.lambdaSetup(context, 'loggings', 'loggingDeleted')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!loggingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        const db = await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        await db.collection(Logging).updateOne({ _id: ObjectId.createFromHexString(loggingId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async loggingStatus (_, { IsActive, loggingId }, context) {
      log.lambdaSetup(context, 'loggings', 'loggingStatus')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!loggingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabase(context)
        await db.collection(Logging).updateOne({ _id: ObjectId.createFromHexString(loggingId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getLoggings (_, { paginationInput }, context) {
      log.lambdaSetup(context, 'loggings', 'getLoggings')
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
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      const db = await getDatabase(context)
      const collection = db.collection(Logging)
      return await model.loggings.getLoggingsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        collection
      })
        .then(loggingList => {
          loggingList.total = loggingList.total.length
          return loggingList
        }).catch(err => {
          log.error(err)
          throw new Error(err)
        })
    },

    async getLogging (_, { loggingId }, context) {
      log.lambdaSetup(context, 'loggings', 'getLogging')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        return await db.collection(Logging).findOne({ _id: loggingId })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
