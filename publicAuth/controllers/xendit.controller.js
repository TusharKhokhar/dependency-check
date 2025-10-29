const { addValue } = require('../services/addValue')
const { setErrorResponse } = require('../services/api-handler')
const { getDatabaseOneCustomer, insertToDb, getCustomer } = require('../helpers/util')
const ERROR = require('../helpers/error-keys')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.xenditResponse = async (req, res) => {
  log.lambdaSetup(req, 'xenditResponse', 'xendit.controller')
  try {
    const responseData = req.body.response

    const db = await getDatabaseOneCustomer({}, responseData.CustomerID)
    const customer = await getCustomer(db, responseData.CustomerID, res)

    const transactionExists = await db.collection('PaymentStats').findOne({ TransactionID: responseData.TransactionID })

    if (!transactionExists) {
      await insertToDb(responseData, db)
      if (responseData.Status !== 'failed') await addValue(responseData, db, customer)
      return res.sendStatus(200)
    } 
    return res.sendStatus(200)
  } catch (err) {
    console.log(err)
    log.error(err.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}
