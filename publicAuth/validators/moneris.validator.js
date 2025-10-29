const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const axios = require('axios')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const {
  getDatabaseOneCustomer,
  performDecryption, 
  getUtcTime,
  getUser,
  getConfig,
} = require('../helpers/util')
const { 
  PAYMENT_TYPE: { MONERIS },
  VALUE_ADDED_METHOD,
  MONERIS_ENV,
  MONERIS_URL
} = require('../helpers/constants')
const ERROR = require('../helpers/error-keys')

const responeCodes = [
  '000',
  '001',
  '002',
  '003',
  '004',
  '005',
  '006',
  '007',
  '008',
  '009',
  '010',
  '023',
  '024',
  '025',
  '026',
  '027',
  '028',
  '029',
]

const getStatus = (responseCodes, targetCode) => {
  if(responseCodes.includes(targetCode)) {
    return 'succeeded'
  } 
  return 'failed'
}

module.exports.monerisValidator = async (req, res, next) => {
  try {
    const { ticket, customerId, transactionStartTime } = req.body
    const db = await getDatabaseOneCustomer({}, customerId)
    const data = await getConfig(db, customerId, MONERIS)
    if (!data) return await setPaymentErrorResponse(res, ERROR.CONFIG_NOT_FOUND)

    const encryptedData = await performDecryption(data)
    const { StoreId, ApiToken, CheckoutId } = encryptedData.Moneris

    const monerisUrl = MONERIS_URL
    const requestAuth = {
      store_id: StoreId,
      api_token: ApiToken,
      checkout_id: CheckoutId,
      environment: MONERIS_ENV,
      action: 'receipt',
      ticket,
    }
    const transactionResponse = await axios.post(monerisUrl, requestAuth, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const success = transactionResponse.data.response.success
    if (success === 'false') return await setPaymentErrorResponse(res, Error.GATEWAY_INVALID_CREDENTIALS)

    const { request, receipt } = transactionResponse.data.response
    const { cust_info, billing } = request
    const { order_no, cust_id, amount, response_code } = receipt.cc
    const { first_name, last_name, email } = cust_info
    const { city, country } = billing

    const user = await getUser(db, customerId, cust_id)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)

    const responseData = {
      CustomerID: ObjectId.createFromHexString(customerId),
      UserID: ObjectId.createFromHexString(cust_id),
      TransactionID: order_no,
      Name: `${first_name} ${last_name}`,
      Username: user?.Username,
      Email: email,
      Amount: Number(amount),
      City: city,
      Country: country,
      Status: getStatus(responeCodes, response_code),
      PaymentMethod: MONERIS,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(transactionStartTime),
      TransactionEndTime: getUtcTime()
    }
    
    req.body.response = responseData
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}
