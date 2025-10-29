const { setErrorResponse, setSuccessResponse } = require('../services/api-handler')
const {
  getDatabaseOneCustomer,
  getCustomer,
  formObjectIds,
  addCreateTimeStamp
} = require('../helpers/util');
const ERROR = require('../helpers/error-keys');
const { addValue } = require('../services/addValue');
const { apiKey, domainName, region } = require('../config/config')
const { iotPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { retrieveEndpoint, publishToTopic } = require('../services/iot-handler')
const {
  TRANSACTION_NOT_FOUND,
  TRANSACTION_NOT_PROCESSED,
  TRANSACTION_FAILED
} = require('../helpers/error-messages')
const { TRANSACTION_SUCCESSFUL, NAYAX_SOCKET_RESPONSE } = require('../helpers/success-constants')
const { NAYAX_STATUS } = require('../helpers/constants')
const axios = require('axios')
const CustomLogger = require("../helpers/customLogger");
const { v4: uuidv4 } = require('uuid');
const log = new CustomLogger()

const sendPaymentStatus = async (connectionId, message, status) => {
  const config = {
    method: 'post',
    url: `https://api.${domainName}/public/sendStatus`,
    headers: {
      apikey: apiKey.web
    },
    data: {
      sessionId: connectionId,
      message,
      status,
      action: NAYAX_STATUS,
    },
  };
  console.log(config.data)
  await axios(config)
    .then(function (response) {
      return JSON.parse(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log('ERROR', error)
      return error;
    });
}

const publishMessageToIot = async (responseData, thing) => {
  try {
    const { TransactionID, Status, Amount, CustomerID } = responseData
    const policy = iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }

    const messageStatus = Status === 'succeeded' ? TRANSACTION_SUCCESSFUL :
      Status === 'failed' ? TRANSACTION_FAILED :
        Status === 'initiated' ? TRANSACTION_NOT_PROCESSED :
          TRANSACTION_NOT_FOUND;

    const message = {
      MessageID: uuidv4(),
      Action: 'nayax_status',
      TransactionID,
      Status,
      Amount,
      Message: messageStatus
    }

    const topic = `cmd/${thing.ThingType}/${CustomerID}/${thing.LocationID}/${thing.PrimaryRegion.ThingName}/nayaxStatus`
    const endpoint = await retrieveEndpoint(region, accessParams)
    await publishToTopic(topic, message, endpoint, accessParams)
  } catch (err) {
    console.log(err)
  }
}

module.exports.nayaxResponse = async (req, res) => {
  log.lambdaSetup(req, 'nayaxResponse', 'nayax.controller')
  try {
    let responseData = req.body.response
    responseData = formObjectIds(responseData)
    responseData = addCreateTimeStamp(responseData)

    const { TransactionID, CustomerID, Status, Device } = responseData
    const db = await getDatabaseOneCustomer({}, CustomerID)
    const customer = await getCustomer(db, CustomerID, res)
    const paymentData = await db.collection('PaymentStats').findOne({ TransactionID: responseData.TransactionID })

    if (Device === 'Web' || Device === 'Mobile') {
      const connection = await db.collection('Connections').findOne({ transactionId: TransactionID })
      console.log('Logging the connection: ', connection)
      const connectionId = connection?.connectionId

      switch (Status) {
        case 'succeeded':
          await db.collection('PaymentStats').updateOne({ TransactionID }, { $set: responseData })
          await addValue(responseData, db, customer)
          if (connectionId) {
            await sendPaymentStatus(connectionId, TRANSACTION_SUCCESSFUL, true)
            return await setSuccessResponse({ message: NAYAX_SOCKET_RESPONSE }, res)
          }
          return await setErrorResponse(null, ERROR.NAYAX_ERROR_RESPONSE, res)
        case 'failed':
          await db.collection('PaymentStats').updateOne({ TransactionID }, { $set: responseData })
          if (connectionId) {
            await sendPaymentStatus(connectionId, TRANSACTION_FAILED, false)
            return await setSuccessResponse({ message: NAYAX_SOCKET_RESPONSE }, res)
          }
          return await setErrorResponse(null, ERROR.NAYAX_ERROR_RESPONSE, res)
        case 'initiated':
          await sendPaymentStatus(connectionId, TRANSACTION_NOT_PROCESSED, false)
          return await setSuccessResponse({ message: NAYAX_SOCKET_RESPONSE }, res)
        default:
          await sendPaymentStatus(connectionId, TRANSACTION_NOT_FOUND, false)
          return await setSuccessResponse({ message: NAYAX_SOCKET_RESPONSE }, res)
      }
    } else {
      const thing = await db.collection('Things').findOne({ CustomerID: CustomerID, IsActive: true, IsDeleted: false, _id: paymentData.ThingID })
      await db.collection('PaymentStats').updateOne({ TransactionID }, { $set: responseData })
      await publishMessageToIot(responseData, thing)
      return await setSuccessResponse({ message: 'Transaction response sent to IoT Device.' }, res, req)
    }
  } catch (error) {
    log.error(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}