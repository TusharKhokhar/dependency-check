const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, SOMETHING_WENT_WRONG, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Validators } = require('../../models/collections')
const stringConstant = require('../../helpers/success-constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess } = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addValidator (_, { addValidatorInput }, context, info) {
      log.lambdaSetup(context, 'validators', 'addValidator')
      const {
        Label,
        Validator,
        Description,
        Enabled,
        ValidatorType,
        Customer,
        Tags,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted
      } = addValidatorInput
      let newValidator = {
        Label: Label,
        Validator: Validator,
        Description: Description,
        Enabled: Enabled,
        ValidatorType: ValidatorType,
        Customer: Customer,
        Tags: Tags,
        CreatedBy: CreatedBy,
        IsDeleted: IsDeleted
      }
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        newValidator = await formObjectIds(newValidator)
        newValidator.IsActive = true;
        newValidator = await addCreateTimeStamp(newValidator)
        const db = await getDatabase(context)
        const { acknowledged, insertedId } = await db.collection(Validators).insertOne(newValidator)
        if (acknowledged) {
          return {
            message: stringConstant.ADDED_SUCCESSFULLY,
            statusCode: 201,
            insertedId: insertedId
          }
        } else {
          throw new GraphQLError(SOMETHING_WENT_WRONG, {
            extensions: {
              code: '121'
            }
          })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateValidator (_, { updateValidatorInput, validatorId }, context, info) {
      log.lambdaSetup(context, 'validators', 'updateValidator')
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      updateValidatorInput = addUpdateTimeStamp(updateValidatorInput)
      let updateObject = await dot.dot(updateValidatorInput)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = formObjectIds(updateObject)
      const db = await getDatabase(context)
      await db.collection(Validators).updateOne({ _id: validatorId }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async validatorDeleted (_, { IsDeleted, validatorId }, context) {
      log.lambdaSetup(context, 'users', 'addUser')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!validatorId) {
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
        await db.collection(Validators).updateOne({ _id: ObjectId.createFromHexString(validatorId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async validatorStatus (_, { IsActive, validatorId }, context) {
      log.lambdaSetup(context, 'validators', 'validatorStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!validatorId) {
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
        await db.collection(Validators).updateOne({ _id: ObjectId.createFromHexString(validatorId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }
  },

  Query: {
    async getValidators (_, { paginationInput }, context) {
      log.lambdaSetup(context, 'validators', 'getValidators')
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
      const collection = db.collection(Validators)
      return await model.validators.getValidatorsInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          collection
        }).then(validatorList => {
        validatorList.total = validatorList.total.length
        return validatorList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getValidator (_, { validatorId }, context) {
      log.lambdaSetup(context, 'validators', 'getValidator')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        return await db.collection(Validators).findOne({ _id: ObjectId.createFromHexString(validatorId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
