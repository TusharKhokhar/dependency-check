const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken')
const fs = require('fs')
const privateKey = fs.readFileSync('./config/jwtRS256.key')
const privateKeyRefresh = fs.readFileSync('./config/refresh-token/jwtRfToken.key')
const { randomDigits } = require('crypto-secure-random-digit')

const { setSuccessResponse, setErrorResponse, setValidationErrorResponse, setErrorResponseByServer} = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const { emailPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { generateEJSTemplate } = require('../mailer/ejsTemplate')
const { sendEmail } = require('../mailer/mailer')
const {
  region, clientDomain, OTP_EXPIRY,
  OTP_LENGTH, bucketName, jwtTokenExpiry, apiKey, domainName
} = require('../config/config')
const { getDb, isolatedDatabase } = require('../config/db')
const stringConstant = require('../helpers/success-constants')
const model = require('../models/index')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const {  sendOtpText} = require('../services/sms-handler')
const { requestPasswordResetToken, mfaAuthToken } = require('../helpers/reset-token')
const { formatLocations } = require('../helpers/formatLocations')
const { verifyRefreshToken, generateNewToken } = require('../helpers/refreshTokenHandler')
const { STANDARD_TIER } = require('../helpers/constants')
const {countryCodes} = require("../services/countryCodes");
const {aliasEmailsGroup} = require("../helpers/responseChange");
const {formObjectIds, escapeRegex} = require("../helpers/util");
const CustomLogger = require("../helpers/customLogger");
const {apiKey: apiKeys} = require('../config/config')
const log = new CustomLogger()

exports.loginOAuth2 = async (req, res) => {
  const {
    body: {
      userName,
      password
    }
  } = req
  log.lambdaSetup(req, 'login', 'auth.controller')
  log.info('body ', req.body)
  const requesterDomain = req.headers.subdomain
  const apiKeys = req.headers.apikey || req.headers.Apikey || req.headers.apiKey
  const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
  const tier = req.headers.tier
  try {
    let db = await getDb()
    let commonDb = await getDb()
    if (tier !== STANDARD_TIER) {
      commonDb = db
      db = await isolatedDatabase(requesterDomain)
    }
    const user = await model.users.findUserByUserName(db, userName, requesterDomain)
    if (!user) {
      await setErrorResponse(null, ERROR.USER_DISABLED_NOT_FOUND, res, req)
    } else if (user.LoginAttemptCount && user.LoginAttemptCount === 7) {
      await model.users.updateLoginAttempt(db, user._id)
      const policy = await emailPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const htmlTemplate = await generateEJSTemplate({
        data: { Username: user.Username },
        filename: 'account-locked'
      })
      await sendEmail({
        data: { html: htmlTemplate, to: user.PrimaryEmail },
        accessParams: accessParams,
        subject: 'account-locked'
      })
      await model.users.lockAccount(db, user._id)
      await setErrorResponse(null, ERROR.USER_ACCOUNT_LOCKED, res, req)
    } else if (user.LoginAttemptCount && user.LoginAttemptCount > 7 && !user.IsActive) {
      await setErrorResponse(null, ERROR.USER_ACCOUNT_LOCKED, res, req)
    } else if (!user.IsActive || user.IsDeleted) {
      await setErrorResponse(null, ERROR.USER_DISABLED_NOT_FOUND, res, req)
    }  else {
      const isMatch = await model.users.comparePassword({ candidatePassword: password, hash: user.Password })
      if (isMatch) {
        const userDetail = await model.authProviders.findInternalUser(db, ObjectId.createFromHexString(user?.CustomerID))
        log.info("userDetail**********",userDetail)
        const expiryTime = userDetail ? userDetail?.TokenExpiry : jwtTokenExpiry
        log.info("expiryTime**********",expiryTime)
        await handleLogin(commonDb, db, requesterDomain, user, req, res, parseInt(expiryTime), isKiosk, false)
      } else {
        if (user.LoginAttemptCount && user.LoginAttemptCount > 3 && user.LoginAttemptCount < 6) {
          await model.users.updateLoginAttempt(db, user._id)
          await setValidationErrorResponse(res, `Incorrect Credentials: ${7 - user.LoginAttemptCount} Attempt remaining`)
        } else if (user.LoginAttemptCount && user.LoginAttemptCount === 6) {
          await model.users.updateLoginAttempt(db, user._id)
          await setValidationErrorResponse(res, 'Incorrect Credentials: Last attempt after this account will be locked ')
        } else {
          await model.users.updateLoginAttempt(db, user._id)
          await setErrorResponse(null, ERROR.PASSWORD_DOES_NOT_MATCH, res, req)
        }
      }
    }
  } catch (e) {
    log.error('error occurred while logging in ', e.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const handleLogin = async (commonDb, db, requesterDomain, user, req, res, expiry, isKiosk = false, isProvider = false) => {
  const { Navigation } = await commonDb.collection('Navigations').findOne({})
  const apiKey = req.headers.apikey || req.headers.apiKey || req.headers.ApiKey
  const { Partner, MfaEnforce } = await db.collection('Customers').findOne({ _id: user.CustomerID })
  const GroupData = await db.collection('Groups').findOne({ _id: { $in: user.GroupID }, GroupType: 'Permissions' })
  const printConfigGroup = user?.GroupID ? await db.collection('Groups').aggregate([
    {
      $match: { _id: { $in: user.GroupID }, GroupType: 'Print Configuration' }
    },
    {
      $lookup: {
        from: "Devices",
        localField: "DeviceID",
        foreignField: "_id",
        pipeline: [
          {$project: {
              _id: 1, Device: 1}
          }
        ],
        as: "deviceData"
      }
    }
  ]).toArray() : []
  if (!GroupData || !GroupData.IsActive || GroupData.IsDeleted) {
    await setErrorResponse(null, ERROR.YOUR_PERMISSION_GROUP_IS_DEACTIVATED, res, req)
  } else {
    const { roleData, groupRoleId } = GroupData ? await mappedRoleData(db, GroupData._id) : {}
    if (roleData.RoleName !== 'admin' && req.path === '/admin/login') {
      await setErrorResponse(null, ERROR.ROLE_SHOULD_BE_ADMIN, res, req)
    }
    if (!roleData || !roleData.IsActive || roleData.IsDeleted) {
      await setErrorResponse(null, ERROR.YOUR_PERMISSION_ROLE_IS_DEACTIVATED, res, req)
    } else {
      let {finalMenu: userNavigation, menuLink } = groupRoleId.RoleType ? await fetchNavs(groupRoleId.RoleType, db, Navigation, requesterDomain, Partner, commonDb) : []
      const addEditPermissions = await fetchAddEditPerms(roleData, db, requesterDomain, Partner, commonDb)
      const keyName = Object.keys(apiKeys).find(k=>apiKeys[k]===apiKey);
      const checkCondition = keyName === 'web' && MfaEnforce === true && !isProvider
      if (user.Mfa || checkCondition || requesterDomain == 'admin') {
        const mfaToken = mfaAuthToken()
        await saveUserMfaToken({ mfaToken, userId: user._id, db })
        await setSuccessResponse({ userId: user._id, mfaRequired: true, mfaToken: mfaToken, MfaOption: {
            Email: user?.MfaOption?.Email === false && user?.MfaOption?.Mobile === false ? true : user?.MfaOption?.Email,
            Mobile: user?.MfaOption?.Mobile
          } }, res, req)
      } else {
        let userInfo = {}
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
        userInfo.isKiosk = isKiosk
        user.Password = null
        user.iat = iat
        user.sessionId = Date.now().toString()
        const expiryTime =  expiry.toString() + 'h'
        const refreshTime =  `${(parseInt(expiry) + 2).toString()}h`
        const refreshToken = await JWT.sign(userInfo, privateKeyRefresh, { algorithm: 'RS256', expiresIn: refreshTime})
        const token = await JWT.sign(userInfo, privateKey, { algorithm: 'RS256', expiresIn: expiryTime})
        const userId = user._id
        await model.users.updateIat(db, user.iat, userId, apiKey)
        await model.users.updateLoginAttemptSuccess(db, user._id)
        await setSuccessResponse({ token, refreshToken, user, mfaRequired: false, userNavigation, addEditPermissions, menuLink, printConfigGroup }, res, req)
      }
    }
  }
}

module.exports.providersLogin = async (req, res) => {
  log.lambdaSetup(req, 'providersLogin', 'auth.controller')
  const {
    body: {
      hashId,
      authId
    }
  } = req
  const requesterDomain = req.headers.subdomain
  const isProvider = true
  if (requesterDomain === "admin") {
    return setErrorResponse(null, ERROR.ACCESS_DENIED, res, req);
  }
  const tier = req.headers.tier
  const apiKeys = req.headers.apikey || req.headers.Apikey || req.headers.apiKey
  const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKey.scanez
  try {
    let db = await getDb()
    let commonDb = await getDb()
    if (tier !== STANDARD_TIER) {
      commonDb = db
      db = await isolatedDatabase(requesterDomain)
    }
    const user = await model.users.findUserByHashId(db, hashId, requesterDomain)
    const identityProvidersSetting = authId ? await db.collection('AuthProviders').findOne({_id: ObjectId.createFromHexString(authId)}) : {}
    let iat = parseInt(jwtTokenExpiry)
    if (identityProvidersSetting && identityProvidersSetting.TokenExpiry){
      iat = parseInt(identityProvidersSetting.TokenExpiry)
    }
    if (!user){
      await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
    } else {
      await handleLogin(commonDb, db, requesterDomain, user, req, res, iat, isKiosk, isProvider)
    }
  } catch (er) {
    log.error('Error: ', er.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

exports.chooseMfaMethod = async (req, res) => {
  log.lambdaSetup(req, 'chooseMfaMethod', 'auth.controller')
  const {
    body: {
      email,
      text,
      userName,
      mfaToken
    }
  } = req
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  try {
    if (!email && !text && !userName && !mfaToken) {
      await setErrorResponse(null, ERROR.MISSING_INPUT, res, req)
    } else {
      let db = await getDb()
      if (tier !== STANDARD_TIER) {
        db = await isolatedDatabase(requesterDomain)
      }
      const user = await model.users.findUserByUserName(db, userName, requesterDomain)
      if (!user) {
        await setErrorResponse(null, ERROR.USER_DISABLED_NOT_FOUND, res, req)
      } else if (user.MfaToken !== mfaToken) {
        setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
      } else {
        if (email) {
          await mfaMail(user, db)
          await setSuccessResponse({ userId: user._id, mfaRequired: true }, res, req)
        } else {
          await mfaRequired(user, db)
          await setSuccessResponse({ userId: user._id, mfaRequired: true }, res, req)
        }
      }
    }
  } catch (e) {
    log.error('Error: ', e)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

/**
 * validate card number and pin
 */

module.exports.validateCardPin = async (req, res) => {
  const {
    body: {
      cardNumber,
      pin
    }
  } = req
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const apiKeys = req.headers.apikey || req.headers.Apikey || req.headers.apiKey
  const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
  try {
    if (!cardNumber && !pin) {
      await setErrorResponse(null, ERROR.MISSING_INPUT, res, req)
    } else {
      let db = await getDb()
      if (tier !== STANDARD_TIER) {
        db = await isolatedDatabase(requesterDomain)
      }
      const customer = await db.collection('Customers').findOne({DomainName: requesterDomain, IsDeleted: false, IsActive: true})
      const user = await db.collection('Users').findOne({CardNumber: cardNumber, CustomerID: customer._id, IsDeleted: false, IsActive: true})
      if (!user) {
        await setErrorResponse(null, ERROR.USER_DISABLED_NOT_FOUND, res, req)
      } else {
        user.PIN = user.PIN ? user.PIN : ''
        const isMatch = await model.users.comparePassword({ candidatePassword: pin, hash: user.PIN })
        if (isMatch) {
          const loginSession = {
            FirstName: user.FirstName,
            LastName: user.LastName,
            CustomerID: user.CustomerID,
            TenantDomain: user.TenantDomain,
            _id: user._id,
            isKiosk: isKiosk,
            Username: user.Username
          }
          loginSession.token = await JWT.sign(loginSession, privateKey, { algorithm: 'RS256', expiresIn: '10m'})
          user.iat = Math.floor(new Date() / 1000)
          await model.users.updateIat(db, user.iat, user._id, apiKeys)
          return await setSuccessResponse(loginSession, res, req)
        } else {
          return await setErrorResponse(null, ERROR.PIN_NOT_VALID, res, req)
        }
      }
    }
  } catch (e) {
    log.error('Error: ', e)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const fetchNavs = async (roleId, db, Navigation, requesterDomain, partner, commonDb) => {
  const {permissionIds, navigationPermissionId} = await getUserNavigation(roleId, db, requesterDomain, partner, commonDb)
  return await loadNavigationMenu(permissionIds, Navigation, navigationPermissionId)
}

const mappedRoleData = async (db, groupId) => {
  const collection = db.collection('Groups')
  const roleCollection = db.collection('Roles')
  const groupRoleId = await collection.findOne({ _id: groupId })
  const roleData = await roleCollection.findOne({ _id: groupRoleId.RoleType })
  return { roleData, groupRoleId }
}

const getUserNavigation = async (roleId, db, requesterDomain, partner, commonDb) => {
  try {
    const roleData = await model.roles.getRoleOfUser(roleId, db)
    let permissionIds = roleData.Permissions
    const permissionData = await model.permissions.getAllPermissions(permissionIds, requesterDomain, commonDb, partner)
    let navigationPermId = roleData.NavigationPermissionID
    let navigationPermissionId
    permissionIds = permissionData.map(data => {
      if(navigationPermId && (data._id.toString() === navigationPermId.toString())) {
        navigationPermissionId = data.PermissionMenuID
      }
      return data.PermissionMenuID
    })
    navigationPermissionId = navigationPermissionId ? navigationPermissionId : 'dashboards.analytics'
    return {permissionIds, navigationPermissionId}
  } catch (err) {
    throw err
  }
}

const fetchAddEditPerms = async (roleData, db, requesterDomain, IsPartner, commonDb) => {
  const permissionIds = roleData.CustomPermissions
  const condition = { _id: { $in: permissionIds } }
  const customPermsCollection = commonDb.collection('CustomPermissions')
  if (requesterDomain !== 'admin') {
    if (IsPartner) {
      Object.assign(condition, { PartnerLevel: true })
    } else {
      Object.assign(condition, { CustomerLevel: true })
    }
  }
  return await customPermsCollection.find(condition).toArray()
}

const loadNavigationMenu = async (permissionIds, Navigation, navigationPermissionId) => {
  const userNavigation = Navigation
  const mainMenu = []
  let menuLink = ''
  await userNavigation.forEach(mainMenuItem => {
    if (permissionIds.includes(mainMenuItem.id)) {
      navigationPermissionId === mainMenuItem.id ? menuLink = mainMenuItem.link : []
      mainMenu.push(mainMenuItem)
    }
  }
  )
  const finalMenu = mainMenu
  let index = 0
  for (let menu of mainMenu) {
    menu = await menuFilter(menu.children, permissionIds)
    menu ? await menu.forEach(me => me.id === navigationPermissionId ? menuLink = me.link : []) : []
    finalMenu[index].children = menu
    if (menu.length > 0) {
      let index2 = 0
      for (const child of menu) {
        if (child.children && child.children.length > 0) {
          finalMenu[index].children[index2].children = await menuFilter(child.children, permissionIds)
          index2++
        } else {
          finalMenu[index].children[index2].children = []
        }
        child && child.children ? await child.children.forEach(me => me.id === navigationPermissionId ? menuLink = me.link : [])  : []
      }
    } else {
      finalMenu[index].children = []
    }
    index++
  }
  return {finalMenu, menuLink}
}

const menuFilter = async (menu, permissionIds) => {
  return await menu.filter(nav => permissionIds.includes(nav.id))
}

/**
 * MFA Required Function
 * @param user
 * @param db
 * @returns {Promise<unknown>}
 */

const mfaRequired = (user, db) => {
  return new Promise((resolve, reject) => {
    const code = randomDigits(OTP_LENGTH).join('')
    sendOtpText(user.Mobile, code, {_id: user.CustomerID}).then(() => {
        saveUser({ otp: code, expiry: Date.now() + OTP_EXPIRY, userId: user._id, db })
        .then(onFullFilled => {
          log.info('saved user info: ', onFullFilled)
            resolve(onFullFilled)
        }).catch(error => {
            log.error('Error: ', error)
            reject(error)
        })
    })
  })
}

const mfaMail = async (user, db) => {
  try {
    const code = await randomDigits(OTP_LENGTH).join('')
    const policy = await emailPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const htmlTemplate = await generateEJSTemplate({
      data: { Username: user.Username, code },
      filename: 'mfa-options'
    })
    await sendEmail({
      data: { html: htmlTemplate, to: user.PrimaryEmail },
      accessParams: accessParams,
      subject: 'mfa-options'
    })
    await saveUser({ otp: code, expiry: Date.now() + OTP_EXPIRY, userId: user._id, db })
  } catch (err) {
    log.error('Error: ', err.toString())
    throw new Error(err)
  }
}

/**
 * API to fetch customer by Domain Name
 */

module.exports.fetchCustomerDetailsByDomain = async (req, res) => {
  log.lambdaSetup(req, 'fetchCustomerDetailsByDomain', 'auth.controller')
  const domain = req.query.domain ? req.query.domain : req.headers.subdomain
  const customerId = req.query.id
  const apiKeys = req.headers.apikey || req.headers.apiKey || req.headers.ApiKey || req.headers.Apikey
  const displayOnPortal = apiKeys === apiKey.web
  const condition = { IsDeleted: false }
  customerId
    ? Object.assign(condition, { _id: ObjectId.createFromHexString(customerId) })
    : Object.assign(condition, { DomainName: { $regex: `^${domain}$`, $options: "i" } })
  let db = await getDb()
  const collection = db.collection('Customers')
  const supportedLanguagesCollection = db.collection('SupportedLanguages')
  const paperSizesCollection = db.collection('PaperSizes')
  const customerData = await collection.findOne(condition, { CustomerName: 1, _id: 1, Tier: 1 })
  const languageData = customerData ? await supportedLanguagesCollection.find({}, {}).sort({language: 1}).toArray() : []
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    db = await isolatedDatabase(customerData.DomainName)
  }
  const customizationCollection = db.collection('Customizations')
  const customizationTextCollection = db.collection('CustomizationTexts')
  const locationCollection = db.collection('Locations')
  const jobListCollection = db.collection('JobLists')
  const thingCollection = db.collection('Things')
  const licenseCollection = db.collection('Licenses')
  const profileCollection = db.collection('Profiles')
  const authProviderCollection = db.collection('AuthProviders')
  const customerCustomizationData = customerData ? await customizationCollection.findOne({ CustomerID: customerData._id }) : {}
  const customerCustomizationTextData = customerData
    ? await customizationTextCollection.findOne({ CustomerID: customerData._id }, {
      createdAt: 0,
      updatedAt: 0
    })
    : {}
  customerCustomizationTextData?.MainSection?.TopSection &&
  customerCustomizationTextData.MainSection.TopSection.CustomerLogo
    ? customerCustomizationTextData.MainSection.TopSection.CustomerLogo =
         `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customerCustomizationTextData.MainSection.TopSection.CustomerLogo.split('Logos')[1]).toString('base64')}`
    : {}
  if (customerCustomizationTextData?.HowToLogoSection && customerCustomizationTextData?.HowToLogoSection.PartnerLogo) {
    customerCustomizationTextData.HowToLogoSection.PartnerLogo !== 'assets/images/logo/tbs-logo-image.png'
      ? customerCustomizationTextData.HowToLogoSection.PartnerLogo =
        `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customerCustomizationTextData.HowToLogoSection.PartnerLogo.split('Logos')[1]).toString('base64')}`
      : {}
  }
  if (customerCustomizationTextData?.LogoMobile?.Url) {
    customerCustomizationTextData.LogoMobile.Url = `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customerCustomizationTextData.LogoMobile.Url.split('Logos')[1]).toString('base64')}`
  }
  if (customerCustomizationTextData?.AdvancedEmailConfiguration?.AdvancedEmailAlias &&
    customerCustomizationTextData?.AdvancedEmailConfiguration?.AdvancedEmailAlias.length > 0){
    customerCustomizationTextData.AdvancedEmailConfiguration.UnGroupedAdvancedEmailAlias =
      customerCustomizationTextData.AdvancedEmailConfiguration.AdvancedEmailAlias
    customerCustomizationTextData.AdvancedEmailConfiguration.AdvancedEmailAlias =
      aliasEmailsGroup(customerCustomizationTextData.AdvancedEmailConfiguration.AdvancedEmailAlias)
  }
  const customerLocationsData = customerData ? await locationCollection.find({ CustomerID: customerData._id, IsDeleted: false }).toArray() : {}
  if (customerLocationsData.length > 0) {
    let index = 0
    for (const location of customerLocationsData) {
      const openTimeArray = location && location.Rule && location.Rule.OpenTimes &&
            location.Rule.OpenTimes.DayHours
        ? location.Rule.OpenTimes.DayHours
        : []
      customerLocationsData[index].openTimesLocationFormatted = await formatLocations(openTimeArray)
      index++
    }
  }
  const jobListCollectionData = customerData ? await jobListCollection.find({ CustomerID: customerData._id }).toArray() : {}
  const licenseData = customerData ? await licenseCollection.findOne({ CustomerID: customerData._id },
      {RegisteredTo: 1}): {}
  const thingCollectionData = customerData
    ? await thingCollection.aggregate(

      [{ $match: { CustomerID: customerData._id, IsDeleted: false } },
        {
          $lookup: {
            from: 'Devices',
            localField: '_id',
            foreignField: 'ThingID',
            pipeline: [
              { $project: { _id: 1, Device: 1, QrCode: 1 } }
            ],
            as: 'DeviceID'
          }
        },
        {
          $project: {
            PrimaryRegion: 0, SecondaryRegion: 0
          }
        }
      ]

    ).toArray()

    : {}
  let profileData = customerData ? await profileCollection.aggregate([
    {
      $match: {CustomerID: customerData._id, IsDeleted: false,
        IsActive: true}
    },
    {
      $lookup: {
        from: 'Groups',
        localField: 'ProfileSetting.PrintConfigurationGroup',
        foreignField: '_id',
        as: 'ProfileSetting.PrintConfigurationGroup'
      }
    },
    {
      $unwind: {
        path: '$ProfileSetting.PrintConfigurationGroup',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'Devices',
        localField: 'ProfileSetting.PrintConfigurationGroup.DeviceID',
        foreignField: '_id',
        pipeline: [
          { $project: { _id: 1, Device: 1 } }
        ],
        as: 'ProfileSetting.PrintConfigurationGroup.DeviceData'
      }
    },
    {
      $project: {
        Profile: 1,
        ProfileType: 1,
        AutoUpdate: 1,
        Description: 1,
        Priority: 1,
        Driver: 1,
        HideFromList: 1,
        IsActive: 1,
        IsDeleted: 1,
        ProfileSetting: 1
      }
    }
  ]).toArray() : []
  sortDeviceData(profileData);
  const paperSizesData = customerData ? await paperSizesCollection.find({}).toArray() : []
  const authProviderData = await getAuthProviderData(customerData, authProviderCollection, displayOnPortal)

  if (customerData) {
    await setSuccessResponse({
      customerData,
      region: process.env.region,
      customizations: customerCustomizationData,
      customizationsText: customerCustomizationTextData,
      locations: customerLocationsData,
      jobLists: jobListCollectionData,
      deviceIds: thingCollectionData,
      license: licenseData,
      profiles: profileData,
      authProviders: authProviderData,
      supportedLanguages: languageData,
      paperSizes: paperSizesData,
    }, res, req)
  } else {
    await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
  }
}

const getAuthProviderData = async (customerData, authProviderCollection, displayOnPortal) => {
  if (!customerData) return [];

  let query = {
    CustomerID: customerData._id,
    IsDeleted: false,
    IsActive: true
  };
  if (displayOnPortal === true) {
    Object.assign(query, { DisplayOnPortal: displayOnPortal });
  }
  const adminProjection = {
    OrgID: 1,
    AuthProvider: 1,
    CustomerID: 1,
    ProviderName: 1,
    LabelText: 1,
    InternalLoginConfig: { UsernameLabel: 1, PasswordLabel: 1 },
  };

  const nonAdminProjection = {
    OrgID: 1,
    AuthProvider: 1,
    CustomerID: 1,
    ProviderName: 1,
    LabelText: 1,
    InnovativeConfig: {
      BarCode: 1,
      Pin: 1,
      BarCodeLabelText: 1,
      PinLabelText: 1,
      LoginType: 1,
    },
    SirsiConfig: { BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1 },
    PolarisConfig: {
      BarCodeLabelText: 1,
      PinLabelText: 1,
      LoginType: 1,
    },
    LdapConfig: { UsernameLabelText: 1, PasswordLabelText: 1 },
    InternalLoginConfig: { UsernameLabel: 1, PasswordLabel: 1 },
    Sip2Config: {
      LoginType: 1,
      BarCodeLabelText: 1,
      PinLabelText: 1,
    },
    WkpConfig: {
      PinLabelText: 1,
    }
  };


  let projection;
  if (customerData.DomainName === "admin") {
    query.AuthProvider = "internal";
    projection = adminProjection;
  } else {
    projection = nonAdminProjection;
  }

  return await authProviderCollection.find(query).project(projection).toArray();
};

function sortDeviceData(data) {
  data.forEach(obj => {
    if (obj?.ProfileSetting?.PrintConfigurationGroup?.DeviceData) {
      obj.ProfileSetting.PrintConfigurationGroup.DeviceData.sort((a, b) => a.Device.localeCompare(b.Device));
    }
  });
}

module.exports.countryCodes = (req, res) => {
  setSuccessResponse(countryCodes, res, req)
}

/**
 * API to fetch customer by Domain Name
 */

module.exports.geoLocate = async (req, res) => {
  log.lambdaSetup(req, 'geoLocate', 'auth.controller')
  const {
    body: {
      coordinates,
      maximumDistance,
      customerId
    }
  } = req
  if (!coordinates || coordinates.length === 0 || !maximumDistance) {
    setErrorResponse(null, ERROR.MISSING_INPUT, res, req)
  } else {
    const db = await getDb()
    const collection = db.collection('Locations')
    const customerCollection = db.collection('Customers')
    const ctCollection = db.collection('CustomizationTexts')
    const locationDatas = await collection.find(
      {
        Coordinates:
                    {
                      $near:
                            {
                              $geometry: { type: 'Point', coordinates: coordinates },
                              $maxDistance: maximumDistance
                            }
                    },
        Searchable: true,
        IsActive: true,
        IsDeleted: false
      }
    ).toArray()
    const cusFilter = locationDatas ? await locationDatas.map(ct => ct.CustomerID) : []
    const customersData = await customerCollection.find({ _id: { $in: cusFilter }, IsDeleted: false }).project({ CustomerName: 1 }).toArray()
    const ctData = locationDatas
      ? await ctCollection.find({ IsActive: true, IsDeleted: false, CustomerID: { $in: cusFilter } })
        .project({
          LogoMobile: 1, HowToLogoSection: { PartnerLogo: 1 }, CustomerID: 1
        }).toArray()
      : []
    if (locationDatas) {
      const cusData = ctData ? await ctData.map(ct => ct.CustomerID.toString()) : []
      const customerIndex = customersData ? await customersData.map(ct => ct._id.toString()) : []
      const locationData = []
      locationDatas && await locationDatas.forEach(loc => {
        const obj = {
          LogoInfo: ctData[cusData.indexOf(loc.CustomerID.toString())]
            ? ctData[cusData.indexOf(loc.CustomerID.toString())]
            : {},
          CustomerName: customersData[customerIndex.indexOf(loc.CustomerID.toString())]
            ? customersData[customerIndex.indexOf(loc.CustomerID.toString())]
            : {}
        }
        if (obj?.LogoInfo?.LogoMobile?.Url){
          obj.LogoInfo.LogoMobile = `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(obj?.LogoInfo?.LogoMobile.Url.split('Logos')[1]).toString('base64')}`
        }
        if (obj?.HowToLogoSection?.PartnerLogo) {
          obj.HowToLogoSection.PartnerLogo = `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(obj.HowToLogoSection.PartnerLogo.split('Logos')[1]).toString('base64')}`
        }
        Object.assign(obj, loc)
        locationData.push(obj)
      })
      await setSuccessResponse({
        locationData
      }, res, req)
    } else {
      await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
    }
  }
}

/**
 * Reset Password API
 */

module.exports.resetPassword = async (req, res) => {
  log.lambdaSetup(req, 'resetPassword', 'auth.controller')
  const {
    body: {
      userName
    }
  } = req
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  try {
    let db = await getDb()
    if (tier !== STANDARD_TIER) {
      db = await isolatedDatabase(requesterDomain)
    }
    const user = await model.users.findUserByUserName(db, userName, requesterDomain)
    if (!user) {
      await setErrorResponse(null, ERROR.USER_DISABLED_NOT_FOUND, res, req)
    } else {
      if(user?.AuthProviderID){
        const userAuthProvider = await db.collection('AuthProviders').findOne({ _id: ObjectId.createFromHexString(user.AuthProviderID)})
        if (userAuthProvider && userAuthProvider.AuthProvider !== "internal") {
          return setErrorResponse(null, ERROR.INSUFFICIENT_PERMISSIONS, res)
        }
      }
      const resetToken = requestPasswordResetToken()
      await saveResetUser({
        resetToken,
        expiry: Date.now() + OTP_EXPIRY,
        userId: user._id,
        db
      })
      const policy = await emailPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const htmlTemplate = await generateEJSTemplate({
        data: {
          userName: userName,
          resetToken: resetToken,
          link: `https://${requesterDomain}.${clientDomain}/reset-password?resetToken=${resetToken}&userId=${user._id}`
        },
        filename: 'reset-pwd'
      })
      await sendEmail({
        data: {
          html: htmlTemplate, to: user.PrimaryEmail
        },
        accessParams: accessParams,
        subject: 'reset-pwd'
      })
      await setSuccessResponse(stringConstant.PASSWORD_RESET_MAIL_SENT, res, req)
    }
  } catch (e) {
    log.error('Error: ', e.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}

const generateUserName = async (firstName, lastName, db, requesterDomain) => {
  let foundUserName = false;
  let name = `${firstName.slice(0, 3).toLowerCase()}.${lastName.slice(0, 3).toLowerCase()}`;
  let userName;
  let count = 0;
  const customerData = await db.collection('Customers').findOne({DomainName: requesterDomain, IsDeleted: false})
  while (!foundUserName) {
    userName = count === 0 ? name : `${name}${count}`;
    if (await db.collection('Users').findOne({Username: { $regex: `^${escapeRegex(userName)}$`, $options: 'i' }, CustomerID: customerData?._id, IsDeleted: false})) {
      count = count + 1;
    }
    else {
      foundUserName = true;
    }
}
return userName
}

module.exports.userSignUp = async (req, res) => {
  log.lambdaSetup(req, 'userSignUp', 'auth.controller')
  let {
    body: {
      emailAddress,
      firstName,
      lastName,
      cardNumber,
      pin
    },
    headers: {
      subdomain: requesterDomain,
      tier
    }
  } = req
  try {
    let db = await getDb()
    if (tier !== STANDARD_TIER) {
      db = await isolatedDatabase(requesterDomain)
    }
    let userName = await generateUserName (firstName, lastName, db, requesterDomain)
    cardNumber = cardNumber ? cardNumber : []
    const customerData = await db.collection('Customers').findOne({DomainName: requesterDomain, IsDeleted: false})
    const userFind = await db.collection("Users").findOne({
      CustomerID: customerData?._id,
      IsDeleted: false,
      $or: [
        { Username: { $regex: `^${escapeRegex(userName)}$`, $options: "i" } },
        { PrimaryEmail: { $regex: `^${escapeRegex(emailAddress)}$`, $options: "i" } },
        { CardNumber: { $in: cardNumber } },
      ],
    });
    if (userFind) {
      if (userFind?.PrimaryEmail?.toLowerCase() === emailAddress?.toLowerCase()) {
        return setErrorResponse(null, ERROR.EMAIL_ALREADY_EXIST, res, req)
      } else if (userFind) {
        let cardArray = []
        cardArray = userFind.CardNumber ? userFind.CardNumber.map(i => {
          return {name: i, matches: cardNumber.includes(i)}
        }) : []
        if (cardArray.length > 0) {
          return setErrorResponse(null, ERROR.CARD_NUMBER_EXISTS, res, req)
        }
      } else {
        return setErrorResponse(null, ERROR.USERNAME_ALREADY_EXISTS, res, req)
      }
    }
    const user = await model.users.findUserByUserName(db, emailAddress, requesterDomain)
    if (user) {
      await setErrorResponse(null, ERROR.EMAIL_ALREADY_EXIST, res, req)
    } else {
      const customizationTextData = await db.collection('CustomizationTexts').findOne({CustomerID: customerData._id, IsDeleted: false})
      if (requesterDomain === 'admin' || (customizationTextData && !customizationTextData.EnableSignUp)){
        return setErrorResponse(null, ERROR.SIGNUP_NOT_ALLOWED, res)
      } else {
        const collection = db.collection('Users')
        const {PrintConfigurationGroupID} = await db.collection('Groups').findOne({_id: customizationTextData?.SignUpGroup, CustomerID: customerData._id, IsDeleted: false})
        const user = await addUserToDatabase({
          Username: userName?.toLowerCase(),
          Email: [],
          PrimaryEmail: emailAddress?.toLowerCase(),
          CustomerID: customerData._id,
          GroupID: customizationTextData?.SignUpGroup,
          Tier: customerData.Tier,
          Password: requestPasswordResetToken(),
          TenantDomain: customerData.DomainName,
          FirstName: firstName,
          LastName: lastName,
          CardNumber: cardNumber,
          Tags: [],
          approvedUser: true,
          Mfa: false,
          PIN: pin,
          PrinterGroupID: PrintConfigurationGroupID
        }, collection, db, customerData)
        await sendEmailForSignUp(user, emailAddress, requesterDomain, db, userName, firstName)
        log.info('signup successful')
        await setSuccessResponse('User sign up successful', res, req)
      }
    }
  } catch (e) {
    log.error('Error: ', e.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}

/**
 * import users api
 */

module.exports.bulkUserImport = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'bulkUserImport')
  const {
    body: {
      users
    }
  } = req
  const accessKeyId = req.accessKeyId
  let db = await getDb()
  const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
  const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
  if (customerData && customerData.Tier !== 'standard') {
    db = await isolatedDatabase(customerData.DomainName)
  }
  const failedUserImport = []
  const successUserInputs = []
  let response
  const collection = db.collection('Users')
  let userNames = await collection.find({Username: {$in: (await users.map(us => us.userName))}, CustomerID: customerData._id, IsDeleted: false}).toArray()
  let userEmails = await collection.find({PrimaryEmail: {$in: (await users.map(us => us.emailAddress))}, CustomerID: customerData._id, IsDeleted: false}).toArray()
  const mappedCardNumbers = await users.map(us => us?.cardNumber)
    .filter(cardNumber => cardNumber !== null &&  undefined);
  const mappedSecondaryCardNumbers = await users.map(us => us?.secondaryCardNumber)
    .filter(cardNumber => cardNumber !== null && undefined);
  let userCardNumber = await collection.find({CardNumber: {$in: mappedCardNumbers}, CustomerID: customerData._id, IsDeleted: false}).toArray()
  let userSecondaryCardNumber = await collection.find({CardNumber: {$in: mappedSecondaryCardNumbers}, CustomerID: customerData._id, IsDeleted: false}).toArray()
  let userGroups = await db.collection('Groups').find({GroupName: {$in: (await users.map(us => us.groupName))}, CustomerID: customerData._id, IsDeleted: false}).toArray()
  userNames = userNames ? await userNames.map(userN => userN.Username) : []
  userEmails = userEmails ? await userEmails.map(userN => userN.PrimaryEmail) : []
  userCardNumber = userCardNumber && userCardNumber.length > 0 ? [].concat(...await userCardNumber.map(userN => userN.CardNumber.map(card => card))) : []
  userSecondaryCardNumber = userSecondaryCardNumber && userSecondaryCardNumber.length > 0
    ? [].concat(...await userSecondaryCardNumber.map(userN => userN.CardNumber.map(card => card))) : []
  let userGroupsMap = userGroups ? await userGroups.map(groupN => groupN.GroupName) : []
  const invalidChars = /[\s,]/; // Prevent spaces and commas
  for (let user of users) {
    let obj = {}
    obj = user
    if (userNames.includes(user.userName) || userEmails.includes(user.emailAddress)
      || !userGroupsMap.includes(user.groupName) || invalidChars.test(user.userName)
    || userCardNumber.includes(user.cardNumber) || userSecondaryCardNumber.includes(user.secondaryCardNumber) ||
      (user.cardNumber && user.secondaryCardNumber && (user.cardNumber === user.secondaryCardNumber))
    ){
      if (userNames.includes(user.userName) ) {
        response = {
          status: false,
          errorMessage: 'User name already exists'
        }
      }
       else if (userEmails.includes(user.emailAddress) ) {
        response = {
          status: false,
          errorMessage: 'Email already exists'
        }
      }
      else if (userCardNumber.includes(user.cardNumber) ) {
        response = {
          status: false,
          errorMessage: 'Card Number already exists'
        }
      }
      else if (userSecondaryCardNumber.includes(user.secondaryCardNumber) ) {
        response = {
          status: false,
          errorMessage: 'secondary card number already exists'
        }
      }
      else if (user.cardNumber === user.secondaryCardNumber) {
        response = {
          status: false,
          errorMessage: 'card number and secondary card number cannot be same'
        }
      } else if (!userGroupsMap.includes(user.groupName) ) {
        response = {
          status: false,
          errorMessage: 'group name not found'
        }
      }
      else if ( invalidChars.test(user.userName)  ) {
        response = {
          status: false,
          errorMessage: 'Invalid character found in the user name'
        }
      }
    } else {
      const userGroup = userGroups[userGroupsMap.indexOf(user.groupName)]
      const cardNums = []
      if (user.cardNumber) {
        cardNums.push(user.cardNumber)
      }
      if (user.secondaryCardNumber) {
        cardNums.push(user.secondaryCardNumber)
      }
      response = await addUserToDatabase({
        Username: user.userName,
        PrimaryEmail: user.emailAddress,
        CustomerID: customerData._id,
        GroupID: userGroup?._id,
        Tier: customerData.Tier,
        Password: requestPasswordResetToken(),
        TenantDomain: customerData.DomainName,
        FirstName: user.firstName,
        CardNumber: cardNums,
        PIN: user.pin,
        LastName: user.lastName,
        approvedUser: true,
        IsDeleted: false,
        IsActive: user.enable ===  true || user.enable === false ? user.enable : true,
        PrinterGroupID: userGroup?.PrintConfigurationGroupID
      }, collection, db, customerData)
    }
    if (response?.status === false) {
      obj.errorMessage = response.errorMessage
      obj.status = 'FAILED'
      failedUserImport.push(user)
    } else {
      obj.status = 'SUCCESS'
      successUserInputs.push(user)
      await sendEmailForSignUp(user, user.emailAddress, customerData.DomainName, db)
      log.info('User added successfully')
    }
  }
  if (failedUserImport.length > 0) {
    return await setErrorResponseByServer({failedEntries: failedUserImport,
      successEntries: successUserInputs}, res, req)
  } else {
    return await setSuccessResponse({message: `${users.length} Users added successfully`}, res)
  }
}

/**
 * Bulk user deletion
 */

module.exports.bulkDeleteUsers = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'bulkDeleteUsers')
  const userNames = req.body.userNames;
  const accessKeyId = req.accessKeyId
  let db = await getDb()
  const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
  const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
  if (customerData && customerData.Tier !== 'standard') {
    db = await isolatedDatabase(customerData.DomainName)
  }
  await db.collection('Users').updateMany({IsDeleted: false, CustomerID: CustomerID, Username:  {$in: userNames}}, {$set: {IsDeleted: true}})
  return await setSuccessResponse({message: 'Request for deletion has been executed successfully'}, res)
}

/**
 * make users active/inactive
 */

module.exports.enableDisableUsers = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'enableDisableUsers')
  const userNames = req.body.userNames;
  const enableDisable = req.body.enable;
  const accessKeyId = req.accessKeyId
  let db = await getDb()
  const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
  const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
  if (customerData && customerData.Tier !== 'standard') {
    db = await isolatedDatabase(customerData.DomainName)
  }
  await db.collection('Users').updateMany({IsDeleted: false, CustomerID: CustomerID, Username:  {$in: userNames}}, {$set: {IsActive: enableDisable}})
  return await setSuccessResponse({message: `User ${enableDisable === true ? 'enabled' : 'disabled'} successfully`}, res)
}

/**
 * update user by username
 */

module.exports.updateUserByUserName = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'updateUserByUserName')
  const {
    body: {
      newGroupName,
      userNames,
      existingGroupName
    }
  } = req
  try {
    const accessKeyId = req.accessKeyId
    let db = await getDb()
    const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
    const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
    if (customerData && customerData.Tier !== 'standard') {
      db = await isolatedDatabase(customerData.DomainName)
    }
    const newGroup = await db.collection('Groups').findOne({GroupName: newGroupName,
      CustomerID: customerData._id,  IsDeleted: false, IsActive: true})

    const existingGroup = await db.collection('Groups').findOne({GroupName: existingGroupName,
      CustomerID: customerData._id,  IsDeleted: false, IsActive: true})
    const resp = await validateInputs(newGroup, existingGroup, res, req)
    if (!resp.status) {
      return await setErrorResponseByServer(resp.message, res, req)
    } else {
      const users = await db.collection('Users').find({IsDeleted: false, Username:
          {$in: userNames}, GroupID: existingGroup._id, CustomerID: customerData._id}).toArray()
      for (let user of users) {
        const mappedUserGroupIds = user?.GroupID.map(gr => gr.toString())
        const index = mappedUserGroupIds?.indexOf(existingGroup._id.toString())
        const arr = user.GroupID
        arr[index] = newGroup._id
        await db.collection('Users').updateOne({_id: user._id}, {$set: {GroupID: arr}})
      }
      await setSuccessResponse({message: 'Groups updated successfully'}, res, req)
    }
  } catch (e) {
    log.error('Error: ', e.toString())
    return await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const validateInputs = async (newGroup, existingGroup, res, req) => {
  if (!newGroup) {
    log.info('not found*****');
    return {
      message: 'New group does not exists',
      status: false
    }
  } else if (!existingGroup) {
    return {
      message: 'Existing group does not exists',
      status: false
    }
  } else if (existingGroup.GroupType !== newGroup.GroupType) {
    return {
      message: 'Provided group belongs to different types',
      status: false
    }
  } else {
    return {status: true}
  }
}

const sendEmailForSignUp = async (user, emailAddress, requesterDomain, db, userName, firstName) => {
  const resetToken = requestPasswordResetToken()
  await saveResetUser({
    resetToken,
    expiry: Date.now() + 6000000000000000,
    userId: user.insertedId,
    db
  })
  const policy = await emailPolicy()
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  const htmlTemplate = await generateEJSTemplate({
    data: {
      firstName: firstName,
      userName: userName,
      resetToken: resetToken,
      link: `https://${requesterDomain}.${clientDomain}/reset-password?resetToken=${resetToken}&userId=${user.insertedId}`
    },
    filename: 'signup-user'
  })
  await sendEmail({
    data: {
      html: htmlTemplate, to: emailAddress
    },
    accessParams: accessParams,
    subject: 'signup-user'
  })
}

const addUserToDatabase = async (userData, collection, db, customerData) => {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(userData.Password, salt)
  const pinHashed = userData.PIN ? await bcrypt.hash(userData.PIN, salt) : null
  userData = formObjectIds(userData)
  const {
      Username,
      Email,
      PrimaryEmail,
      CustomerID,
      GroupID,
      GroupQuotas,
      Tier,
      TenantDomain,
      ApiKey,
      FirstName,
      CardNumber,
      Tags,
      LastName,
      MfaOption,
      approvedUser = true,
      Mfa,
      Mobile,
      PrinterGroupID
  } = userData
  const assignedGroupIds =  [GroupID]
  if (PrinterGroupID){
    assignedGroupIds.push(PrinterGroupID)
  }
  let newUser = {
      Username: Username?.toLowerCase(),
      Email: Email,
      PrimaryEmail: PrimaryEmail?.toLowerCase(),
      CustomerID: ObjectId.createFromHexString(CustomerID),
      GroupID: assignedGroupIds,
      GroupQuotas: GroupQuotas,
      CardNumber,
      Tier: Tier,
      PIN: pinHashed,
      TenantDomain: TenantDomain,
      ApiKey: ApiKey,
      Password: hash,
      FirstName: FirstName,
      MfaOption: MfaOption ? MfaOption : {
        Email: !!customerData?.MfaEnforce,
        Mobile: false
      },
      LastName: LastName,
      ApprovedUser: approvedUser,
    IsDeleted: false,
    IsActive: true,
      Mfa,
      Tags,
      Mobile
  }
  let quotaBalance = await assignUserBalance(db, newUser.GroupID)
  newUser.DebitBalance = 0
  newUser.GroupQuotas = quotaBalance
  return collection.insertOne(newUser)
}

const assignUserBalance = async (db, groupIds) => {
  const groupData = await db.collection('Groups').findOne({_id: {$in: groupIds}, GroupType: 'Permissions'})
  const userBalances = groupData?.AssociatedQuotaBalance && groupData?.AssociatedQuotaBalance?.length > 0 ?
    await db.collection('Groups').find({_id: {$in: groupData.AssociatedQuotaBalance}}).toArray() : []
  let userBalancesFinal = []
  userBalances.forEach(bal => {
    userBalancesFinal.push({
      GroupID: bal._id,
      QuotaBalance: bal.QuotaBalance.Amount
    })
  })
  return userBalancesFinal
}

/**
 * Confirm password API
 * @param req
 * @param res
 */

module.exports.confirmPasswordApi = async (req, res) => {
  log.lambdaSetup(req, 'confirmPasswordApi', 'auth.controller')
  const resetToken = req.body.resetToken
  const password = req.body.password
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(password, salt)
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  await model.users.findResetToken(resetToken, db, (err, user) => {
    if (err) {
      setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
    } else if (!user) {
      setErrorResponse(null, ERROR.PASSWORD_RESET_FAILED, res, req)
    } else {
      bcrypt.compare(password, user.Password, function (err, isMatch) {
        if (isMatch) {
          setErrorResponse(null, ERROR.NEW_PASSWORD_CANNOT_BE_SAME_AS_OLD, res)
        } else {
          saveResetUser({
            resetToken: '',
            expiry: 0,
            userId: user._id,
            hashPassword,
            db
          }).then(onFullFilled => {
            setSuccessResponse(stringConstant.PASSWORD_RESET_SUCCESS, res, req)
          }).catch(error => {
            log.error('Error: ', error.toString())
            setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
          })
        }
      })
    }
  })
}

/**
 * confirm OTP password
 */

module.exports.confirmOtp = async (req, res) => {
  log.lambdaSetup(req, 'confirmOtp', 'auth.controller')
  const userId = req.params.id ? ObjectId.createFromHexString(req.params.id) : null
  const apiKeys = req.headers.apikey || req.headers.apiKey || req.headers.ApiKey || req.headers.Apikey
  const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
  const otp = req.body.otp
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  let db = await getDb()
  let commonDb = await getDb()
  if (tier !== STANDARD_TIER) {
    commonDb = db
    db = await isolatedDatabase(requesterDomain)
  }
  await model.users.findOtp(otp, userId, db, (err, user) => {
    if (err) {
      setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
    } else if (!user) {
      setErrorResponse(null, ERROR.OTP_VERIFICATION_FAILED, res, req)
    } else {
      saveUser({ otp: '', expiry: 0, userId, db }).then(async onFullFilled => {
        const { Navigation } = await commonDb.collection('Navigations').findOne({})
        const { Partner } = await db.collection('Customers').findOne({ _id: user.CustomerID })
        const GroupData = await db.collection('Groups').findOne({ _id: { $in: user.GroupID }, GroupType: 'Permissions' })
        if (!GroupData || !GroupData.IsActive || GroupData.IsDeleted) {
          await setErrorResponse(null, ERROR.YOUR_PERMISSION_GROUP_IS_DEACTIVATED, res, req)
        } else {
          const { roleData, groupRoleId } = GroupData ? await mappedRoleData(db, GroupData._id) : {}
          if (!roleData || !roleData.IsActive || roleData.IsDeleted) {
            await setErrorResponse(null, ERROR.YOUR_PERMISSION_ROLE_IS_DEACTIVATED, res, req)
          } else {
            const addEditPermissions = await fetchAddEditPerms(roleData, db, requesterDomain, Partner, commonDb)
            fetchNavs(groupRoleId.RoleType, db, Navigation, requesterDomain, Partner, commonDb).then(({
                                                                                                        finalMenu: userNavigation,
                                                                                                        menuLink
                                                                                                      } ) => {
              let userInfo = {}
              let iat = Math.floor(+new Date() / 1000)
              userInfo.FirstName = user.FirstName
              userInfo.LastName = user.LastName
              userInfo.CustomerID = user.CustomerID
              userInfo.TenantDomain = user.TenantDomain
              userInfo.isKiosk = isKiosk
              userInfo.Tier = user.Tier
              userInfo._id = user._id
              userInfo.sessionId = iat
              userInfo.iat = iat
              userInfo.GroupID = user.GroupID
              user.Password = null
              user.iat = iat
              user.sessionId = Date.now().toString()
              const expiryTime =  parseInt(jwtTokenExpiry) + 'h'
              const refreshTime =  `${(parseInt(jwtTokenExpiry) + 2).toString()}h`
              const refreshToken = JWT.sign(userInfo, privateKeyRefresh, { algorithm: 'RS256', expiresIn: refreshTime})
              const token = JWT.sign(userInfo, privateKey, { algorithm: 'RS256', expiresIn: expiryTime })
              const userId = user._id
              model.users.updateIat(db, user.iat, userId, apiKeys)
              setSuccessResponse({ token, refreshToken, user, userNavigation: userNavigation, addEditPermissions, menuLink }, res, req)
            }).catch(error => {
              log.error('Error: ',error.toString())
              setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
            })
          }
        }
      }).catch(error => {
        log.error('Error: ',error.toString())
        setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
      })
    }
  })
}

/**
 * save OTP function
 * @param otp
 * @param expiry
 * @param userId
 * @param db
 * @returns {Promise<unknown>}
 */

const saveUser = ({ otp, expiry, userId, db }) => {
  return new Promise((resolve, reject) => {
    model.users.updateUserMfa({otp, expiry, userId, db}).then(updated => {
      resolve(updated)
    }).catch(err => {
      reject(err)
    })
  })
}

const saveUserMfaToken = ({ mfaToken, userId, db }) => {
  return new Promise((resolve, reject) => {
    model.users.updateUserMfaToken({mfaToken, userId, db}).then(updated => {
      resolve(updated)
    }).catch(err => {
      reject(err)
    })
   })
}

/**
 * reset Password function
 * @param resetToken
 * @param expiry
 * @param userId
 * @param hashPassword
 * @param db
 * @returns {Promise<unknown>}
 */

const saveResetUser = ({ resetToken, expiry, userId, hashPassword, db }) => {
  return new Promise((resolve, reject) => {
    model.users.updateUserReset({ resetToken, expiry, userId, hashPassword, db }, (err, updated) => {
      if (err) {
        reject(err)
      } else {
        resolve(updated)
      }
    })
  })
}

/**
 * Refresh token API
 */

module.exports.refreshToken = async (req, res) => {
  log.lambdaSetup(req, 'refreshToken', 'auth.controller')
  const token = req.body.token
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const apiKeys = req.headers.apikey || req.headers.Apikey || req.headers.apiKey
  const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
  let db = await getDb()
  if (tier !== STANDARD_TIER) {
    db = await isolatedDatabase(requesterDomain)
  }
  const result = await verifyRefreshToken(token)
  if (result) {
    const collection = db.collection('Users')
    const user = await collection.findOne({ _id: ObjectId.createFromHexString(result._id) }, { Password: 0 })
    if (user) {
      const  {token, refreshToken} = await generateNewToken(user, apiKeys, isKiosk, db)
      await setSuccessResponse( {token, refreshToken}, res, req)
    } else {
      setErrorResponse(null, ERROR.INVALID_TOKEN, res, req)
    }
  } else {
    setErrorResponse(null, ERROR.INVALID_TOKEN, res, req)
  }
}


module.exports.findCardNumber = async (req, res) => {
  const cardNumber = req.query.cardNumber
  if(!cardNumber) {
    setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res, req)
  }
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  let db = await getDb()
  if (tier !== STANDARD_TIER) {
    db = await isolatedDatabase(requesterDomain)
  }
    const collection = db.collection('Users')
    const customer = await db.collection('Customers').findOne({DomainName: requesterDomain, IsDeleted: false, IsActive: true})
    const user = await collection.findOne({ CardNumber: cardNumber, IsDeleted: false, IsActive: true, CustomerID:  customer._id})
    if (user) {
      return await setSuccessResponse({
        userExists: true,
        FirstName: user.FirstName,
        LastName: user.LastName,
        CustomerID: user.CustomerID,
        TenantDomain: user.TenantDomain,
        _id: user._id,
        Username: user.Username,
        PinExists: !(user.PIN === null || user.PIN === undefined || user.PIN === '')
      }, res, req)
    } else {
      return await setErrorResponse(null, ERROR.INVALID_CARD_NUMBER, res, req)
    }
}

module.exports.getUserByEmail = async (req, res) => {
  log.lambdaSetup(req, 'getUserByEmail', 'auth.controller')
  const email = req.body.email
  if(!email) {
    return await setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res, req)
  }
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  let db = await getDb()
  if (tier !== STANDARD_TIER) {
    db = await isolatedDatabase(requesterDomain)
  }
  let response = await db
    .collection("Users")
    .findOne(
      {
        IsDeleted: false,
        IsActive: true,
        PrimaryEmail: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
        TenantDomain: requesterDomain,
      },
      { PrimaryEmail: 1, Username: 1 }
    );
  return await setSuccessResponse({
    Username: response?.Username
  }, res, req)
}