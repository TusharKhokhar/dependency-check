const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Customers, Smartphones } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess, getDatabaseOneCustomer,
} = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const {getDb} = require("../../config/dbHandler");
const { getDataFromCollection } = require('../../helpers/aggregator')
const log = new CustomLogger()

module.exports = {
    Mutation: {
        async addSmartphone(_, { addSmartphoneInput }, context, info) {
            log.lambdaSetup(context, 'smartphones', 'addSmartphone')
            const {
                CustomerID,
                CustomerName,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                Pin,
                IsActive
            } = addSmartphoneInput
            let newSmartphone = {
                CustomerID,
                CustomerName,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                Pin,
                IsActive,
                CreatedBy: ObjectId.createFromHexString(context.data._id)
            }
            try {
                verifyUserAccess(context, CustomerID)
                newSmartphone = await formObjectIds(newSmartphone)
                const db = await getDb()
                const smartphoneData = await db.collection(Smartphones).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
                if (smartphoneData) {
                    throw new GraphQLError('Smartphone Integration already exists', {
                        extensions: {
                            code: '121'
                        }
                    })
                } else {
                    newSmartphone = await addCreateTimeStamp(newSmartphone)
                    const { insertedId } = await db.collection(Smartphones).insertOne(newSmartphone)
                    const smartphoneData = await db
                    .collection(Smartphones)
                    .findOne({ _id: insertedId });
                    const customerData = await db
                    .collection(Customers)
                    .findOne(
                        { _id: smartphoneData?.CustomerID },
                        { projection: { _id: 1, CustomerName: 1 } }
                    );
                return {
                    ...smartphoneData,
                    CustomerName: customerData?.CustomerName || null,
                };
                }
            } catch (error) {
                log.error(error)
                throw new Error(error)
            }
        },

        async updateSmartphone(_, { updateSmartphoneInput, customerId }, context, info) {
            log.lambdaSetup(context, 'smartphones', 'updateSmartphone')
            verifyUserAccess(context, customerId);
            dot.remove('CustomerID', updateSmartphoneInput)
            updateSmartphoneInput = addUpdateTimeStamp(updateSmartphoneInput)
            let updateObject = await dot.dot(updateSmartphoneInput)
            updateObject = formObjectIds(updateObject, true)
            updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
            const db =  await getDatabaseOneCustomer(context, customerId)
            await db.collection(Smartphones).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, {
                $set: updateObject
            })
            return {
                message: 'Smartphone updated successfully',
                statusCode: 200
            }
        },

        async smartphoneDeleted (_, { IsDeleted, customerId }, context) {
            log.lambdaSetup(context, 'smartphones', 'smartphoneDeleted')
            try {
                if (IsDeleted !== true) {
                throw new GraphQLError(INVALID_STATUS, {
                  extensions: {
                    code: '400'
                  }
                })
              }
              verifyUserAccess(context, customerId);
              const db = await getDatabase(context)
              const response = {
                message: 'Deleted Successfully',
                statusCode: 200
              }
              await db.collection(Smartphones).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, { $set: { IsDeleted: true } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },

        async smartphoneStatus (_, { IsActive, customerId }, context) {
            log.lambdaSetup(context, 'smartphones', 'smartphoneStatus')
            try {
              if (IsActive === null || IsActive === undefined) {
                throw new GraphQLError(REQUIRED_INPUT_MISSING, {
                  extensions: {
                    code: '121'
                  }
                })
              }
              verifyUserAccess(context, customerId)
              const response = {
                message: IsActive ? 'Activated Successfully' : 'Deactivated Successfully',
                statusCode: 200
              }
              const db = await getDatabase(context)
              await db.collection(Smartphones).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, { $set: { IsActive: IsActive } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },
    },
    Query: {
        async getSmartphone(_, { customerId }, context) {
            log.lambdaSetup(context, 'smartphones', 'getSmartphone')
            try {
                verifyUserAccess(context, customerId)
                const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                let response = await db.collection(Smartphones).findOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false})
                if (!response) {
                    throw new GraphQLError('Configuration not found', {
                        extensions: {
                            code: '404'
                        }
                    })
                }
                const customerData = await getDataFromCollection({
                  collectionName: "Customers",
                  filters: { _id: ObjectId.createFromHexString(customerId) },
                  projection: ["CustomerName"],
                  pagination: { single: true },
                });

                if (customerData) {
                  response["CustomerName"] = customerData?.CustomerName;
                }
                return response
            } catch (error) {
                log.error(error)
                throw new Error(error?.message || error);
            }
        }
    }
}
