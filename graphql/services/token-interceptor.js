const JWT = require('jsonwebtoken')
const fs = require('fs')
const publicKey = fs.readFileSync('./config/jwtRS256.key.pub')
const publicKeyKiosk = fs.readFileSync('./config/kiosk-auth/jwtRSKIOSK.key.pub')
const {
  INVALID_API_KEY, NO_TOKEN, INVALID_TOKEN, UNAUTHORIZED
} = require('../helpers/error-messages')
const {
  apiKey: { iOS, android, web, kiosk,
    hp, desktop, mobile, scanez, macOsDriver, windowsDriver, chromeExtension }
} = require('../config/config')
const { STANDARD_TIER } = require('../helpers/constants')
const { getDb, switchDb, isolatedDatabase } = require('../config/dbHandler')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const {TOKEN_EXPIRED} = require("../helpers/error-codes");
const {tokenInvalidateMapper} = require("../helpers/tokenExpiry");

module.exports = {
  validateToken: ({ token, apiKey, requesterDomain, tier }) => {
    return new Promise((resolve, reject) => {
      console.log('incoming key: ', apiKey)
      if (![iOS, android, web, kiosk, hp, desktop, mobile, scanez, macOsDriver, windowsDriver, chromeExtension].includes(apiKey)) {
        console.log('api key missing')
        resolve({ error: INVALID_API_KEY, data: null })
      } else if (!token) {
        console.log('token not provided')
        resolve({ error: NO_TOKEN, data: null })
      } else if ([iOS, android, web, desktop, mobile, macOsDriver, windowsDriver, chromeExtension].includes(apiKey)) {
        JWT.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
          if (err) {
            console.log('invalid token')
            resolve({ error: INVALID_TOKEN, data: null })
          } else if (parseInt(decoded.exp) < Math.floor(+new Date() / 1000)) {
            console.log('token expired')
            resolve({ error: TOKEN_EXPIRED, data: null })
          }
          validateUser(decoded, requesterDomain, tier, apiKey).then(resp => {
            resolve(resp)
          }).catch(error => {
            console.log(error)
            resolve(error)
          })
        })
      } else if (apiKey === kiosk || apiKey === hp || apiKey === scanez) {
        console.log('application api key detected')
        JWT.verify(token, publicKeyKiosk, { algorithm: 'RS256' }, (err, decoded) => {
          if (err) {
            console.log('***********',err);
            resolve({ error: INVALID_TOKEN, data: null })
          } else if (decoded.isKiosk) {
            if (parseInt(decoded.exp) < Math.floor(+new Date() / 1000)) {
              console.log('token expired')
              resolve({ error: TOKEN_EXPIRED, data: null })
            }
            validateUser(decoded, requesterDomain, tier, apiKey).then(resp => {
              resolve(resp)
            }).catch(error => {
              console.log('error**',error)
              resolve(error)
            })
          } else {
            validateKioskClient(decoded, requesterDomain, tier, apiKey).then(resp => {
              resolve(resp)
            }).catch(error => {
              console.log('kiosk client error**',error)
              resolve(error)
            })
          }
          // else if (decoded.exp < new Date().getTime()) {
          //   resolve({ error: TOKEN_EXPIRED, data: null })
          // }
        })
      }
    })
  }
}

const validateUser = async (decoded, requesterDomain, tier, apiKey) => {
  console.log(tier)
  console.log(requesterDomain)
  let db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  try {
    let user = {}
    try {
      user = await db.collection('Users').findOne({ _id: ObjectId.createFromHexString(decoded._id) })
    } catch (e) {
      db = await getDb(true)
      if(tier !== STANDARD_TIER){
          db = await isolatedDatabase(requesterDomain)
      }
      user = await db.collection('Users').findOne({ _id: ObjectId.createFromHexString(decoded._id) })
    }
    const isInValid = tokenInvalidateMapper(user, apiKey, decoded)
    if (!user || !user.IsActive|| user.IsDeleted || isInValid) {
      return { error: UNAUTHORIZED, data: null }
    } else {
      const customer = await db.collection('Customers').findOne({ _id: user.CustomerID })
      let customerIdsFilter = customer.SubCustomerID
        ? customer.SubCustomerID
        : []
      if (!customerIdsFilter.includes(ObjectId.createFromHexString(user.CustomerID))) {
        customerIdsFilter.push(ObjectId.createFromHexString(user.CustomerID))
      }
      if (user.TenantDomain === 'admin') {
        customerIdsFilter = []
      }
      decoded.user = user
      decoded.user.IsPartner = customer.Partner ? customer.Partner : false
      decoded.customerIdsFilter = customerIdsFilter
      decoded.customerIdsStrings = customerIdsFilter.length > 0 ? customerIdsFilter.map(cus => cus.toString()) : []
      decoded.isKiosk = decoded.isKiosk ? decoded.isKiosk : false
      decoded.apiKey = decoded.isKiosk ? apiKey : false

      const permissions = await getUserPermissions({db, groups: user.GroupID})
      decoded.user.Permissions = permissions
      return {
        error: null,
        data: decoded,
        web: true,
        kiosk: false
      }
    }
  } catch (err) {
    console.log('-------*******',err)
    return { error: UNAUTHORIZED, data: null }
  }
}

const validateKioskClient= async (decoded, requesterDomain, tier, apiKey) => {
  let db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  try {
    let thing = {}
    try {
      thing = await db.collection('Things').findOne({ _id: ObjectId.createFromHexString(decoded._id) })
    } catch (e) {
      db = await getDb(true)
      if(tier === STANDARD_TIER){
        db = await isolatedDatabase(requesterDomain)
      }
      thing = await db.collection('Things').findOne({ _id: ObjectId.createFromHexString(decoded._id) })
    }
    if (!thing || !thing.IsActive) {
      return { error: UNAUTHORIZED, data: null }
    } else {
      decoded.thing = thing
      decoded.customerIdsFilter = [thing.CustomerID]
      decoded.customerIdsStrings = [thing.CustomerID.toString()]
      decoded.isKiosk = true
      decoded.apiKey = apiKey
      return {
        error: null,
        data: decoded,
        web: false,
        kiosk: true
      }
    }
  } catch (err) {
    console.log('token expired*****',err)
    return { error: UNAUTHORIZED, data: null }
  }
}

const getUserPermissions = async ({db, groups}) => {
  let permissions = []
  const { RoleType } = await db.collection('Groups').findOne({_id: {$in: groups}, GroupType: 'Permissions'})
  const { CustomPermissions, Permissions } = await db.collection('Roles').findOne({_id: RoleType, IsDeleted: false})

  const _db = await getDb()

  const _navigationPermissions = await _db
    .collection("Permissions")
    .find({ _id: { $in: Permissions } })
    .project({ PermissionName: 1 })
    .toArray()

  const _customPermissions = await _db
    .collection("CustomPermissions")
    .find({ _id: { $in: CustomPermissions } })
    .project({ PermissionName: 1 })
    .toArray();

  permissions = [..._navigationPermissions, ..._customPermissions].map((item) => item.PermissionName)
  return permissions
}