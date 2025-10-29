const model = require('../models/index')
const { setErrorResponse, setSuccessResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const fs = require('fs')
const privateKey = fs.readFileSync('./config/kiosk-auth/jwtRSKIOSK.key')
const JWT = require('jsonwebtoken')
const { publishToken, retrieveEndpoint } = require('../services/iot-handler')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { iotPolicy } = require('../tokenVendingMachine/policyTemplates')
const config = require('../config/config')
const { STANDARD_TIER } = require('../helpers/constants')
const { getDb, isolatedDatabase } = require('../config/db')
const { iotTokenExpiry } = require('../config/config')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

/**
 * Request token API
 */

module.exports.requestToken = async (req, res) => {
  log.lambdaSetup(req, 'requestToken', 'request.controller')
  const thingTagId = req.query.thingTagId
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  return await new Promise((resolve, reject) => {
    model.things.getThingByTagId(thingTagId, db, (err, thingData) => {
      if (err) {
        reject(err)
      } else {
        if (thingData.IsActive === false || thingData.IsDeleted === true) {
          reject({ Error: true })
        } else {
          resolve(thingData)
        }
      }
    })
  }).then(thingInfo => {
    if (thingInfo) {
      return new Promise((resolve, reject) => {
        model.licenses.fetchLicenseByCustomerId(thingInfo.CustomerID, (err, licenseData) => {
          if (err) {
            reject(err)
          } else {
            resolve({ license: licenseData, thing: thingInfo })
          }
        })
      })
    }
  }).then(info => {
    if (info && info.license && info.license.RegisteredTo > new Date()) {
      iotPublisher(info).then(tokenPushed => {
        setSuccessResponse({ token: 'JWT TOKEN PROVIDED' }, res, req)
      }).catch(error => {
        log.error(error.toString())
        setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
      })
    } else {
      setErrorResponse(null, ERROR.LICENSE_EXPIRED_OR_NOT_FOUND, res, req)
    }
  }).catch(error => {
    log.error(error.toString())
    setErrorResponse(null, ERROR.INACTIVE_THING, res, req)
  })
}

const iotPublisher = async (info) => {
  try {
    const clientId = info.thing.PrimaryRegion.ThingName
    info.thing.PrimaryRegion = null
    info.thing.SecondaryRegion = null
    let iat = Math.floor(+new Date() / 1000)
    const expiry = 24
    const expiryTime =  expiry.toString() + 'h'
    info.thing.sessionId = iat.toString()
    info.thing.iat = iat
    const token = await JWT.sign(info.thing, privateKey, { algorithm: 'RS256', expiresIn: expiryTime })
    const data = {
      payload: { kioskToken: token },
      topic: `cmd/eprintit/${info.thing.CustomerID}/${info.thing.LocationID}/${clientId}/token`
    }
    const policy = await iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const endPoint = await retrieveEndpoint(config.region, accessParams)
    return await publishToken(data, config.region, accessParams, endPoint)
  } catch (e) {
    log.error(e.toString())
    throw new Error((e))
  }
}
