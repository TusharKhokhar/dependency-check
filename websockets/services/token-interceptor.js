const {
  apiKey: { iOS, android, web, kiosk, desktop, mobile, hp, scanez, windowsDriver, macOsDriver, chromeExtension }
} = require('../config/config')
const { getDb } = require('../config/db')
const Bcrypt = require('bcryptjs');

module.exports = {
  validateRequest: async (authorization) => {
    if (authorization) {
      // check for basic auth header
      if (authorization.indexOf('Basic ') === -1) {
        return {authentic: false}
      }
      try {
        // verify auth credentials
        const base64Credentials = authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const splitCredentials = credentials.split(':')
        const accessKey = splitCredentials[0]
        const obtainedSecret = splitCredentials[1]
        const db = await getDb()
        const { Secret, CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKey })
        const authentic =  await comparePassword({
          candidatePassword: obtainedSecret,
          hash: Secret
        });
        return {authentic: authentic, accessKey, CustomerID}
      } catch (e) {
        console.log(e);
        return {authentic: false}
      }
    } else {
      return {authentic: false}
    }
  }
}

const comparePassword = ({ candidatePassword, hash }) => {
  return new Promise((resolve, reject) => {
    Bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) {
        reject(err)
      }
      resolve(isMatch)
    })
  })
}