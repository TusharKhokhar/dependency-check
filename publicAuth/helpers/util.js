const Joi = require('joi')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { decryptText } = require("./encryptDecrypt");
const { getDb, isolatedDatabase } = require('../config/db')
const ERROR = require('../helpers/error-keys')
const { setSuccessResponse, setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const { TRANSACTION_RESPONSE_ADDED, TRANSACTION_ALREADY_EXISTS } = require('../helpers/success-constants')
const { PAYMENT_TYPE: { XENDIT, STRIPE, MONERIS, BRAINTREE, AUTHORIZENET, IPAY88 }, STANDARD_TIER } = require('../helpers/constants')
const { addValue } = require('../services/addValue');
const moment = require('moment-timezone');
const { TRANSACTION_NOT_FOUND } = require('./error-messages');
const CustomLogger = require('./customLogger');
const { domainName } = require('../config/config');
const log = new CustomLogger()

const getDatabaseOneCustomer = async (context, customerId) => {
  let db = await getDb()
  const customerData = customerId ? await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 }) : null
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    db = await isolatedDatabase(customerData.DomainName)
  }
  return db
}

const getDbByDomain = async (domain) => {
  let db = await getDb()
  const customerData = domain ? await db.collection('Customers').findOne({ DomainName: domain, IsDeleted: false }, { DomainName: 1, Tier: 1 }) : null
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    db = await isolatedDatabase(customerData.DomainName)
  }
  return {db, customerData}
}

const performDecryption = async (data) => {
  if (data.PaymentType === STRIPE && data.Stripe.SecretKey) {
    data.Stripe.PublicKey = data.Stripe?.PublicKey ? await decryptText(data.Stripe.PublicKey) : null
    data.Stripe.SecretKey = await decryptText(data.Stripe.SecretKey)
    data.Stripe.WebhookSecret = data.Stripe?.WebhookSecret ? await decryptText(data.Stripe.WebhookSecret) : null
    return data
  }

  if (data.PaymentType === XENDIT && data.Xendit.SecretKey) {
    data.Xendit.SecretKey = await decryptText(data.Xendit.SecretKey)
    return data
  }

  if (data.PaymentType === MONERIS && data.Moneris.ApiToken && data.Moneris.StoreId && data.Moneris.CheckoutId) {
    data.Moneris.ApiToken = await decryptText(data.Moneris.ApiToken)
    data.Moneris.StoreId = await decryptText(data.Moneris.StoreId)
    data.Moneris.CheckoutId = await decryptText(data.Moneris.CheckoutId)
    return data
  }

  if (data.PaymentType === BRAINTREE && data.Braintree.PrivateKey && data.Braintree.PublicKey && data.Braintree.MerchantId) {
    data.Braintree.PrivateKey = await decryptText(data.Braintree.PrivateKey)
    data.Braintree.PublicKey = await decryptText(data.Braintree.PublicKey)
    data.Braintree.MerchantId = await decryptText(data.Braintree.MerchantId)
    return data
  }

  if (data.PaymentType === AUTHORIZENET && data.AuthorizeNet.TransactionKey && data.AuthorizeNet.ApiLogin) {
    data.AuthorizeNet.TransactionKey = await decryptText(data.AuthorizeNet.TransactionKey)
    data.AuthorizeNet.ApiLogin = await decryptText(data.AuthorizeNet.ApiLogin)
    return data
  }
}

const formObjectIds = (data) => {
  if (data.CustomerID) {
    data.CustomerID = ObjectId.createFromHexString(data.CustomerID)
  }
  if (data.RoleType) {
    data.RoleType = ObjectId.createFromHexString(data.RoleType)
  }
  if (data.LocationID) {
    data.LocationID = ObjectId.createFromHexString(data.LocationID)
  }
  if (data.AreaID) {
    data.AreaID = ObjectId.createFromHexString(data.AreaID)
  }
  if (data.DeviceID) {
    if (Array.isArray(data.DeviceID)) {
      data.DeviceID = data.DeviceID.map(gr => ObjectId.createFromHexString(gr))
    } else {
      data.DeviceID = ObjectId.createFromHexString(data.DeviceID)
    }
  }
  if (data.ThingID) {
    data.ThingID = ObjectId.createFromHexString(data.ThingID)
  }
  if (data.DefaultDevice) {
    data.DefaultDevice = ObjectId.createFromHexString(data.DefaultDevice)
  }
  if (data.GroupID) {
    if (Array.isArray(data.GroupID)) {
      data.GroupID = data.GroupID.map(gr => ObjectId.createFromHexString(gr))
    } else {
      data.GroupID = ObjectId.createFromHexString(data.GroupID)
    }
  }
  if (data.CustomizationID) {
    data.CustomizationID = ObjectId.createFromHexString(data.CustomizationID)
  }
  if (data.RulesID) {
    data.RulesID = ObjectId.createFromHexString(data.RulesID)
  }
  if (data.DefaultAutomaticDeliveryLocation) {
    data.DefaultAutomaticDeliveryLocation = ObjectId.createFromHexString(data.DefaultAutomaticDeliveryLocation)
  }
  if (data.DefaultLmsValidateThing) {
    data.DefaultLmsValidateThing = ObjectId.createFromHexString(data.DefaultLmsValidateThing)
  }
  if(data.UserID) {
    data.UserID = ObjectId.createFromHexString(data.UserID)
  }
  return data
}

const addCreateTimeStamp = (data, creater) => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  data.CreatedAt = new Date(nowUtc)
  data.UpdatedAt = new Date(nowUtc)
  data.IsActive = true
  data.IsDeleted = false
  // eslint-disable-next-line no-unused-expressions
  creater ? data.CreatedBy = creater : creater
  return data
}

const validatePaymentRoutes = (excludedRoutes, reqUrl) => {
  if (reqUrl.includes("/public/stripe/webhook") || reqUrl.includes('/public/xendit/response') || reqUrl.includes('/public/authorize/response') || reqUrl.includes('/public/ipay88/response')) {
    const currentUrl = "/" + reqUrl.split("/").slice(1, 4).join("/");
    return excludedRoutes.includes(currentUrl);
  }
  return excludedRoutes.includes(reqUrl);
}

const validateInputs = async (responseData, schema) => {
  const { error, value } = Joi.object(schema).validate(responseData);
  if (error) {
    throw new Error(`${error.details[0].message}`);
  }
  return value;
};

const validateWebhookFields = async (responseData, gatewayWebhookSchema) => {
  const { PaymentMethod } = responseData
  const selectedSchema = gatewayWebhookSchema[PaymentMethod]
  return await validateInputs(responseData, selectedSchema) 
}

const insertToDb = async (responseData, db) => {
  try {
    responseData = formObjectIds(responseData)
    responseData = addCreateTimeStamp(responseData)
  
    await db.collection('PaymentStats').insertOne(responseData)
  } catch(e) {
    console.log(e)
    throw new Error(e)
  }
}

const updateToDbBySessionId = async (responseData, db) => {
  try {
    responseData = formObjectIds(responseData)
    responseData = addCreateTimeStamp(responseData)
    await db.collection('PaymentStats').updateOne({ SessionID: responseData.SessionID }, { $set: responseData })
  } catch(e) {
    log.error("Error in updateToDbBySessionId => ", e)
    throw new Error(e)
  }
}

const checkResExistsAndSave = async (db, transactionId, responseData, customer, res, req) => {
  try {
    const transactionExists = await db.collection('PaymentStats').findOne({ TransactionID: transactionId })
    if (!transactionExists) {
      if (responseData.Status !== 'failed') {
        await insertToDb(responseData, db)
        await addValue(responseData, db, customer)
        return await setSuccessResponse({ message: TRANSACTION_RESPONSE_ADDED }, res, req)
      } else {
        await insertToDb(responseData, db)
        return await setErrorResponse(null, ERROR.TRANSACTION_DECLINED, res)
      }
    } else {
      return await setSuccessResponse({ message: TRANSACTION_ALREADY_EXISTS }, res, req)
    }
  } catch(e) {
    console.log(e)
    throw new Error(e)
  }
}

const paymentRedirectUrl = (type, domain, source, err = "") => {
  const isMobile = ["ios", "android", "mobile"].includes(source?.toLowerCase?.());

  const baseUrl = isMobile
    ? `https://mobile.${domainName}/add-value/`
    : `https://${domain}.${domainName}/add-value/`;

  if (type === "success") {
    return `${baseUrl}payment-success`;
  } else if (type === "error") {
    return `${baseUrl}payment-error?error=${err}`;
  } else {
    throw new Error("Invalid redirect type. Must be 'success' or 'error'.");
  }
};

const checkResExistsAndUpdateBySessionId = async (
  db,
  sessionID,
  responseData,
  customer,
  res,
  req,
  Source
) => {
  try {
    const transactionExists = await db
      .collection("PaymentStats")
      .findOne({ SessionID: sessionID });
    const domain = customer.DomainName;
    if (transactionExists) {
      if (responseData.Status !== "failed") {
        await updateToDbBySessionId(responseData, db);
        await addValue(responseData, db, customer);
        if (responseData?.PaymentMethod === IPAY88) {
          res.redirect(paymentRedirectUrl("success", domain, Source));
        } else {
          return setSuccessResponse(
            { message: TRANSACTION_RESPONSE_ADDED },
            res,
            req
          );
        }
      } else {
        await updateToDbBySessionId(responseData, db);
        if (responseData?.PaymentMethod === IPAY88) {
          res.redirect(paymentRedirectUrl("error", domain, Source, responseData?.ErrDesc));
        } else {
          return setErrorResponse(null, ERROR.TRANSACTION_DECLINED, res);
        }
      }
    } else {
      if (responseData?.PaymentMethod === IPAY88) {
          const isMobile = ["ios", "android", "mobile"].includes(
            Source?.toLowerCase?.()
          );
          const baseUrl = isMobile
            ? `https://mobile.${domainName}/add-value/payment-success`
            : `https://${domain}.${domainName}/add-value/payment-error?error=${TRANSACTION_NOT_FOUND}`;
          res.redirect(baseUrl);
      } else {
        return setSuccessResponse({ message: TRANSACTION_NOT_FOUND }, res, req);
      }
    }
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

const getHTMLContent = (url) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        #message {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #333;
          color: white;
          text-align: center;
          padding: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <script>
        const messageDiv = document.createElement("div");
        messageDiv.id = "message";
        messageDiv.textContent = "Redirecting back to the ePRINTit website...";
        document.body.appendChild(messageDiv);
        setTimeout(() => {
          messageDiv.style.display = "none";
          location.href = "${url}";
        }, 3000);
      </script>
    </body>
  </html>
  `
}

const saveAndReturnHeartlandRes = async (res, db, responseData, customer, successURL, failureURL) => {
  const { TransactionID, Status } = responseData
  const transactionExists = await db.collection('PaymentStats').findOne({ TransactionID })
  
  if (!transactionExists) {
    if (Status !== 'failed') {
      await insertToDb(responseData, db)
      await addValue(responseData, db, customer)
      res.send(Buffer.from(getHTMLContent(successURL)))
    } else {
      await insertToDb(responseData, db)
      res.send(Buffer.from(getHTMLContent(failureURL)))
    }
  } else {
    res.send(Buffer.from(getHTMLContent(failureURL)))
  }
}

const epochToUtc = (epochTime) => {
  const utcTime = new Date(epochTime * 1000);
  return utcTime.toISOString();
};

const getUtcTime = (date = '') => {
  let utc
  if(!date) {
    utc = new Date(new Date().toUTCString());
  } else {
    utc = new Date(date)
  }
  return utc;
};

const getConfig = async (db, customerId, paymentType) => {
  const data = await db.collection('Payments').findOne({
    CustomerID: ObjectId.createFromHexString(customerId),
    IsActive: true,
    IsDeleted: false,
      PaymentType: paymentType
  })

  return data
}

const getUser = async (db, customerId, userId) => {
  const user = await db.collection('Users').findOne({
    _id: ObjectId.createFromHexString(userId),
    CustomerID: ObjectId.createFromHexString(customerId),
    IsActive: true,
    IsDeleted: false,
  })

  return user
}

const getCustomer = async (db, customerId, res) => {
  const customer = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) })
  if (!customer) return await setPaymentErrorResponse(res, ERROR.WRONG_CUSTOMER_ID)
  return customer
}

const getPaymentStatsBySessionId = async (db, sessionID, paymentMethod, status, res) => {
  const paymentStats = await db.collection('PaymentStats').findOne({ SessionID : sessionID, PaymentMethod : paymentMethod, Status : status})
  if (!paymentStats) return await setPaymentErrorResponse(res, ERROR.TRANSACTION_NOT_PROCESSED)
  return paymentStats
}

const convertCSTtoUTC = (cstDateStr) => {
  return moment.tz(cstDateStr, "MMM D, YYYY hh:mm A", "America/Chicago").utc().toDate();
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  getDatabaseOneCustomer,
  performDecryption,
  formObjectIds,
  addCreateTimeStamp,
  validatePaymentRoutes,
  insertToDb,
  checkResExistsAndSave,
  epochToUtc,
  getUtcTime,
  validateInputs,
  validateWebhookFields,
  getConfig,
  getUser,
  saveAndReturnHeartlandRes,
  getCustomer,
  getDbByDomain,
  convertCSTtoUTC,
  getPaymentStatsBySessionId,
  checkResExistsAndUpdateBySessionId,
  escapeRegex,
  paymentRedirectUrl,
}


