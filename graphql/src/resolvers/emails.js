const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
dot.keepArray = true
const { Emails } = require('../../models/collections')
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
        async addEmail(_, { addEmailInput }, context, info) {
            log.lambdaSetup(context, 'emails', 'addEmail')
            const {
                CustomerID,
                CustomerName,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                SenderName,
                SenderEmail,
                SMTP,
                Port,
                Username,
                DefaultSubject,
                DefaultCC,
                DefaultAddress,
                SSLType,
                Login,
                Password,
                MessageBody,
                EmailConnection,
                EmailAuthentication,
                EmailAuthenticationEnabled,
                IsActive
            } = addEmailInput
            let newEmail = {
                CustomerID,
                CustomerName,
                ThirdPartySoftwareName,
                ThirdPartySoftwareType,
                Tags,
                SenderName,
                SenderEmail,
                SMTP,
                Port,
                Username,
                DefaultSubject,
                DefaultCC,
                DefaultAddress,
                SSLType,
                Login,
                Password,
                MessageBody,
                EmailConnection,
                EmailAuthentication,
                EmailAuthenticationEnabled,
                IsActive,
                CreatedBy: ObjectId.createFromHexString(context.data._id)
            }
            try {
                verifyUserAccess(context, CustomerID)
                newEmail = await formObjectIds(newEmail)
                const db = await getDb()
                const emailData = await db.collection(Emails).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
                if (emailData) {
                    throw new GraphQLError('Email Integration already exists', {
                        extensions: {
                            code: '121'
                        }
                    })
                } else {
                    newEmail = await addCreateTimeStamp(newEmail)
                    newEmail = await performEncryption(newEmail)
                    const { insertedId } = await db.collection(Emails).insertOne(newEmail)
                    return await db.collection(Emails).findOne({ _id: insertedId })
                }
            } catch (error) {
                log.error(error)
                throw new Error(error)
            }
        },

        async updateEmail(_, { updateEmailInput, customerId }, context, info) {
            log.lambdaSetup(context, 'emails', 'updateEmail')
            verifyUserAccess(context, customerId);
            dot.remove('CustomerID', updateEmailInput)
            updateEmailInput = await performEncryption(updateEmailInput)
            updateEmailInput = addUpdateTimeStamp(updateEmailInput)
            let updateObject = await dot.dot(updateEmailInput)
            updateObject = formObjectIds(updateObject, true)
            updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
            const db =  await getDatabaseOneCustomer(context, customerId)
            await db.collection(Emails).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, {
                $set: updateObject
            })
            return {
                message: 'Email updated successfully',
                statusCode: 200
            }
        },

        async emailDeleted (_, { IsDeleted, customerId }, context) {
            log.lambdaSetup(context, 'emails', 'emailDeleted')
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
              await db.collection(Emails).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false }, { $set: { IsDeleted: IsDeleted } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },

        async emailStatus (_, { IsActive, customerId }, context) {
            log.lambdaSetup(context, 'emails', 'emailStatus')
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
              await db.collection(Emails).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsActive: IsActive } })
              return response
            } catch (error) {
                log.error(error)
                throw new Error(error.message)
            }
        },
    },
    Query: {
        async getEmail(_, { customerId }, context) {
            log.lambdaSetup(context, 'emails', 'getEmail')
            try {
                verifyUserAccess(context, customerId)
                const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                let response = await db.collection(Emails).findOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false})
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
                throw new Error(error?.message || error);
            }
        }
    }
}
