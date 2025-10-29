const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Networks } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess, performEncryption, getDatabaseOneCustomer,
    performDecryption
} = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const {getDb} = require("../../config/dbHandler");
const { getDataFromCollection } = require('../../helpers/aggregator')
const log = new CustomLogger()

module.exports = {
    Mutation: {
        async addNetwork(_, { addNetworkInput }, context, info) {
            log.lambdaSetup(context, 'networks', 'addNetwork')
            const {
                CustomerID,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                Server,
                Path,
                Username,
                Password,
                IsActive
            } = addNetworkInput
            let newNetwork = {
                CustomerID,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                Server,
                Path,
                Username,
                Password,
                IsActive,
                CreatedBy: ObjectId.createFromHexString(context.data._id),
                IsDeleted: false
            }
            try {
                verifyUserAccess(context, CustomerID)
                newNetwork = await formObjectIds(newNetwork)
                const db = await getDb()
                const networkData = await db.collection(Networks).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
                if (networkData) {
                    throw new GraphQLError('Network integration already exists', {
                        extensions: {
                            code: '121'
                        }
                    })
                } else {
                    newNetwork = await addCreateTimeStamp(newNetwork)
                    newNetwork = await performEncryption(newNetwork)
                    const { insertedId } = await db.collection(Networks).insertOne(newNetwork)
                    return await db.collection(Networks).findOne({ _id: insertedId })
                }
            } catch (error) {
                log.error(error)
                throw new Error(error)
            }
        },
        
        async updateNetwork(_, { updateNetworkInput, customerId }, context, info) {
            log.lambdaSetup(context, 'networks', 'updateNetwork')
            verifyUserAccess(context, customerId);
            dot.remove('CustomerID', updateNetworkInput)
            updateNetworkInput = await performEncryption(updateNetworkInput)
            updateNetworkInput = addUpdateTimeStamp(updateNetworkInput)
            let updateObject = await dot.dot(updateNetworkInput)
            updateObject = formObjectIds(updateObject, true)
            updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
            const db =  await getDatabaseOneCustomer(context, customerId)
            await db.collection(Networks).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, {
                $set: updateObject
            })
            return {
                message: 'Network updated successfully',
                statusCode: 200
            }
        },

        async deleteNetwork (_, { IsDeleted, customerId }, context) {
            log.lambdaSetup(context, 'networks', 'networkDeleted')
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
              await db.collection(Networks).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, { $set: { IsDeleted: true } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },

        async networkStatus (_, { IsActive, customerId }, context) {
            log.lambdaSetup(context, 'networks', 'networkStatus')
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
              await db.collection(Networks).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false, }, { $set: { IsActive: IsActive } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },
    },
    Query: {
        async getNetwork(_, { customerId }, context) {
            log.lambdaSetup(context, 'networks', 'getNetwork')
            try {
                verifyUserAccess(context, customerId)
                const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                let response = await db.collection(Networks).findOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false})
                if (!response) {
                    throw new GraphQLError('Configuration not found', {
                        extensions: {
                            code: '404'
                        }
                    })
                }
                response = response ? await performDecryption(response) : {}
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
                throw new Error(error)
            }
        }
    }
}
