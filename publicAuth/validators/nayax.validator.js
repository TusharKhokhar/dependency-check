const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { PAYMENT_TYPE: { NAYAX }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { getUtcTime } = require('../helpers/util')
const { setErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const { getDb } = require('../config/db')

module.exports.nayaxValidator = async(req, res, next) => {
  try {
    const { RemoteStartTransactionId, RemoteStartAuthStatus } = req?.body
    const { Verdict } = RemoteStartAuthStatus
    let db = await getDb()
    const paymentData = await db.collection('PaymentStats').findOne({ TransactionID: RemoteStartTransactionId })
    const {
      CustomerID,
      TransactionID,
      Amount,
      TransactionStartTime,
      Device,
      ThingID
    } = paymentData
    req.body.response = {
      CustomerID: ObjectId.createFromHexString(CustomerID),
      ThingID: ObjectId.createFromHexString(ThingID),
      TransactionID,
      Amount,
      Device,
      PaymentMethod: NAYAX,
      Status: Verdict === 'Approved' ? 'succeeded' : 'failed',
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(TransactionStartTime),
      TransactionEndTime: getUtcTime(),
    }
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}