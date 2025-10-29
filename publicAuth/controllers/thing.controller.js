const { setErrorResponse, setSuccessResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const model = require('../models/index')
const uuid  = require("../helpers/uuidHelper");
const { getDb, switchDb, isolatedDatabase } = require('../config/db')
const { iotPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const config = require('../config/config')
const fs = require('fs')
const { decryptIoTCertificate, fetchCertificatesById, retrieveEndpoint, publishToTopic } = require('../services/iot-handler')
const { region, domainName, bucketName } = require('../config/config')
const { STANDARD_TIER } = require('../helpers/constants')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()
const { iotConnectPolicy } = require('../helpers/iotConnectPolicy')
const {decryptText} = require("../helpers/encryptDecrypt");
const dbHandler = require('../config/db')

module.exports.validateActivationCode = async (req, res) => {
  log.lambdaSetup(req, 'validateActivationCode', 'thing.controller')
  let {
    activationCode,
    serialNumber,
    macAddress
  } = req.query
  try {
    const {
        Tier,
        DomainName,
        CustomerID,
        ThingID
    } = await model.activationCodes.activationCodeSearch(activationCode)
    if (!Tier || !DomainName) {
      setErrorResponse(null, ERROR.ACTIVATION_CODE_NOT_VALID, res, req)
    } else {
      const db = Tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(DomainName)
      return new Promise((resolve, reject) => {
        const id = ThingID
        const thingTagId = uuid.generateUUID()
        const attributes = {
          SerialNumber: serialNumber,
          MacAddress: macAddress
        }
        model.things.updateThingStatus(id, thingTagId, db, attributes, (err, customer) => {
          if (err) {
            reject(err)
          } else {
            resolve(thingTagId)
          }
        })
      }).then(async (thingTagId) => {
        await db.collection('ActivationCodes').deleteMany({ ThingID: ObjectId.createFromHexString(ThingID) })
        return await setSuccessResponse({
          thingTagId,
          tier: Tier,
          domainName: DomainName,
          customerId: CustomerID,
          thingId: ThingID
        }, res, req)
      }).catch(err => {
        log.error(err.toString())
        if (err.ErrorMessage) {
          setErrorResponse(null, ERROR.ACTIVATION_CODE_NOT_VALID, res, req)
        } else {
          setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
        }
      })
    }
  } catch (e) {
    log.error(e)
    setErrorResponse(null, ERROR.ACTIVATION_CODE_NOT_VALID, res, req)
  }
}

module.exports.getThingByAttributes = async (req, res) => {
  log.lambdaSetup(req, 'getThingByAttributes', 'thing.controller')
  try {
    const {
      serialNumber,
      macAddress,
    } = req.query
    if (!serialNumber && !macAddress) {
      return setErrorResponse(null, ERROR.MISSING_INPUT, res, req)
    } else {
      const condition = {IsDeleted: false, IsActive: true}
      if (serialNumber) {
        Object.assign(condition, {SerialNumber: serialNumber})
      } else if (macAddress) {
        Object.assign(condition, {MacAddress: macAddress})
      }
      log.info('condition', condition)
      const db = await dbHandler.getDb()
      const thingData = await db.collection('Things').findOne(condition, {Thing: 1, _id: 1, ThingTagID: 1})
      if (!thingData) {
        return setErrorResponse(null, ERROR.NOT_VALID_TOKEN, res, req)
      } else {
        log.info('thingData', thingData)
        return setSuccessResponse({
            ThingTagID: thingData.ThingTagID,
            Tier: 'standard'
        }, res)
      }
    }
  } catch (e) {
    log.error(e.toString())
    return setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

/**
 * Fetch config data by thing id API
 */

module.exports.fetchConfigDataByThingTagId = async (req, res) => {
  log.lambdaSetup(req, 'configData', 'thing.controller')
  const requesterDomain = req.headers.subdomain
  const thingTagId = req.query.thingTagId
  const { version, firmware, ipAddress, computerName } = req.query;
  const configProperties = {
    Firmware: firmware,
    IpAddress: ipAddress,
    ComputerName: computerName,
    AppVersion: version
  };
  const tier = req.headers.tier
  let enabledIdentityProvider = false
  let db, commonDb
  if(tier === STANDARD_TIER) {
    commonDb = await getDb()
    db = await getDb()
  } else {
    db = await isolatedDatabase(requesterDomain)
    commonDb = await getDb()
  }
  if (!thingTagId) {
    await setErrorResponse(null, ERROR.MISSING_INPUT, res, req)
  } else {
    await model.things.getThingByTagIdAndUpdateVersion(thingTagId, db, configProperties, (err, thingData) => {
      if (err) {
        setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
      } else if (!thingData) {
        setErrorResponse(null, ERROR.NOT_VALID_TOKEN, res, req)
      } else {
        if (thingData?.RedundancySetting?.Primary === false && thingData?.RedundancySetting?.Redundancy === true) {
            overRideRedundantThing(db, thingData, thingData.RedundancySetting.PrimaryThingID).then(result => {
              result.PrimaryRegion = thingData.PrimaryRegion
              result.iotThingName = thingData.iotThingName
              thingData = result
            }).catch(error => {
              log.error(error)
            })
        }
        const index = getIndexByLoginOptionType(thingData?.LoginOptions, "Login_from_Identity_Providers");
        if (index !== -1){
          enabledIdentityProvider = thingData?.LoginOptions[index]?.LoginLabelText === 'true'
        }
        console.log('enabledIdentityProvider***',enabledIdentityProvider);
        fetchAllData(thingData.CustomerID, thingData._id, thingData.LocationID, db, commonDb, version, thingData?.SupportedIdentityProviderID, enabledIdentityProvider).then(async (data) => {
          let defaultDevice = null
          if(thingData?.DefaultDevice){
            const deviceData = await db.collection('Devices').findOne({ _id: thingData?.DefaultDevice, IsDeleted : false }) 
            if(deviceData){
              defaultDevice = {
                DeviceID : deviceData._id,
                DeviceName : deviceData.Device
              }
            }
          }
          setSuccessResponse({
            configData: {
              iotData: {
                PrimaryRegion: thingData.PrimaryRegion,
                SecondaryRegion: thingData.SecondaryRegion
              },
              thingData: {
                _id: thingData._id,
                Thing: thingData.Thing,
                ThingType: thingData.ThingType,
                IsActive: thingData.IsActive,
                Label: thingData.Label,
                CustomerID: thingData.CustomerID,
                DisplayQrCode: thingData.DisplayQrCode ? thingData.DisplayQrCode : false,
                ClearLogsAfter: thingData.ClearLogsAfter ? thingData.ClearLogsAfter: 7,
                MessageBox: thingData.MessageBox ? thingData.MessageBox: '',
                TimeOut: thingData.TimeOut ? thingData.TimeOut: 120,
                LoginOptions: thingData.LoginOptions ? thingData.LoginOptions: [],
                PaymentOptions: thingData.PaymentOptions ? thingData.PaymentOptions: [],
                AutomaticSoftwareUpdate: thingData.AutomaticSoftwareUpdate ? thingData.AutomaticSoftwareUpdate : true,
                PJLPrint: thingData.PJLPrint || thingData.PJLPrint === false  ? thingData.PJLPrint : null,
                PdfiumPrint: thingData.PdfiumPrint || thingData.PdfiumPrint === false ? thingData.PdfiumPrint : null,
                MultithreadPrint: thingData.MultithreadPrint || thingData.MultithreadPrint === false
                    ? thingData.MultithreadPrint : null,
                GuestScan: thingData.GuestScan || thingData.GuestScan === false ? thingData.GuestScan: false,
                GuestCopy: thingData.GuestCopy || thingData.GuestCopy === false ? thingData.GuestCopy: false,
                PrintUSBAsGuest: thingData.PrintUSBAsGuest || thingData.PrintUSBAsGuest === false ?
                  thingData.PrintUSBAsGuest : false,
                PrintUSBWithAccount: thingData.PrintUSBWithAccount || thingData.PrintUSBWithAccount === false ?
            thingData.PrintUSBWithAccount : false,
                DebugLog: thingData.DebugLog ? thingData.DebugLog: false,
                DefaultDevice : defaultDevice,
                PromptForAccount: thingData.PromptForAccount ?? false,
                EmailAsReleaseCode: thingData.EmailAsReleaseCode ?? false,
                SerialNumber: thingData.SerialNumber,
                MacAddress: thingData.MacAddress,
                Firmware: configProperties.Firmware ?? thingData.Firmware,
                IpAddress: configProperties.IpAddress ?? thingData.IpAddress,
                ComputerName: configProperties.ComputerName ?? thingData.ComputerName
              },
              allData: data
            }
          }, res, req)
        }).catch(error => {
          log.error(error.toString())
          setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
        })
      }
    })
  }
}

const getIndexByLoginOptionType = (loginOptions, optionType) => {
  try {
    for (let i = 0; i < loginOptions?.length; i++) {
      console.log('check--',loginOptions[i].LoginOptionType);
      if (loginOptions[i].LoginOptionType === optionType) {
        return i;
      }
    }
  } catch (error) {
    log.error(error)
  }
  // If the option type is not found, return -1
  return -1;
}

module.exports.getThingCertificates = async (req, res) => {
  log.lambdaSetup(req, 'getThingCertificate', 'thing.controller')
  const certId = req.params.id
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  try {
    const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
    const collection = db.collection('Things')
    const policy = await iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const regionNameCert = 'PrimaryRegion.CertificateID'
    const thingData = await collection.findOne({ [regionNameCert]: certId })
    if (!thingData) {
      await setErrorResponse(null, ERROR.NOT_FOUND, res, req)
    } else {
      const decryptedPrivateKey = await decryptIoTCertificate(thingData.PrimaryRegion.EncryptedPrivateKey)
      const certData = await fetchCertificatesById(certId, config.region, accessParams)
      const rootCa = fs.readFileSync('./amazonCerts/AmazonRootCA1.pem').toString()
      await setSuccessResponse({
        PrivateKey: decryptedPrivateKey,
        Certificate: certData.certificateDescription.certificatePem,
        RootCa: rootCa,
        Endpoint: `iot.${domainName}`,
        GlobalEndpoint: `iot.${domainName}`
      }, res, req)
    }
  } catch (err) {
    console.log(err)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

// Function to be removed later

module.exports.publishMessageToIot = async (req, res) => {
  log.lambdaSetup(req, 'publishMessageToIot', 'thing.controller')
  const parsedBody = req.body
  try {
    const policy = iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const message = {
      SessionID: parsedBody.connectionId,
      ReleaseCode: parsedBody.releaseCode,
      ThingName: parsedBody.thingName,
      RequestType: parsedBody.requestType,
      Printer: parsedBody.printer
    }
    const topic = `cmd/${parsedBody.thingType}/${parsedBody.customerId}/${parsedBody.locationId}/${parsedBody.thingName}/${parsedBody.requestType}`
    const endpoint = await retrieveEndpoint(region, accessParams)
    await publishToTopic(topic, message, endpoint, accessParams)
    await setSuccessResponse({ message: 'Done' }, res, req)
  } catch (err) {
    log.error(err.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const fetchAllData = async (customerId, thingId, locationId, db, commonDb, version, SupportedIdentityProviderID, enabledIdentityProvider) => {
  const collection = db.collection('Customers')
  const customizationCollection = db.collection('Customizations')
  const jobLists = db.collection('JobLists')
  const locationCollection = db.collection('Locations')
  const deviceCollection = db.collection('Devices')
  const customizationTextCollection = db.collection('CustomizationTexts')
  const licenseCollection = commonDb.collection('Licenses')
  const authProviderCollection = db.collection('AuthProviders')
  const supportedLanguagesCollection = db.collection('SupportedLanguages')
  const paperSizesCollection = db.collection('PaperSizes')
  let {LanguageNonSupportedVersions: LanguageNonSupportedVersions} = await commonDb.collection('Dropdowns').findOne({})
  const customerData = await collection.findOne({ _id: customerId }, { CustomerName: 1, _id: 1, Tier: 1 })
  const customerCustomizationData = customerData ? await customizationCollection.findOne({ CustomerID: customerId }) : {}
  const jobListData = customerData ? await jobLists.findOne({ CustomerID: customerData._id }) : {}
  const customerLocationsData = customerData ? await locationCollection.findOne({ _id: locationId }) : {}
  let deviceData = customerData ? await deviceCollection.aggregate([
    {
      $match: { ThingID: thingId, IsDeleted: false }
    },
    {
      $lookup: {
        from: 'Locations',
        localField: 'LocationID',
        foreignField: '_id',
        as: 'LocationData'
      }
    },
    {
      $unwind: {
        path: '$LocationData',
        preserveNullAndEmptyArrays: true
      }
    }
  ]).toArray() : {}
  deviceData = await decryptIppPassword(deviceData)
  const authProviderData = customerData &&  enabledIdentityProvider ?
    await authProviderCollection.find({CustomerID: customerData._id,_id: {$in: SupportedIdentityProviderID || []}, IsDeleted: false, IsActive: true},
  ).project({OrgID: 1, AuthProvider: 1, CustomerID: 1, ProviderName: 1, LabelText: 1, InnovativeConfig:
      {BarCode: 1, Pin: 1, BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, SirsiConfig:
      {BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, PolarisConfig:
      {BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, LdapConfig:
      {UsernameLabelText: 1, PasswordLabelText: 1}, InternalLoginConfig: {UsernameLabel: 1, PasswordLabel: 1}, WkpConfig: {PinLabelText:1}}).toArray() :
    await authProviderCollection.find({CustomerID: customerData._id, IsDeleted: false, IsActive: true},
    ).project({OrgID: 1, AuthProvider: 1, CustomerID: 1, ProviderName: 1, LabelText: 1, InnovativeConfig:
        {BarCode: 1, Pin: 1, BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, SirsiConfig:
        {BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, PolarisConfig:
        {BarCodeLabelText: 1, PinLabelText: 1, LoginType: 1}, LdapConfig:
        {UsernameLabelText: 1, PasswordLabelText: 1}, InternalLoginConfig: {UsernameLabel: 1, PasswordLabel: 1}, WkpConfig: {PinLabelText:1}}).toArray()
  const licenseData = customerData ? await licenseCollection.findOne({ CustomerID: customerId, IsDeleted: false }, {RegisteredTo: 1}): {}
  const customizationTextData = customerData ? await customizationTextCollection.findOne({ CustomerID: customerId }) : {}
  console.log('***********',customizationTextData.MainSection);
  customizationTextData.MainSection && customizationTextData.MainSection.TopSection &&
  customizationTextData.MainSection.TopSection.CustomerLogo
      ? customizationTextData.MainSection.TopSection.CustomerLogo =
      `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationTextData.MainSection.TopSection.CustomerLogo.split('Logos')[1]).toString('base64')}`
      : {}
  customizationTextData.HowToLogoSection && customizationTextData.HowToLogoSection.PartnerLogo && customizationTextData.HowToLogoSection.PartnerLogo !== 'assets/images/logo/tbs-logo-image.png'
      ? customizationTextData.HowToLogoSection.PartnerLogo =
      `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationTextData.HowToLogoSection.PartnerLogo.split('Logos')[1]).toString('base64')}`
      : {}
  const supportedLanguagesData = customerData ? await supportedLanguagesCollection.find({ }).toArray() : {}
  const paperSizesData = await paperSizesCollection.find({ }).toArray()
  let data = { customerData, customerCustomizationData, jobListData, customerLocationsData,
    deviceData, customizationTextData, licenseData, authProviderData, paperSizesData}
  if (version && LanguageNonSupportedVersions.length > 0 && !LanguageNonSupportedVersions.includes(version)) {
    Object.assign(data, {supportedLanguagesData: supportedLanguagesData})
  }
  return data
}

const overRideRedundantThing = async (db, thingData, primaryThingId) => {
  return db.collection('Things').findOne({_id: primaryThingId, IsDeleted: false})
}

module.exports.getStsCredential = async (req, res) => {
  log.lambdaSetup(req, 'getStsCredential', 'thing.controller')
  const body = req.body
  try {
    const policy = iotConnectPolicy(body)
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken,
      GlobalEndpoint: `iot.${domainName}`,
      region: config.region
      
    }
    await setSuccessResponse({ message: accessParams }, res, req)
  } catch (err) {
    log.error(err.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const decryptIppPassword = async  (devices) => {
  let devicesList = []
  for (const device of devices) {
    if (device?.IppPrintOptions?.Password) {
      try {
        device.IppPrintOptions.Password = await decryptText(device.IppPrintOptions.Password)
      } catch (e) {
        log.info('password not encrypted');
      }
    }
    devicesList.push(device)
  }
  return devicesList
}
