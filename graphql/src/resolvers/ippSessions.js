const CustomLogger = require("../../helpers/customLogger");
const {verifyKioskAndUserAccess, verifyUserAccess, getDatabaseOneCustomer} = require("../../helpers/util");
const {getObjectId: ObjectId} = require("../../helpers/objectIdConverter");
const log = new CustomLogger()

module.exports = {
    Mutation: {
        async ippJobStatus (_, { customerId, releaseCode, status, message }, context, info) {
            log.lambdaSetup(context, 'ippSessions', 'ippJobStatus')
            try {
                log.info('ipp job status api called')
                const date = new Date()
                const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                  date.getUTCDate(), date.getUTCHours(),
                  date.getUTCMinutes(), date.getUTCSeconds())
                customerId = ObjectId.createFromHexString(customerId)
                context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
                const db = await getDatabaseOneCustomer(context, customerId)
                const timeToSubtract = (9 * 60 + 45) * 1000;
                const response = await db.collection('IppSessions').updateOne({CustomerID: customerId, ReleaseCode: releaseCode},
                  {$set: {JobStatus: status, Message: message,  PrintingCompletedAt: new Date(now_utc) }})
                log.info('response: ', response)
                return {
                    message: 'Updated successfully',
                    statusCode: 200
                }
            } catch (error) {
                log.error(error)
                throw new Error(error)
            }
        },
    },
}
