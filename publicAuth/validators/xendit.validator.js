const { Xendit } = require('xendit-node')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const {
  getDatabaseOneCustomer,
  performDecryption,
  getUtcTime,
  getConfig,
  getUser,
} = require('../helpers/util')
const { PAYMENT_TYPE: { XENDIT }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const CustomLogger = require('../helpers/customLogger')
const log = new CustomLogger()

const getInvoiceResponse = async (id, secretKey) => {
  const xendit = new Xendit({ secretKey: secretKey })
  const { Invoice } = xendit
  return await Invoice.getInvoiceById({
      invoiceId: id,
    })
}

module.exports.xenditValidator = async (req, res, next) => {
  try {
    const { id } = req.body
    const customerId = req.params.id
    
    const db = await getDatabaseOneCustomer({}, customerId)
    const data = await getConfig(db, customerId, XENDIT)
    if (!data) return await setPaymentErrorResponse(res, ERROR.CONFIG_NOT_FOUND)

    const encryptedData = await performDecryption(data)
    const secretKey = encryptedData.Xendit.SecretKey

    const result = await getInvoiceResponse(id, secretKey)
    const { id: invoice_id, amount, customer, currency, status } = result
    const { customerId: userId, email, surname, givenNames } = customer

    const user = await getUser(db, customerId, userId)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)

    const responseData = {
      UserID: ObjectId.createFromHexString(userId),
      CustomerID: ObjectId.createFromHexString(customerId),
      TransactionID: invoice_id,
      Username: givenNames,
      Email: email,
      Amount: Number(amount),
      Currency: currency,
      Status: status === "PAID" ? "succeeded" : "failed",
      PaymentMethod: XENDIT,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(surname),
      TransactionEndTime: getUtcTime()
    }

    req.body.response = responseData
    next()
  } catch (err) {
    log.error("Error in xenditValidator => ", err)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}
