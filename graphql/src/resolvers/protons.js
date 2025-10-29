const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Protons } = require('../../models/collections')
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
        async addProton(_, { addProtonInput }, context, info) {
            log.lambdaSetup(context, 'protons', 'addProton')
            const {
                CustomerID,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                OcpApimSubscriptionKey,
                TransactionOcpApimSubscriptionKey,
                ClientId,
                ClientSecret,
                TokenAPIEndpoint,
                TransactionServicesAPIEndpoint,
                IsActive
            } = addProtonInput
            let newProton = {
                CustomerID,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                OcpApimSubscriptionKey,
                TransactionOcpApimSubscriptionKey,
                ClientId,
                ClientSecret,
                TokenAPIEndpoint,
                TransactionServicesAPIEndpoint,
                IsActive,
                CreatedBy: ObjectId.createFromHexString(context.data._id),
                IsDeleted: false
            }
            try {
                verifyUserAccess(context, CustomerID)
                newProton = await formObjectIds(newProton)
                const db = await getDb()
                const protonData = await db.collection(Protons).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
                if (protonData) {
                    throw new GraphQLError('Proton integration already exists', {
                        extensions: {
                            code: '121'
                        }
                    })
                } else {
                    newProton = await addCreateTimeStamp(newProton)
                    newProton = await performEncryption(newProton)
                    const { insertedId } = await db.collection(Protons).insertOne(newProton)
                    return await db.collection(Protons).findOne({ _id: insertedId })
                }
            } catch (error) {
                log.error(error)
                throw new Error(error)
            }
        },
        
        async updateProton(_, { updateProtonInput, customerId }, context, info) {
            log.lambdaSetup(context, 'protons', 'updateProton')
            verifyUserAccess(context, customerId);
            dot.remove('CustomerID', updateProtonInput)
            updateProtonInput = await performEncryption(updateProtonInput)
            updateProtonInput = addUpdateTimeStamp(updateProtonInput)
            let updateObject = await dot.dot(updateProtonInput)
            updateObject = formObjectIds(updateObject, true)
            updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
            const db =  await getDatabaseOneCustomer(context, customerId)
            await db.collection(Protons).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, {
                $set: updateObject
            })
            return {
                message: 'Proton updated successfully',
                statusCode: 200
            }
        },

        async protonDeleted (_, { IsDeleted, customerId }, context) {
            log.lambdaSetup(context, 'protons', 'protonDeleted')
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
              await db.collection(Protons).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, { $set: { IsDeleted: IsDeleted } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },

        async protonStatus (_, { IsActive, customerId }, context) {
            log.lambdaSetup(context, 'protons', 'protonStatus')
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
                message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
                statusCode: 200
              }
              const db = await getDatabase(context)
              await db.collection(Protons).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsActive: IsActive } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },
    },
    Query: {
        async getProton(_, { customerId }, context) {
            log.lambdaSetup(context, 'protons', 'getProton')
            try {
                verifyUserAccess(context, customerId)
                const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                let response = await db.collection(Protons).findOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false})
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
