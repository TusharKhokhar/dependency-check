const { setErrorResponse } = require('../services/api-handler')
const { getDatabaseOneCustomer, saveAndReturnHeartlandRes, getCustomer } = require('../helpers/util')
const ERROR = require('../helpers/error-keys')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.heartlandResponse = async (req, res) => {
  log.lambdaSetup(req, 'heartlandResponse', 'authorize.controller')
  try {
    const responseData = req.body.response
    const { SUCCESS_URL, FAILURE_URL } = req.body

    const db = await getDatabaseOneCustomer({}, responseData.CustomerID)
    const customer = await getCustomer(db, responseData.CustomerID, res)

    await saveAndReturnHeartlandRes(res, db, responseData, customer, SUCCESS_URL, FAILURE_URL)
  } catch (error) {
    log.error(error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}