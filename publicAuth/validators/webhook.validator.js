const { validateWebhookFields } = require('../helpers/util');
const { gatewayWebhookSchema } = require('../helpers/schema')
const { setErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')

module.exports.webhookRespnoseValidator = async (req, res, next) => {
  try {
    const responseData = req.body.response
    await validateWebhookFields(responseData, gatewayWebhookSchema) 
    next()
  } catch(error) {
    console.log(error)
    await setErrorResponse(null, ERROR.INAVLID_RESPONSE_OR_SCHEMA, res)
  }
}