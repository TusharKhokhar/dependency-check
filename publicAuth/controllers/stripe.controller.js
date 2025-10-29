const { setErrorResponse } = require('../services/api-handler')
const { checkResExistsAndSave, getDatabaseOneCustomer, getCustomer } = require('../helpers/util');
const ERROR = require('../helpers/error-keys')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.stripeWebhook = async (req, res) => {
  log.lambdaSetup(req, 'stripeWebhook', 'stripe.controller')
  try {
    const responseData = req.body.response
    const db = await getDatabaseOneCustomer({}, responseData.CustomerID)    
    const customer = await getCustomer(db, responseData.CustomerID, res)

    await checkResExistsAndSave(db, responseData.TransactionID, responseData, customer, res, req)
  } catch (error) {
    log.error('Error: ', error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}
