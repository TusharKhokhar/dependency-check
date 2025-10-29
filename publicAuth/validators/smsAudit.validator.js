const Joi = require('joi')

const smsAuditValidator = {
  saveSmsAuditLog: (req, res, next) => {
    const schema = Joi.object({
      type: Joi.string().default('SMS'),
      errorMessage: Joi.string().required(),
      phoneNumber: Joi.string().allow('').default(''),
      customerId: Joi.string().required().messages({
        'any.required': 'Customer ID is required'
      })
    })
    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }
    req.body = value
    next()
  }
}

module.exports = smsAuditValidator
