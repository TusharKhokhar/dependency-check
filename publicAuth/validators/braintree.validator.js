const crypto = require('crypto')
const braintree = require('braintree')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { Stage } = require('../config/config')
const { PAYMENT_TYPE: { BRAINTREE }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const {
  performDecryption,
  getDatabaseOneCustomer,
  getUtcTime,
  getUser,
  getConfig,
} = require('../helpers/util')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')

module.exports.braintreeValidator = async (req, res, next) => {
  try {
  const {
    payment_method_nonce,
    amount,
    userId,
    customerId,
    firstName,
    lastName,
    email,
    city,
    country,
    transactionStartTime,
  } = req.body

    const db = await getDatabaseOneCustomer({}, customerId)
    const data = await getConfig(db, customerId, BRAINTREE)
    if (!data) return await setPaymentErrorResponse(res, ERROR.CONFIG_NOT_FOUND)

    const encryptedData = await performDecryption(data)
    const { MerchantId, PublicKey, PrivateKey } = encryptedData.Braintree

    const gateway = new braintree.BraintreeGateway({
      environment: Stage === 'prod' ? braintree.Environment.Production : braintree.Environment.Sandbox,
      merchantId: MerchantId,
      publicKey: PublicKey,
      privateKey: PrivateKey,
    })

    const result = await gateway.transaction.sale({
      amount,
      orderId: crypto.randomBytes(64).toString('hex').slice(0, 20),
      customer: {
        firstName,
        lastName,
        email,
      },
      billing: {
        countryName: country,
      },
      paymentMethodNonce: payment_method_nonce,
      options: {
        submitForSettlement: true,
      },
    })

    const { id, currencyIsoCode, processorResponseText, status } = result.transaction
    const user = await getUser(db, customerId, userId)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)
    const { Username } = user

    let responseData = {
      TransactionID: id,
      UserID: ObjectId.createFromHexString(userId),
      CustomerID: ObjectId.createFromHexString(customerId),
      Username,
      Name: `${firstName} ${lastName}`,
      Email: user.PrimaryEmail ? user.PrimaryEmail : null,
      Amount: Number(amount),
      Currency: currencyIsoCode,
      Status: (status === "submitted_for_settlement" || status === "authorized") ? "succeeded" : "failed",
      SellerMessage: processorResponseText,
      City: city,
      Country: country,
      PaymentMethod: BRAINTREE,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(transactionStartTime),
      TransactionEndTime: getUtcTime(),
    }

    req.body.success = result.success
    req.body.response = responseData
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}
