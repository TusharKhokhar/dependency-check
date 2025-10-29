const ErrorCode = require('../helpers/error-codes')
const ErrorConstant = require('../helpers/error-messages')

module.exports = {

  setErrorResponse: (serverError, error, res) => {
    if (serverError) {
      console.log(serverError)
    } else {
      console.log(error)
    }
    let httpCode = ErrorCode.BAD_REQUEST
    if (error === 'INVALID_TOKEN' || error === 'NO_TOKEN' || error === 'NOT_VALID_TOKEN') {
      httpCode = ErrorCode.UNAUTHORIZED
    } else if (error === 'INSUFFICIENT_PERMISSIONS') {
      httpCode = ErrorCode.FORBIDDEN
    }
    return res.status(httpCode).send({
      error: {
        code: parseInt(ErrorCode[error]),
        message: ErrorConstant[error].toString()
      },
      status: 0
    })
  },

  setSuccessResponse: (data, res) => {
    const response = {
      error: null,
      data: data,
      status: 1
    }
    return res.status(ErrorCode.HTTP_SUCCESS).send(response)
  },

  setErrorResponseByServer: (data, res) => {
    const response = {
      error: data,
      data: null,
      status: 0
    }
    return res.status(ErrorCode.BAD_REQUEST).send(response)
  },

  setValidationErrorResponse: (res, message) => {
    res.status(ErrorCode.HTTP_FAILED).send({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: message
      },
      status: 0
    })
  },

  setPaymentErrorResponse: (res, error, code = 400) => {
    console.log("Payments: ", ErrorConstant[error] ? ErrorConstant[error].toString() : error)
    return res.status(ErrorCode.BAD_REQUEST).send({
      error: {
        code,
        message: ErrorConstant[error] ? ErrorConstant[error].toString() : ErrorConstant.UNKNOWN_ERROR
      },
      status: 0
    })
  }

}
