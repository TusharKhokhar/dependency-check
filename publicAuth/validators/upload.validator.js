const Joi = require('joi')
const { setValidationErrorResponse } = require('../services/api-handler')

module.exports = {
  signedUrls: (req, res, next) => {
    const signedUrls = Joi.object().keys({
      uploadObjectsDetails: Joi.array().items(Joi.object().keys({
        fileName: Joi.any(),
        extension: Joi.any(),
        contentType: Joi.any()
      }))
    })
    const { error } = signedUrls.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  confirmFileUpload: (req, res, next) => {
    const confirmFileUpload = Joi.object().keys({
      data: Joi.array().items(Joi.object().keys({
        color: Joi.any(),
        duplex: Joi.boolean(),
        paperSize: Joi.any(),
        copies: Joi.number(),
        orientation: Joi.any(),
        pageRange: Joi.any(),
        originalFileNameWithExt: Joi.any(),
        newFileName: Joi.any(),
        uploadStatus: Joi.boolean(),
        totalPagesPerFile: Joi.any(),
        uploadedFrom: Joi.any(),
        platform: Joi.any(),
        app: Joi.any(),
        staple: Joi.any()
      })),
      notification: Joi.object().keys({
        email: Joi.any(),
        text: Joi.any()
      }),
      deviceId: Joi.any(),
      deviceName: Joi.any(),
      guestName: Joi.any(),
      userName: Joi.any(),
      libraryCard: Joi.any(),
      customerLocation: Joi.any(),
      totalCost: Joi.number(),
      customerId: Joi.any(),
      locationId: Joi.any(),
      recordId: Joi.any(),
      automaticDelivery: Joi.boolean(),
      computerName: Joi.any()
    })
    const { error } = confirmFileUpload.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  },
  updateJob: (req, res, next) => {
    const updateJob = Joi.object().keys({
      fileName: Joi.string().required().error(new Error('fileName is required')),
      customerId: Joi.string().required().error(new Error('customerId is required'))
    })
    const { error } = updateJob.validate(req.body)
    if (error) {
      setValidationErrorResponse(res, error.message)
    } else {
      next()
    }
  }

}
