const { setErrorResponse } = require('../services/api-handler')
const { getDatabaseOneCustomer, checkResExistsAndUpdateBySessionId, getCustomer } = require('../helpers/util')
const ERROR = require('../helpers/error-keys')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.authorizeResponse = async (req, res) => {
  log.lambdaSetup(req, 'authorizeResponse', 'authorize.controller')
  try {
    const { response } = req.body
    const db = await getDatabaseOneCustomer({}, response.CustomerID)
    const customer = await getCustomer(db, response.CustomerID, res)
    await checkResExistsAndUpdateBySessionId(db, response.SessionID, response, customer, res, req)
  } catch (error) {
    log.error('Error: ', error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}