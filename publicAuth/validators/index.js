const userValidator = require('./user.validator')
const customerValidator = require('./customer.validator')
const uploadValidator = require('./upload.validator')
const socketValidator = require('./socket.validator')
const { sendPrintJobsValidate } = require('./partner.validator')
const smsAuditValidator = require('./smsAudit.validator')

module.exports = {
  userValidator,
  customerValidator,
  uploadValidator,
  socketValidator,
  sendPrintJobsValidate,
  smsAuditValidator
}
