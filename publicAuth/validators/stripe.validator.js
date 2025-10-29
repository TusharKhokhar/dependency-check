const Stripe = require('stripe');
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const { PAYMENT_TYPE: { STRIPE }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { 
  getDatabaseOneCustomer,
  performDecryption,
  getUtcTime,
  getConfig,
  getUser
} = require('../helpers/util');
const ERROR = require('../helpers/error-keys')

const parseWebhookEventData = (event, encryptedData, customerId) => {
  const { PaymentType } = encryptedData
  const { id, amount, currency, status, metadata } = event.data.object
  const { city, country } = event.data.object.billing_details.address
  const { email, name } = event.data.object.billing_details
  const { seller_message } = event.data.object.outcome
  const { user_id, user_name, trans_start_time } = metadata

  let paymentStats = {
    TransactionID: id,
    CustomerID: ObjectId.createFromHexString(customerId),
    UserID: ObjectId.createFromHexString(user_id),
    Amount: Number(amount / 100),
    Currency: currency,
    City: city,
    Country: country,
    Username: user_name,
    Email: email,
    Name: name,
    SellerMessage: seller_message,
    Status: status,
    PaymentMethod: PaymentType,
    ValueAddedMethod: VALUE_ADDED_METHOD,
    TransactionStartTime: getUtcTime(trans_start_time),
    TransactionEndTime: getUtcTime()
  }

  return paymentStats;
}

module.exports.stripeValidator = async(req, res, next) => {
  const payload = req.rawBody;
  const signature = req.headers["stripe-signature"];
  const customerId = req.params.id

  try {
    if (!req.rawBody || typeof req.rawBody !== "object") {
      await setErrorResponse(null, ERROR.MISSING_STRIPE_HEADERS, res)
    }
    
    if (!req.headers["stripe-signature"] || typeof req.headers["stripe-signature"] !== "string") {
      await setErrorResponse(null, ERROR.MISSING_STRIPE_HEADERS, res)
    }

    const db = await getDatabaseOneCustomer({}, customerId)
    const data = await getConfig(db, customerId, STRIPE)
    if (!data) return await setPaymentErrorResponse(res, ERROR.CONFIG_NOT_FOUND)

    let paymentStats
    const encryptedData = await performDecryption(data);
    const { SecretKey, WebhookSecret, PublicKey } = encryptedData.Stripe
    const stripe = new Stripe(SecretKey)
    let event = stripe.webhooks.constructEvent(payload, signature, WebhookSecret || PublicKey);
    const { type } = event
    if(type === 'charge.succeeded' || type === 'charge.failed') {
      paymentStats = parseWebhookEventData(event, encryptedData, customerId);
    } else {
      console.log(`Unhandled event type ${type}`);
    }

    const user = await getUser(db, paymentStats.CustomerID, paymentStats.UserID)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)

    req.body.response = paymentStats 
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}

