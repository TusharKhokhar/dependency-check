const dot = require('dot-object')
const {
    formObjectIds, addCreateTimeStamp, getDatabaseOneCustomer,
    getDatabaseForGetAllAPI, verifyUserAccess, verifyKioskAndUserAccess
} = require('../../helpers/util')
const model = require('../../models/index')
const { AuditLogs} = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { fromZonedTime } = require('date-fns-tz')
const {customerSecurity} = require("../../utils/validation");
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
    Mutation: {
        async addAuditLogs (_, { addAuditLogInput }, context, info) {
            log.lambdaSetup(context, 'auditLogs', 'addAuditLogs')
            addAuditLogInput = formObjectIds(addAuditLogInput)
            const {
                Type,
                Date,
                FileName,
                ReleaseCode,
                ErrorMessage,
                CustomerID,
                QuotaGroupID,
                QuotaGroupName,
                ThingName,
                DisconnectReason,
                OfflineDuration,
                ThingID,
                ThingLabel,
                ThingType,
            } = addAuditLogInput

            let newAuditLog = {
                Type,
                Date,
                FileName,
                ReleaseCode,
                ErrorMessage,
                CustomerID,
                QuotaGroupID: QuotaGroupID ? ObjectId.createFromHexString(QuotaGroupID) : null,
                QuotaGroupName,
                ThingName,
                DisconnectReason,
                OfflineDuration,
                ThingID,
                ThingLabel,
                ThingType,
            }
            context.data.isKiosk  ? verifyKioskAndUserAccess(context, newAuditLog.CustomerID) : verifyUserAccess(context, newAuditLog.CustomerID)
            const db = await getDatabaseOneCustomer(context, CustomerID)
            newAuditLog.IsActive = true;
            newAuditLog = addCreateTimeStamp(newAuditLog)
            try {
                const { insertedId } = await db.collection(AuditLogs).insertOne(newAuditLog)
                return await db.collection(AuditLogs).findOne({ _id: insertedId })
            } catch (error) {
                console.log(error)
                throw new Error(error)
            }
        }
    },

    Query: {
        async getAuditLogs (_, { paginationInput, customerIds, typeOf, dateFrom: dateStart,
            dateTo: dateEnd, message, timezone }, context) {
            log.lambdaSetup(context, 'auditLogs', 'getAuditLogs')
            let {
                pageNumber,
                limit,
                sort,
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
            const timeZone = timezone || 'America/Chicago'
            let {
                dateFrom, dateTo
            } = await convertFilterTimeFilters({dateFrom: dateStart, dateTo: dateEnd, timeZone})
            const db = await getDatabaseForGetAllAPI(context, customerIds)
            const collection = db.collection(AuditLogs)
            return await model.auditLogs.getAuditLogsInformation({
                sort, pageNumber, limit, sortKey, customerIds, collection, typeOf, dateFrom, dateTo, message
            }).then(response => {
                return response
            }).catch(err => {
                console.log(err)
                throw new Error(err)
            })
        },

    }
}

let convertFilterTimeFilters = async (filters) => {
    log.info(filters);
    if(filters && filters.dateFrom && filters.dateTo){
        filters.dateFrom = await fromZonedTime(filters.dateFrom, filters.timeZone)
        filters.dateTo = await fromZonedTime(filters.dateTo, filters.timeZone)
        filters.dateFrom = new Date(filters.dateFrom)
        filters.dateTo = new Date(filters.dateTo)
        return filters
    } else {
        return filters
    }
}


// Function calls

