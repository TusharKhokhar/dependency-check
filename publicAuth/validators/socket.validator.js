const Joi = require('joi')
const { setValidationErrorResponse } = require('../services/api-handler')

module.exports = {
  sendStatus: (req, res, next) => {
    const sendStatus = Joi.object().keys({
      releaseCode: Joi.any(),
      action: Joi.any(),
      message: Joi.any(),
      status: Joi.any().required().error(new Error('status is required')),
      customerId: Joi.any(),
      sessionId: Joi.any(),
      tier: Joi.any(),
      dataUrl: Joi.any(),
      accessFile: Joi.any(),
      region: Joi.any(),
      jobId: Joi.any(),
      requestType: Joi.any(),
      attributes: Joi.any()
    })
    const { error } = sendStatus.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  }
}
