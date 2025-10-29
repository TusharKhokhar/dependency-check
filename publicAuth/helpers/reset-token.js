const crypto = require('crypto')

module.exports.requestPasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

module.exports.mfaAuthToken = () => {
  return crypto.randomBytes(32).toString('hex')
}
