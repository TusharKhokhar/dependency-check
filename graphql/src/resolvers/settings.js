const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const { REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, SOMETHING_WENT_WRONG, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Settings } = require('../../models/collections')
const stringConstant = require('../../helpers/success-constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess } = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addSetting (_, { addSettingInput }, context, info) {
      log.lambdaSetup(context, 'settings', 'addSetting')
      const {
        Label,
        Setting,
        Description,
        Tags,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted = false,
      } = addSettingInput
      let newSetting = {
        Label: Label,
        Setting: Setting,
        Description: Description,
        Tags: Tags,
        CreatedBy: CreatedBy,
        IsDeleted: IsDeleted,
      }
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        newSetting.IsActive = true;
        newSetting = formObjectIds(newSetting)
        newSetting = addCreateTimeStamp(newSetting)
        const db = await getDatabase(context)
        const { acknowledged, insertedId } = await db.collection(Settings).insertOne(newSetting)
        if (acknowledged) {
          return {
            message: stringConstant.ADDED_SUCCESSFULLY,
            statusCode: 201,
            insertedId: insertedId
          }
        } else {
          throw new GraphQLError(SOMETHING_WENT_WRONG, '406')
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateSetting (_, { updateSettingInput, settingId }, context, info) {
      log.lambdaSetup(context, 'settings', 'updateSetting')
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      let updateObject = await dot.dot(updateSettingInput)
      const db = await getDatabase(context)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = formObjectIds(updateObject, true)
      updateObject = addUpdateTimeStamp(updateObject)
      await db.collection(Settings).updateOne({ _id: ObjectId.createFromHexString(settingId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async settingDeleted (_, { IsDeleted, settingId }, context) {
      log.lambdaSetup(context, 'settings', 'settingDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!settingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        await db.collection(Settings).updateOne({ _id: ObjectId.createFromHexString(settingId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async settingStatus (_, { IsActive, settingId }, context) {
      log.lambdaSetup(context, 'settings', 'settingStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!settingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabase(context)
        await db.collection(Settings).updateOne({ _id: ObjectId.createFromHexString(settingId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getSettings (_, { paginationInput }, context) {
      log.lambdaSetup(context, 'settings', 'getSettings')
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
      const collection = db.collection(Settings)
      return await model.settings.getSettingsInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          collection
        }).then(settingList => {
        settingList.total = settingList.total.length
        return settingList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getSetting (_, { settingId }, context) {
      log.lambdaSetup(context, 'settings', 'getSetting')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        return await db.collection(Settings).findOne({ _id: ObjectId.createFromHexString(settingId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
