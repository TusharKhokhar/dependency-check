const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { PAYMENT_TYPE: { HEARTLAND }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { getDatabaseOneCustomer, getUtcTime, getUser, } = require('../helpers/util')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')


module.exports.heartlandValidator = async (req, res, next) => {
  const {
    RESULT,
    ORDER_ID,
    MESSAGE,
    AMOUNT,
    HPP_CUSTOMER_FIRSTNAME,
    HPP_CUSTOMER_LASTNAME,
    HPP_BILLING_CITY,
    HPP_CUSTOMER_EMAIL,
    USER_ID,
    CUSTOMER_ID,
    BILLING_CO,
    CUSTOM_CURRENCY,
    TRANSACTION_START_TIME
  } = req.body

  try {
    const db = await getDatabaseOneCustomer({}, CUSTOMER_ID)

    const user = await getUser(db, CUSTOMER_ID, USER_ID)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)
    const { Username } = user

    const responseData = {
      UserID: ObjectId.createFromHexString(USER_ID),
      CustomerID: ObjectId.createFromHexString(CUSTOMER_ID),
      TransactionID: ORDER_ID,
      Username,
      Name: `${HPP_CUSTOMER_FIRSTNAME} ${HPP_CUSTOMER_LASTNAME}`,
      Email: HPP_CUSTOMER_EMAIL,
      Amount: Number(AMOUNT),
      Currency: CUSTOM_CURRENCY,
      City: HPP_BILLING_CITY,
      Country: BILLING_CO,
      SellerMessage: MESSAGE,
      Status: RESULT === '00' ? 'succeeded' : 'failed',
      PaymentMethod: HEARTLAND,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(TRANSACTION_START_TIME),
      TransactionEndTime: getUtcTime()
    }
    
    req.body.response = responseData
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}