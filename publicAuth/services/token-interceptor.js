const {
  apiKey: { iOS, android, web, kiosk, desktop, mobile, hp, scanez, windowsDriver, macOsDriver, chromeExtension }
} = require('../config/config')
const { setErrorResponse } = require('./api-handler')
const Users = require('../models/users')
const ERROR = require('../helpers/error-keys')
const { getDb } = require('../config/db')

module.exports = {
  validateRequest: async (req, res, next) => {
    if (req.headers.authorization) {
      // check for basic auth header
      if (req.headers.authorization.indexOf('Basic ') === -1) {
        await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
      }
      try {
        // verify auth credentials
        const base64Credentials = req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const splitCredentials = credentials.split(':')
        const accessKey = splitCredentials[0]
        const obtainedSecret = splitCredentials[1]
        const db = await getDb()
        const { Secret } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKey })
        const isMatch = await Users.comparePassword({
          candidatePassword: obtainedSecret,
          hash: Secret
        })
        if (!isMatch) {
          await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
        } else {
          req.accessKeyId = accessKey
          next()
        }
      } catch (e) {
        await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
      }
    } else if (![iOS, android, web, kiosk, desktop, mobile, hp, scanez, windowsDriver, macOsDriver, chromeExtension].includes(req.headers.apikey || req.headers.apiKey)) {
      return setErrorResponse(null, ERROR.INVALID_API_KEY, res, req)
    } else {
      next()
    }
  }
}
