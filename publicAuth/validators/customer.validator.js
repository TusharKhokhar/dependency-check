const Joi = require('joi')
const { setValidationErrorResponse } = require('../services/api-handler')

module.exports = {
  customerSignup: (req, res, next) => {
    const customerSignup = Joi.object().keys({
      Label: Joi.string().required().error(new Error('Label is required')),
      CustomerName: Joi.string().required().error(new Error('Customer Name is required')),
      CustomerType: Joi.string().required().error(new Error('Customer Type is required')),
      DisplayName: Joi.string().required().error(new Error('Display Name is required')),
      Description: Joi.string().required().error(new Error('Description is required')),
      DomainName: Joi.string().required().error(new Error('Domain Name is required')),
      Tier: Joi.string().required().error(new Error('Tier is required')),
      Tags: Joi.array().required().error(new Error('Tags is required')),
      Email: Joi.string().required().error(new Error('Email is required'))
    })
    const { error } = customerSignup.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  }
}
