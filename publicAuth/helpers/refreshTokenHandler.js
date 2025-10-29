const JWT = require('jsonwebtoken')
const fs = require('fs')
const model = require("../models");
const privateKey = fs.readFileSync('./config/jwtRS256.key')
const publicKeyKiosk = fs.readFileSync('./config/refresh-token/jwtRfToken.key.pub')
const privateKeyRefresh = fs.readFileSync('./config/refresh-token/jwtRfToken.key')

module.exports.verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, publicKeyKiosk, { algorithm: 'RS256' }, (err, decoded) => {
      if (!err) {
        resolve(decoded)
      } else {
        resolve(false)
      }
    })
  })
}

module.exports.generateNewToken = async (user, apiKeys, isKiosk, db)=> {
      let userInfo = {}
      let expiry = 24
      let iat = Math.floor(+new Date() / 1000)
      userInfo.FirstName = user.FirstName
      userInfo.LastName = user.LastName
      userInfo.CustomerID = user.CustomerID
      userInfo.TenantDomain = user.TenantDomain
      userInfo.Tier = user.Tier
      userInfo._id = user._id
      userInfo.sessionId = iat.toString()
      userInfo.iat = iat
      userInfo.GroupID = user.GroupID
      userInfo.isKiosk = false
      const expiryTime =  expiry.toString() + 'h'
      const refreshTime =  `${(parseInt(expiry) + 2).toString()}h`
      const refreshToken = await JWT.sign(userInfo, privateKeyRefresh, { algorithm: 'RS256', expiresIn: refreshTime})
      const token = await JWT.sign(userInfo, privateKey, { algorithm: 'RS256', expiresIn: expiryTime})
      const userId = user._id
      await model.users.updateIat(db, userInfo.iat, userId, apiKeys)
      return {token, refreshToken}
}
