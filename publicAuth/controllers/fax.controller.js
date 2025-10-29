const CustomLogger = require("../helpers/customLogger");
const {getDatabaseOneCustomer, getCustomer, getDbByDomain, formObjectIds, addCreateTimeStamp, convertCSTtoUTC} = require("../helpers/util");
const {setErrorResponse, setSuccessResponse} = require("../services/api-handler");
const ERROR = require("../helpers/error-keys");
const log = new CustomLogger()

module.exports.faxCallback = async (req, res) => {
    console.log(req.body);
    try {
        const {
            FaxDetailsID,
            FileName,
            SentStatus,
            AccountCode,
            DateSent,
            Duration,
            RemoteID,
            ErrorCode,
            Size
        }= req.body
        log.lambdaSetup(req, 'fax.controller', 'faxCallback')
        const {db, customerData: customer} = await getDbByDomain(AccountCode)
        if (!customer) {
            await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res)
        } else {
            const sentDate = convertCSTtoUTC(DateSent)
            const {value: updateFaxRes} = await db.collection('FaxUploads').findOneAndUpdate({FaxDetailsID: FaxDetailsID, AccountCode: AccountCode},
              {$set: {
                      FileName,
                      SentStatus,
                      DateSent: sentDate ,
                      RemoteID,
                      ErrorCode,
                      Duration,
                      Size
                  }}
            )
            let formUsageRecord = {
                "Type" : "fax",
                  "TransactionDate" : updateFaxRes.DateQueued,
                  "TransactionStartTime" : updateFaxRes.DateQueued,
                  "TransactionEndTime" : sentDate,
                  "TransactionID" : FaxDetailsID,
                  "TimeZone" : customer.TimeZone,
                  "Customer" : customer.CustomerName,
                  "CustomerID" : customer._id,
                  "Location" : updateFaxRes.Location,
                  "LocationID" : updateFaxRes.LocationID,
                  "Thing" : updateFaxRes.Thing,
                  "ThingID" : updateFaxRes.ThingID,
                  "EmailAddress" : updateFaxRes.SenderEmail,
                  "Fax" : {
                    "JobDeliveryMethod" : updateFaxRes.Platform,
                      "DocumentName" : updateFaxRes.FileName,
                      "DocumentSize" : Size,
                      SentStatus,
                      RemoteID,
                      ErrorCode,
                      Duration
                },
                "IsDeleted" : false,
                "IsActive" : true
            }
            formUsageRecord = formObjectIds(formUsageRecord)
            formUsageRecord = addCreateTimeStamp(formUsageRecord)
            await db.collection('Usage').insertOne(formUsageRecord)
            setSuccessResponse('Updated status', res, req)
        }
    } catch (error) {
        log.error(error)
        setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
    }
}

const utcDateGet = (dateSent) => {
    const date = new Date(dateSent)
    const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
      date.getUTCDate(), date.getUTCHours(),
      date.getUTCMinutes(), date.getUTCSeconds())
    return new Date(nowUtc)
}