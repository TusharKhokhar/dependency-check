const Joi = require('joi')
const { setValidationErrorResponse } = require('../services/api-handler')

module.exports = {
  login: (req, res, next) => {
    const login = Joi.object().keys({
      userName: Joi.string().required().error(new Error('Username is required')),
      password: Joi.string().required().error(new Error('Password is required'))
    })
    const { error } = login.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  userImportSignUp: (req, res, next) => {
    const login = Joi.object().keys({users: Joi.array().items(Joi.object().keys({
      userName: Joi.string().required().error(new Error('Username is required')),
      emailAddress: Joi.string().required().error(new Error('Email address is required')),
      firstName: Joi.string().required().error(new Error('First name is required')),
      lastName: Joi.string().required().error(new Error('Last name is required')),
      groupName: Joi.string().required().error(new Error('Group Name is required')),
      cardNumber: Joi.string(),
      secondaryCardNumber: Joi.string(),
      pin: Joi.string(),
      enable: Joi.boolean(),
    }))})
    const { error } = login.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  deleteUsers: (req, res, next) => {
    const users = Joi.object().keys({
      userNames: Joi.array().items(Joi.string().required().error(new Error('Username is required'))).required().error(new Error('Username is required')),
    })
    const { error } = users.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  enableDisable: (req, res, next) => {
    const users = Joi.object().keys({
      userNames: Joi.array().items(Joi.string().required().error(new Error('Username is required'))).required().error(new Error('Username is required')),
      enable: Joi.boolean().required().error(new Error('Enable is required.'))
    })
    const { error } = users.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  updateGroups: (req, res, next) => {
    const users = Joi.object().keys({
      userNames: Joi.array().items(Joi.string().required().error(new Error('Username is required'))).required().error(new Error('Username is required')),
      newGroupName: Joi.string().required().error(new Error('New group name is required.')),
      existingGroupName: Joi.string().required().error(new Error('Existing group name is required.')),
    })
    const { error } = users.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  sso: (req, res, next) => {
    const login = Joi.object().keys({
      hashId: Joi.string().required().error(new Error('Username is required')),
      authId: Joi.string()
    })
    const { error } = login.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  confirmOtp: (req, res, next) => {
    const confirmOtp = Joi.object().keys({
      otp: Joi.string().required().error(new Error('otp is required'))
    })
    const { error } = confirmOtp.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  resetPassword: (req, res, next) => {
    const resetPassword = Joi.object().keys({
      userName: Joi.string().required().error(new Error('Username is required'))
    })
    const { error } = resetPassword.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  confirmPasswordApi: (req, res, next) => {
    const confirmPasswordApi = Joi.object().keys({
      resetToken: Joi.string().required().error(new Error('Reset Token is required')),
      password: Joi.string().required().error(new Error('Password is required'))
    })
    const { error } = confirmPasswordApi.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  locate: (req, res, next) => {
    const locate = Joi.object().keys({
      coordinates: Joi.any(),
      maximumDistance: Joi.any(),
      customerId: Joi.any()
    })
    const { error } = locate.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  }
}
