const { addValue } = require('../services/addValue')
const { setErrorResponse } = require('../services/api-handler');
const { getDatabaseOneCustomer, insertToDb, getCustomer } = require('../helpers/util')
const ERROR = require('../helpers/error-keys')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.braintreeTransaction = async (req, res) => {
  log.lambdaSetup(req, 'braintreeTransaction', 'braintree.controller')
  try {
    const { response, successURL, failureURL, success } = req.body
    
    const db = await getDatabaseOneCustomer({}, response.CustomerID)
    const customer = await getCustomer(db, response.CustomerID, res)

    const transactionExists = await db.collection('PaymentStats').findOne({ TransactionID: response.TransactionID })

    if (!transactionExists) {
      await insertToDb(response, db)
      if (response.Status === "succeeded") await addValue(response, db, customer)
      if (success) {
        res.redirect(successURL)
      } else {
        res.redirect(failureURL)
      }
    } else {
      return
    }
  } catch (error) {
    log.error(error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}
