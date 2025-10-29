const Joi = require('joi')
const { setValidationErrorResponse } = require('../services/api-handler')

module.exports = {
  sendPrintJobsValidate: (req, res, next) => {
    const customerSignup = Joi.object().keys({
      fileNames: Joi.any().required().error(new Error('file names are required')),
      releaseCode: Joi.string(),
      device: Joi.string().required().error(new Error('Customer Name is required')),
      sessionId: Joi.any()
    })
    const { error } = customerSignup.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  deleteValidate: (req, res, next) => {
    const customerSignup = Joi.object().keys({
      fileNames: Joi.any().required().error(new Error('file names are required')),
      releaseCode: Joi.string()
    })
    const { error } = customerSignup.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  userValidate : (req, res, next) => {
    const validateUser = Joi.object().keys({
      userName: Joi.alternatives()
        .try(Joi.string(), Joi.number())
        .required()
        .error(new Error("Username is required")),
      password: Joi.string().optional(),
      identityProvider: Joi.string().required().error(new Error('Identity Provider is required'))
    })
    const { error } = validateUser.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  }
}