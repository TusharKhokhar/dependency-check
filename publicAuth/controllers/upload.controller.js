const model = require('../models/index')
const { imageSignedUrl, getSignedUrl, accessKeysHead, binarySignedUrl, getBinaryFileSignedUrl, imageSignedUrlV2,
  getBinaryFileSignedUrlV2
} = require('../helpers/imageUpload')
const { setSuccessResponse, setErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const { sendJobText} = require('../services/sms-handler')
const { guestTemplate, loginTemplate, releaseCodeTemplate } = require('../services/sms-templates')
const { randomDigits } = require('crypto-secure-random-digit')
const { emailPolicy, iotPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { generateEJSTemplate } = require('../mailer/ejsTemplate')
const { sendEmail } = require('../mailer/mailer')
const bluebird = require('bluebird')
const generatePalette = require('../services/themeGenerator')
const moment = require('moment')
const { STANDARD_TIER } = require('../helpers/constants')
const { getDb, switchDb, isolatedDatabase } = require('../config/db')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { retrieveEndpoint, publishToTopic, thingDetails: thingDetailsFun } = require('../services/iot-handler')
const { region, bucketNameConverted, domainName, bucketName} = require('../config/config')
const { logoUploadPolicy } = require('../tokenVendingMachine/policies/customization')
const { v4: uuidv4 } = require('uuid');
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const {checkPng} = require("../mailer/templates/iconBase64");
const CustomLogger = require("../helpers/customLogger");
const {sendJobToAzureService} = require("../services/triggerLambda");
const log = new CustomLogger()

/**
 * API to generate multiple signed Urls
 */

module.exports.generateMultipleSignedUrls = async (req, res) => {
  log.lambdaSetup(req, 'generateMultipleUrls', 'auth.controller')
  const {
    uploadObjectsDetails
  } = req.body
  const subDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(subDomain)
  if (uploadObjectsDetails.length === 0) {
    await setErrorResponse(null, ERROR.NO_FILES_ENTERED, res, req)
  } else if (!subDomain) {
    await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
  } else {
    try {
      const customerId = await fetchCustomerId(subDomain)
      if (!customerId) {
        await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
      } else {
        const signedUrlLinks = await generateLinksPromise(uploadObjectsDetails, customerId, db)
        await setSuccessResponse(signedUrlLinks, res, req)
      }
    } catch (e) {
      log.error(e.toString())
      await setErrorResponse(null, ERROR.SIGNED_URL_FAILED, res, req)
    }
  }
}

/**
 * API to generate signed url for ipp print response
 */

module.exports.ippResponseSignedUrl = async (req, res) => {
  log.lambdaSetup(req, 'ippResponseSignedUrl', 'auth.controller')
  const {
    fileName
  } = req.body
  const subDomain = req.headers.subdomain
  try {
    const customerId = await fetchCustomerId(subDomain)
    if (!customerId) {
      await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
    } else {
      const signedUrl = await binarySignedUrl({fileName: fileName, customerId: customerId._id})
      setSuccessResponse(signedUrl, res, req)
    }
  } catch (e) {
    log.error(e.toString())
    await setErrorResponse(null, ERROR.SIGNED_URL_FAILED, res, req)
  }
}

/**
 *  Update job API called by the server
 */

module.exports.updateJob = async (req, res) => {
  log.lambdaSetup(req, 'updateJob', 'upload.controller')
  const fileName = req.body.fileName
  const customerId = req.body.customerId
  let accountIds = []
  try {
    let db = await getDb()
    const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
    db = customerData.Tier === STANDARD_TIER ? db : await isolatedDatabase(customerData.DomainName)
    let ifProcessedAll = await db.collection('PublicUploads').findOneAndUpdate({ 'IsProcessedFileName.FileName': fileName },{
      $set: {
        'IsProcessedFileName.$.IsProcessed': true
      }
    }, { includeResultMetadata: true, returnDocument: "after" })
    ifProcessedAll = ifProcessedAll.value
    log.info(ifProcessedAll)
    const conditionArray = await ifProcessedAll.IsProcessedFileName.map(file => file.IsProcessed)
    const dataSet = ifProcessedAll.JobList
    const jobListFinal = !conditionArray.includes(undefined) ? await updatePageNumbers(dataSet, customerId) : null
    log.info('ifProcessedAll ',ifProcessedAll)
    if (jobListFinal) {
      await db.collection('PublicUploads').updateOne({ _id: ifProcessedAll._id }, { $set: { JobList: jobListFinal } })
    }
    log.info('Public upload record: ',ifProcessedAll)
    if (!conditionArray.includes(undefined) && !conditionArray.includes(false) &&
        ifProcessedAll) {
      await sendNotification(ifProcessedAll, customerData, db, '')
      await db.collection('PublicUploads').findOneAndUpdate({ _id: ifProcessedAll._id },{
        $set: {
          IsJobProcessed: true
        }
      })
      if (ifProcessedAll.JobList[0]?.UploadedFrom === 'email') {
        let response = await db.collection('Users').findOne({IsDeleted: false, IsActive: true, PrimaryEmail: ifProcessedAll.Email, TenantDomain: customerData.DomainName}, {PrimaryEmail: 1, Username: 1, GroupID: 1})
        if (response) {
          const ids = await db.collection('Groups').findOne({_id: {$in: response.GroupID}, GroupType: 'Permissions'})
          let quotas = ids?.AssociatedQuotaBalance?.length > 0 ? ids.AssociatedQuotaBalance.map(id => id.toString()) : []
          accountIds = accountIds.concat(quotas.concat(['debit']))
        }
      }
    }
    if (!conditionArray.includes(undefined) && !conditionArray.includes(false) &&
        ifProcessedAll.AutomaticPrintDelivery) {
      const policy = iotPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const endpoint = await retrieveEndpoint(region, accessParams)
      const Things = db.collection('Things')
      if (ifProcessedAll.DeviceID) {
        let thingsData = null;
        let locationId = null;
        if (ifProcessedAll.LocationID) {
          locationId = ifProcessedAll.LocationID;
          thingsData = await Things.findOne({
            CustomerID: ObjectId.createFromHexString(customerId),
            LocationID: ifProcessedAll.LocationID,
            DeviceID: ifProcessedAll.DeviceID,
            IsDeleted: false
          });
        } else {
          thingsData = await Things.findOne({
            CustomerID: ObjectId.createFromHexString(customerId),
            DeviceID: ifProcessedAll.DeviceID,
            IsDeleted: false
          });
          const deviceData = await db.collection("Devices").findOne({
            _id: ifProcessedAll.DeviceID,
          })
          locationId = deviceData?.LocationID
        }
        if (thingsData){
          const topicStr = `cmd/eprintit/${customerId}/${locationId}/${thingsData.PrimaryRegion.ThingName}/printdelivery`
          await sendMessageToKiosk(topicStr, ifProcessedAll, thingsData, ifProcessedAll.DeviceName, accessParams, endpoint, null, accountIds, db)
          await deviceHistoryForPrinting(thingsData, ifProcessedAll.DeviceName, null, ifProcessedAll._id, db, customerId,
            ifProcessedAll.IsProcessedFileName)
          return await setSuccessResponse({ message: 'updated' }, res, req)
        }
      }
      const JobLists = db.collection('JobLists')
      if (!ifProcessedAll.LocationID) {
        ifProcessedAll.LocationID = await JobLists.findOne({
          CustomerID: ObjectId.createFromHexString(customerId)
        })
        ifProcessedAll.LocationID = ifProcessedAll.LocationID ? ifProcessedAll.LocationID.DefaultAutomaticDeliveryLocation : false
      }
      let thingsData = customerId && ifProcessedAll.LocationID
        ? await Things.findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          LocationID: ifProcessedAll.LocationID,
          ThingType: 'print delivery station',
          IsDeleted: false
        })
        : false
      // extra step check device for this locationId and I know the thing and I can proceed with device passed and other info
      let deviceName = false
      // the case when we are dependent on device id to identify the thing to which the message has to be sent
      if (!thingsData) {
        const deviceData = customerId && ifProcessedAll.LocationID
          ? await db.collection('Devices').findOne({
            CustomerID: ObjectId.createFromHexString(customerId),
            LocationID: ifProcessedAll.LocationID,
            IsDeleted: false
          })
          : false
        if (deviceData) {
          thingsData = await Things.findOne({
            _id: deviceData.ThingID
          })
          if (!thingsData) {
            console.log("Device: ", deviceData?._id)
            return await setErrorResponse(null, ERROR.THING_NOT_FOUND, res, req)
          } else if (thingsData.AutoSelectPrinter === false) {
            deviceName = deviceData.Device;
          }
        } else {
          `NO Device found for: ${ifProcessedAll}`
        }
      }
      if (thingsData) {
        const topic = `cmd/eprintit/${customerId}/${thingsData.LocationID}/${thingsData.PrimaryRegion.ThingName}/printdelivery`
        const deviceIds = thingsData.DeviceID
        log.info('deviceName: ', deviceName)
        log.info('deviceName: ',deviceName)
        // logic for auto printer selection
        if (!deviceName && deviceIds.length === 1) {
          const devDetail = await db.collection('Devices').findOne({ _id: deviceIds[0] })
          deviceName = devDetail.Device
          log.info('called from device 1 function: ',deviceName)
          await sendMessageToKiosk(topic, ifProcessedAll, thingsData, deviceName, accessParams, endpoint, null, accountIds, db)
          await deviceHistoryForPrinting(thingsData, deviceName, null, ifProcessedAll._id,
            db, customerId, ifProcessedAll.IsProcessedFileName)
          await setSuccessResponse({ message: 'updated' }, res, req)
        }
        // logic is correct till here
        else if (thingsData.AutoSelectPrinter && !deviceName && deviceIds.length > 1) {
          let devCondition = {_id: { $in: deviceIds }}
          if (ifProcessedAll.LocationID){
            Object.assign(devCondition, {LocationID: ObjectId.createFromHexString(ifProcessedAll.LocationID)})
          }
          const assignedDevices = await db.collection('Devices').find(devCondition).toArray()
          for(let file of ifProcessedAll.JobList){
            const deviceFound = await smartPrintDeviceFinder(file, assignedDevices)
            if (deviceFound && deviceFound.matches > 0) {
              deviceName = deviceFound.Device
            } else {
              const defaultDevice = await db.collection('Devices').findOne({ _id: thingsData.DefaultDevice })
              deviceName = defaultDevice ? defaultDevice.Device : null
            }
            log.info('called from device 2 function')
            await sendMessageToKiosk(topic, ifProcessedAll, thingsData, deviceName, accessParams, endpoint, file.NewFileNameWithExt, accountIds, db)
            await deviceHistoryForPrinting(thingsData, deviceName, file.NewFileNameWithExt, ifProcessedAll._id, db,
              customerId, ifProcessedAll.IsProcessedFileName)
          }
          await setSuccessResponse({ message: 'updated' }, res, req)
        } else {
          log.info('called from device 3 function')
          await sendMessageToKiosk(topic, ifProcessedAll, thingsData, deviceName, accessParams, endpoint, null, accountIds, db)
          await deviceHistoryForPrinting(thingsData, deviceName, null, ifProcessedAll._id, db, customerId,
            ifProcessedAll.IsProcessedFileName)
          await setSuccessResponse({ message: 'updated' }, res, req)
        }
      } else {
        await setSuccessResponse({ message: 'updated' }, res, req)
      }
    } else {
      await setSuccessResponse({ message: 'updated' }, res, req)
    }
  } catch (e) {
    console.log('Error in updateJob API', e);
    log.error((e.toString()))
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

/**
 *  Update job API called by the server for translation service
 */

module.exports.updateTranslationJob = async (req, res) => {
  log.lambdaSetup(req, 'updateTranslationJob', 'upload.controller')
  const fileName = req.body.fileName
  const customerId = req.body.customerId
  try {
    console.log(customerId);
    let db = await getDb()
    const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
    console.log(customerData);
    db = customerData.Tier === STANDARD_TIER ? db : await isolatedDatabase(customerData.DomainName)
    let ifProcessedAll = await db.collection('TranslationUploads').findOneAndUpdate({ 'IsProcessedFileName.FileName': fileName },{
      $set: {
        'IsProcessedFileName.$.IsProcessed': true
      }
    }, { includeResultMetadata: true, returnDocument: "after" })
    ifProcessedAll = ifProcessedAll.value
    log.info(ifProcessedAll)
    const conditionArray = await ifProcessedAll.IsProcessedFileName.map(file => file.IsProcessed)
    log.info('translation upload record: ',ifProcessedAll)
    if (!conditionArray.includes(undefined) && !conditionArray.includes(false) &&
      ifProcessedAll) {
      await sendJobToAzureService(customerData, ifProcessedAll)
    }
    await setSuccessResponse({message: 'updated'}, res, req)
  } catch (e) {
    log.error((e.toString()))
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

module.exports.updateTranslationStatus = async (req, res) => {
  log.lambdaSetup(req, 'updateTranslationStatus', 'upload.controller')
  if (req.body[0]?.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    log.info('Validation Message: ', req.body)
    await setSuccessResponse({message: 'sent'}, res, req)
  } else {
    log.info('Translation Event: ', req.body)
    const translationCompleteData = req.body[0].subject
    const splitData = translationCompleteData.split('/blobServices/default/containers/target/blobs/')[1]?.split('/')
    const fileName = splitData[splitData.length - 1]
    const customerId =  splitData[1]
    try {
      let db = await getDb()
      const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
      db = customerData.Tier === STANDARD_TIER ? db : await isolatedDatabase(customerData.DomainName)
      let ifProcessedAll = await db.collection('TranslationUploads').findOneAndUpdate({ 'JobList.NewFileNameWithExt': fileName },{
        $set: {
          'JobList.$.IsTranslated': true
        }
      }, { includeResultMetadata: true, returnDocument: "after" })
      ifProcessedAll = ifProcessedAll.value
      log.info(ifProcessedAll)
      const conditionArray = await ifProcessedAll.JobList.map(file => file.IsTranslated)
      log.info('translation upload record: ',ifProcessedAll)
      if (!conditionArray.includes(undefined) && !conditionArray.includes(false) &&
        ifProcessedAll) {
        await sendJobToAzureService(customerData, ifProcessedAll, true)
      }
      await setSuccessResponse({message: 'updated'}, res, req)
    } catch (e) {
      log.error((e.toString()))
      await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
    }
  }
}

const deviceHistoryForPrinting = async (thingData, device, fileName, jobId, db, customerId, IsProcessedFileName) => {
  log.info(thingData);
  log.info(device);
  log.info(fileName);
  log.info(jobId);
  log.info(customerId);
  // if (thingData.ThingType === 'print delivery station' && thingData.offline === true) {
  if (thingData.ThingType === 'print delivery station') {
    if (device && fileName) {
      let obj = {
        DeviceName: device,
        FileName: fileName
      }
      await db.collection('PublicUploads').updateOne({ _id: ObjectId.createFromHexString(jobId), CustomerID: customerId },
        { $addToSet: { 'PrintHistory': obj  }})
    }  else if (device && !fileName) {
      let array = []
      await IsProcessedFileName.forEach(file => {
        let obj = {
          DeviceName: device,
          FileName: file.FileName
        }
        array.push(obj)
      })
      log.info('array', array)
      const response = await db.collection('PublicUploads').updateOne({ _id: ObjectId.createFromHexString(jobId), CustomerID: ObjectId.createFromHexString(customerId) },
        { $set: { 'PrintHistory': array  }})
      log.info('response*****',response)
    }
  }
}

const sendNotification = async (jobDetails, customerData, db, customerLocation) => {
  const customizationData = await db.collection('CustomizationTexts').findOne
  ({CustomerID: ObjectId.createFromHexString(customerData._id)}, {MainSection: 1, UserInformationSection: 1, CustomEmailMessage: 1})
  const {guestDisplayText, releaseCodeDisplayText, loginDisplayText} = extractNames(customizationData)
  if (jobDetails.Text) {
    let customTextSms = customizationData.CustomEmailMessage ? customizationData.CustomEmailMessage : false
    await sendSmsWorkflow(jobDetails.JobList, jobDetails.Username, jobDetails.GuestName, customerData, guestDisplayText,
        loginDisplayText, releaseCodeDisplayText, jobDetails.LibraryCard, jobDetails.ReleaseCode, jobDetails.Text, customTextSms)
  }
  if (jobDetails.Email) {
    const data = []
    await jobDetails.JobList.forEach(dataSet => {
      data.push({
        originalFileNameWithExt: dataSet.OriginalFileNameWithExt
      })
    })
    await sendEmailWorkflow(customizationData, jobDetails.GuestName, customerLocation,
        jobDetails.TotalCost, customerData, guestDisplayText, data,
        loginDisplayText, jobDetails.LibraryCard, releaseCodeDisplayText, jobDetails.ReleaseCode, jobDetails.Email)
  }
}

const extractNames = (customizationData) => {
    const guestDisplayText = customizationData.UserInformationSection && customizationData.UserInformationSection.Options &&
  customizationData.UserInformationSection.Options.Guest && customizationData.UserInformationSection.Options.Guest.GuestDisplayText
      ? customizationData.UserInformationSection.Options.Guest.GuestDisplayText
      : 'Guest Name'
  const releaseCodeDisplayText = customizationData.UserInformationSection && customizationData.UserInformationSection.Options &&
  customizationData.UserInformationSection.Options.ReleaseCode && customizationData.UserInformationSection.Options.ReleaseCode.ReleaseCodeDisplayText
      ? customizationData.UserInformationSection.Options.ReleaseCode.ReleaseCodeDisplayText
      : 'Release Code'
  const loginDisplayText = customizationData.UserInformationSection && customizationData.UserInformationSection.Options &&
  customizationData.UserInformationSection.Options.Validation && customizationData.UserInformationSection.Options.Validation.LoginDisplayText
      ? customizationData.UserInformationSection.Options.Validation.LoginDisplayText
      : 'Login'
  return {guestDisplayText, releaseCodeDisplayText, loginDisplayText}
}

const sendMessageToKiosk = async (topic, ifProcessedAll, thingsData, deviceName, accessParams, endpoint, file, accountIds, db) => {
  // to be changed till here
  log.info('Topic Name: ', topic)
  // Add device as well in the json message sent
  // const isOnline = await checkOnlineStatus(accessParams, thingsData)
  const isOnline = true
  const data = {
    MessageID: uuidv4(),
    ReleaseCode: ifProcessedAll.ReleaseCode,
    ThingName: thingsData.PrimaryRegion.ThingName,
    RequestType: 'printdelivery',
    Device: deviceName || null,
    FileNames: file ? [file] : [],
    Accounts: accountIds ? accountIds : []
  }
  if (isOnline) {
    log.info('Message Formed: ', data)
    await publishToTopic(topic, data, endpoint, accessParams)
  } else if (thingsData?.RedundancySetting?.Redundancy && thingsData?.RedundancySetting?.Primary) {
    const redundancyThings = await db.collection('Things').find({IsDeleted: false, IsActive: true,
      _id: {$in: thingsData.RedundancySetting.ThingsAssociated}}).toArray()
    for (const th of redundancyThings) {
      const newTopic = `cmd/eprintit/${th.CustomerID}/${th.LocationID}/${th.PrimaryRegion.ThingName}/printdelivery`
      if (await checkOnlineStatus(accessParams, thingsData)) {
        await publishToTopic(newTopic, data, endpoint, accessParams)
        break
      }
    }
  }
  else {
    log.info(`Skip message sending to iot as ${thingsData.PrimaryRegion.ThingName} is offline`)
  }
}

const checkOnlineStatus = async (accessParams, thingDetails) => {
  const currentStatus = await thingDetailsFun(thingDetails, accessParams)
  thingDetails.offline =  currentStatus.things[0] && currentStatus.things[0].connectivity &&
  currentStatus.things[0].connectivity.connected
    ? currentStatus.things[0].connectivity.connected
    : false
  return thingDetails.offline
}

const smartPrintDeviceFinder = async (printJob, deviceList) => {
  let highMatchDevices = {
    matches: 0
  }
  let printJobColor = printJob.Color
  let printIsDuplex = printJob.Duplex
  const printPaperSize = printJob.PaperSize
  let printOrientation = printJob.Orientation
  await deviceList.map(deviceSpecs => {
    let match = 0
    const obj = deviceSpecs
    printJobColor.toLowerCase() === 'grayscale' ? printJobColor = 'GrayScale' : printJobColor
    deviceSpecs.ColorEnabled && deviceSpecs.Color[`${printJobColor}`] === true ? match = match + 1 : null
    if (printIsDuplex) {
      printIsDuplex = 'TwoSided'
    } else {
      printIsDuplex = 'OneSided'
    }
    deviceSpecs.DuplexEnabled && deviceSpecs.Duplex[`${printIsDuplex}`] === true ? match = match + 1 : null
    printOrientation.toLowerCase() === 'landscape'
      ? printOrientation = 'LandScape'
      : printOrientation
    deviceSpecs.LayoutEnabled && deviceSpecs.Layout[`${printOrientation}`] === true ? match = match + 1 : null
    deviceSpecs.PaperSizesEnabled && deviceSpecs.PaperSizes[`${printPaperSize}`] === true ? match = match + 1 : null
    log.info('Match Count: ', match)
    obj.matches = match
    if (highMatchDevices.matches < match) {
      highMatchDevices = obj
    }
  })
  return highMatchDevices
}

const updatePageNumbers = async (jobList, customerId) => {
  try {
    const data = { customerId: customerId }
    const finalJobList = []
    const { accessParams } = await accessKeysHead(data)
    const s3 = new S3Client({
      region,
      credentials: accessParams
    })
    for (const file of jobList) {
      const params = {  
        Bucket: bucketNameConverted,
        Key: `PublicUploads/${data.customerId}/${file.NewFileNameWithExt}`
      }
      const returnedData = await headDataFile(s3, params, file)
      finalJobList.push(returnedData)
    }
    return finalJobList
  } catch (e) {
    log.info('error:', e)
    return jobList
  }
}

const headDataFile = (s3, params, file) => {
  return new Promise((resolve, reject) => {
    let unSureFormats  = ['pub', 'htm','html','xps', 'ods', 'odp']
    s3.send(new HeadObjectCommand(params), (err, data) => {
      if (err) {
        reject(err)
      } else {
        log.info('data==>>>', data)
        const obj = {}
        Object.assign(obj, file)
        if (data.Metadata.pagecount && !isNaN(parseInt(data.Metadata.pagecount))) {
          let splitFileNameForExt = obj.OriginalFileNameWithExt.split('.')
          if (parseInt(data.Metadata.pagecount) === obj.TotalPagesPerFile) {
            resolve(obj)
          } else if (unSureFormats.includes(splitFileNameForExt[splitFileNameForExt.length - 1])
              && obj.TotalPagesPerFile !== parseInt(data.Metadata.pagecount)) {
            obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount)
            obj.PageRange = `1-${data.Metadata.pagecount}`
            resolve(obj)
          } else if (obj.UploadedFrom && obj.UploadedFrom.toLowerCase() === 'email') {
            obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount)
            obj.PageRange = `1-${data.Metadata.pagecount}`
            resolve(obj)
          } else if (!unSureFormats.includes(splitFileNameForExt[splitFileNameForExt.length - 1])) {
            // Handle when S3 shows more pages than recorded
            if(parseInt(data.Metadata.pagecount) > obj.TotalPagesPerFile){
              if(obj.PageRange === '1-1' && 1 <  obj.TotalPagesPerFile){
                obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount)
              } else {
                let splitPageRange = obj.PageRange.split('-')
                if(parseInt(splitPageRange[splitPageRange.length - 1]) === obj.TotalPagesPerFile){
                  obj.PageRange = `${splitPageRange[0]}-${data.Metadata.pagecount}`
                  obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount)
                }
              }
            }
            // Handle when S3 shows fewer pages than recorded
            else if(parseInt(data.Metadata.pagecount) < obj.TotalPagesPerFile){
              let splitPageRange = obj.PageRange.split('-')
              // If PageRange end is set to the last page as calculated by the Web UI, adjust PageRange
              if(parseInt(splitPageRange[splitPageRange.length - 1]) === obj.TotalPagesPerFile){
                obj.PageRange = `${splitPageRange[0]}-${data.Metadata.pagecount}`
              }
              obj.TotalPagesPerFile = parseInt(data.Metadata.pagecount)
            }
            resolve(obj)
          }
        }
        resolve(obj)
      }
    })
  })
}

/**
 * API to generate multiple signed Urls
 */

module.exports.releaseCodeJobFinder = async (req, res) => {
  log.lambdaSetup(req, 'releaseCodeJobFinder', 'auth.controller')
  const releaseCode = req.params.code
  const customerId = req.query.id
  const tier = req.headers.tier
  const subDomain = req.headers.subdomain
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(subDomain)
  if (!customerId || !releaseCode) {
    await setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res, req)
  } else {
    try {
      const jobDoc = await findReleaseJob(releaseCode, db, customerId)
      if (!jobDoc) {
        await setErrorResponse(null, ERROR.RELEASE_CODE_INVALID, res, req)
      } else if (jobDoc.CustomerID && jobDoc.CustomerID.toString() === customerId) {
        const response = await getSignedUrls(jobDoc, customerId)
        if (releaseCode) {
          await db.collection('PublicUploads').updateOne({ ReleaseCode: releaseCode }, { $set: { IsDelivered: true } })
        }
        await setSuccessResponse(
          response, res, req)
      } else {
        await setErrorResponse(null, ERROR.RELEASE_CODE_INVALID_FOR_CUSTOMER, res, req)
      }
    } catch (e) {
      log.info(e)
      await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
    }
  }
}

/**
 * API to generate multiple signed Urls
 */

module.exports.printJobs = async (req, res) => {
  log.lambdaSetup(req, 'printJobs', 'auth.controller')
  const libraryCard = req.query.cardNumber
  const userName = req.query.userName
  const guestName = req.query.guestName
  const releaseCode = req.query.releaseCode
  const customerId = req.query.id
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  let printJobsResponse = []
  if (!customerId) {
    await setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res, req)
  } else {
    const condition = { JobExpired: false, CustomerID: ObjectId.createFromHexString(customerId), IsJobProcessed: true }
    if (userName) {
      Object.assign(condition, { Username: userName })
    } else if (guestName) {
      Object.assign(condition, { GuestName: guestName })
    } else if (libraryCard) {
      Object.assign(condition, { LibraryCard: libraryCard })
    } else if (releaseCode) {
      Object.assign(condition, { ReleaseCode: releaseCode })
    }
    try {
      const jobDoc = userName || guestName || libraryCard || releaseCode ? await findMultiplePrintJobs(condition, db) : []
      if (releaseCode && jobDoc.length === 0) {
        await setErrorResponse(null, ERROR.RELEASE_CODE_INVALID, res, req)
      } else {
        console.log('jobDoc******',jobDoc);
        const isIppPrint = jobDoc[0]?.IsIPP
        for (const job of jobDoc) {
          const response = await getSignedUrls(job, customerId, isIppPrint)
          printJobsResponse = printJobsResponse.concat(response)
        }
        await setSuccessResponse(printJobsResponse, res, req)
      }
    } catch (e) {
      setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
    }
  }
}

const findReleaseJob = (releaseCode, db, customerId) => {
  return new Promise((resolve, reject) => {
    model.publicUploads.getPublicUpload(releaseCode, db, customerId, (err, job) => {
      if (err) {
        reject(err)
      } else {
        log.info(job)
        resolve(job)
      }
    })
  })
}

const findMultiplePrintJobs = (condition, db) => {
  return new Promise((resolve, reject) => {
    model.publicUploads.getPublicUploadByPattern(condition, db, (err, job) => {
      if (err) {
        reject(err)
      } else {
        const allIds = job.map(id => id._id)
        if (allIds) {
          model.publicUploads.updateAll(allIds, db, (err, updated) => {
            if (err) {
              reject(err)
            } else {
              resolve(job)
            }
          })
        } else {
          resolve(job)
        }
      }
    })
  })
}

/**
 *  Confirm file upload API
 */

module.exports.confirmFileUpload = async (req, res) => {
  log.lambdaSetup(req, 'confirmFileUpload', 'auth.controller')
  log.info('')
  const {
    data,
    guestName,
    userName,
    libraryCard,
    customerLocation,
    totalCost,
    customerId,
    recordId,
    deviceId,
    deviceName,
    automaticDelivery,
    computerName
  } = req.body
  log.info('body: ', req.body)
  const locationId = req.body.locationId
  const email = req.body.notification ? req.body.notification?.email?.toLowerCase() : false
  const text = req.body.notification ? req.body.notification.text : false
  const requesterDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
  if (!customerId) {
    return await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
  }
  try {
    const releaseCode = await generateVerifyReleaseCode(db)
    const formInputData = await confirmUpload(data)
    await postPublicUploads({
      formInputData,
      releaseCode,
      guestName,
      userName,
      libraryCard,
      totalCost,
      text,
      email,
      customerId,
      locationId,
      recordId,
      db,
      automaticDelivery,
      computerName,
      deviceId,
      deviceName,
    })
    await setSuccessResponse({ data, guestName, userName, libraryCard, customerLocation, totalCost, releaseCode }, res, req)
  } catch (error) {
    log.error(error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const sendSmsWorkflow = async (formInputData, userName, guestName, customerData, guestDisplayText,
loginDisplayText, releaseCodeDisplayText, libraryCard, releaseCode, text, customTextSms
) =>{
  const fileList = formInputData.length
      let template = ''
      if (guestName) {
        template = guestTemplate(guestName, fileList, customerData.CustomerName, guestDisplayText)
      } else if (libraryCard) {
        template = loginTemplate(libraryCard, fileList, customerData.CustomerName, loginDisplayText)
      } else {
        template = releaseCodeTemplate(releaseCode, fileList, customerData.CustomerName, releaseCodeDisplayText)
      }
      log.info('sms--', template)
      // const subject = '(ePRINTit Printing)'
      await sendMessageAsync(text, template, customerData)
}

const sendMessageAsync = async (text, message, customerData) => {
  // Set the maximum characters per SMS
  const maxCharsPerSMS = 160;

  // Split the message into lines
  const lines = message.split('\n');

  // Initialize variables
  let currentSMS = 1;
  let currentChunk = '';
  let numSMS = 0;

  // Process each line and create SMS chunks
  for (const line of lines) {
    if ((currentChunk + line).length <= maxCharsPerSMS) {
      // Add the line to the current SMS chunk
      currentChunk += `${line}\n`;
    } else {
      // Send the completed SMS chunk and reset variables
      await sendJobText(text, currentChunk?.replace(/\n/g, '')?.trim(), currentSMS, ++numSMS, customerData)
      currentSMS++;
      currentChunk = `${line}\n`;
    }
  }

  // Send the last SMS chunk
  if (currentChunk.trim() !== '') {
    await sendJobText(text, currentChunk?.replace(/\n/g, '')?.trim(), currentSMS, ++numSMS, customerData)
  }
};

const sendEmailWorkflow = async (customizationData, guestName, customerLocation, totalCost, customerData,
                                 guestDisplayText, data, loginDisplayText, libraryCard, releaseCodeDisplayText,
                                 releaseCode, email
                                 ) => {
    const policy = await emailPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const customerUrl = customizationData.MainSection &&
          customizationData.MainSection.TopSection &&
          customizationData.MainSection.TopSection.CustomerLogo
        ? `https://api.${domainName}/logo/${bucketName}?image=${Buffer.from(customizationData.MainSection.TopSection.CustomerLogo.split('Logos')[1]).toString('base64')}`
        : null

      let customEmailMessage = customizationData.CustomEmailMessage
      ? customizationData.CustomEmailMessage : null
      // CustomerLogo
      let htmlTemplate = ''
      if (guestName) {
        htmlTemplate = await generateEJSTemplate({
          data: { guestName: guestName, customerLocation, totalCost, data, CustomerName: customerData.CustomerName, customerUrl, guestDisplayText, checkPng, customEmailMessage },
          filename: 'guestname'
        })
      } else if (libraryCard) {
        htmlTemplate = await generateEJSTemplate({
          data: { libraryCard, customerLocation, totalCost, data, CustomerName: customerData.CustomerName, customerUrl, loginDisplayText, checkPng, customEmailMessage },
          filename: 'login'
        })
      } else {
        htmlTemplate = await generateEJSTemplate({
          data: { customerLocation, totalCost, data, releaseCode, CustomerName: customerData.CustomerName, customerUrl, releaseCodeDisplayText, checkPng, customEmailMessage },
          filename: 'release-code'
        })
      }
      await sendEmail({
        data: { html: htmlTemplate, to: email },
        accessParams: accessParams,
        subject: 'upload-file',
        uploadSubject: `Your submission to ${customerData.CustomerName} was received successfully`
      })
}

const getEJSTemplateName = (reason) => {
  if (reason === "failed-format-file") {
    return "failed-format-file";
  } else if (reason === "invalid-attachment-size") {
    return "invalid-attachment-size";
  } else if (reason === "attachment-limit-exceeded") {
    return "attachment-limit-exceeded";
  } else {
    return "job-failed";
  }
};

const getEmailSubject = (reason, customerName) => {
  if (reason === "invalid-attachment-size") {
    return "Issue with File Size in Recent Job Submission";
  } else if (reason === "attachment-limit-exceeded") {
    return "Too many attachments";
  } else {
    return `Your submission to ${customerName} failed`;
  }
};


module.exports.failedJobNotify = async (req, res) => {
  log.lambdaSetup(req, 'failedJobNotify', 'auth.controller')
  const {
      email,
      files,
      customerName,
      customerUrl,
      reason,
      message
  } = req.body
  const policy = await emailPolicy()
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  let htmlTemplate = await generateEJSTemplate({
    data: {
      CustomerName: customerName,
      files,
      customerUrl,
      message
    },
    filename: getEJSTemplateName(reason)
  })
  await sendEmail({
    data: {html: htmlTemplate, to: email},
    accessParams: accessParams,
    uploadSubject: getEmailSubject(reason, customerName)
  })
  return await setSuccessResponse({message: 'success'}, res, req)

}

const sendJobToKiosk = async (releaseCode, customerId, locationId, thingId) => {
  const message = {
    ReleaseCode: releaseCode, ThingID: thingId, RequestType: 'printrelease'
  }
  const policy = iotPolicy()
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  const topic = `cmd/eprintit/${customerId}/${locationId}/${thingId}/printrelease`
  const endpoint = await retrieveEndpoint(region, accessParams)
  await publishToTopic(topic, message, endpoint, accessParams)
}
/**
 * Function to find customer by subDomain
 * @param domainName
 * @returns {Promise<unknown>}
 */

const fetchCustomerId = (domainName) => {
  return new Promise((resolve, reject) => {
    model.customers.getCustomerByDomain({ DomainName: domainName, IsDeleted: false }, (err, customer) => {
      if (err) {
        reject(err)
      } else {
        resolve(customer)
      }
    })
  })
}

/**
 * Function generate and verify release code
 * @returns {Promise<string>}
 */

const generateVerifyReleaseCode = async (db) => {
  while (1) {
    const releaseCode = randomDigits(4).join('') + Date.now().toString().slice(10 - 1)
    const result = await checkDBForReleaseCode(releaseCode, db)
    log.info(result)
    if (result === true) {
      return releaseCode
    }
  }
}

const checkDBForReleaseCode = (releaseCode, db) => {
  return new Promise((resolve, reject) => {
    model.publicUploads.getPublicUploadAll(releaseCode, db, (err, found) => {
      if (err) {
        reject(err)
      } else {
        resolve(!found)
      }
    })
  })
}

/**
 * post upload data into the database
 * @param data
 * @returns {Promise<unknown>}
 */

const postPublicUploads = ({
  formInputData, releaseCode, guestName, userName,
  libraryCard, totalCost, text, email, customerId, locationId, recordId, db, automaticDelivery, computerName,
                             deviceId, deviceName,
}) => {
  return new Promise((resolve, reject) => {
    const date = new Date()
    const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
      date.getUTCDate(), date.getUTCHours(),
      date.getUTCMinutes(), date.getUTCSeconds())
    const obj = {
      JobList: formInputData,
      ReleaseCode: releaseCode,
      GuestName: guestName,
      Username: userName,
      LibraryCard: libraryCard,
      TotalCost: totalCost,
      DeviceID: deviceId ? ObjectId.createFromHexString(deviceId) : null,
      DeviceName: deviceName,
      Text: text,
      Email: email || '',
      CustomerID: ObjectId.createFromHexString(customerId),
      AutomaticPrintDelivery: automaticDelivery,
      ComputerName: computerName,
      LocationID: locationId ? ObjectId.createFromHexString(locationId) : undefined,
      JobExpired: false,
      IsPrinted: false,
      IsDelivered: false,
      CreatedAt: new Date(now_utc),
      PrintCounter: 0,
      ExpireJobRecord: null
    }
    model.publicUploads.updatePublicUploads(obj, recordId, db, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(obj)
      }
    })
  })
}

/**
 * Business logic to generate links
 * @param data
 * @param customerId
 * @param db
 * @returns {Promise<unknown>}
 */

const generateLinksPromise = async (data, customerId, db) => {
  // return new Promise(async (resolve, reject) => {
  const arrayOfLinks = []
  const arrayOfPostData = []
  for (const upload of data) {
    upload.customerId = customerId._id.toString()
    upload.domain = customerId.DomainName
    const retrievedLink = await imageSignedUrl(upload)
    retrievedLink.contentType = upload.contentType
    arrayOfLinks.push(retrievedLink)
    arrayOfPostData.push({ FileName: retrievedLink.newFileName, IsProcessed: false })
  }
  const id = await postSignedUrlData(arrayOfPostData, db)
  return { arrayOfLinks, id }
  // })
}

const postSignedUrlData = (data, db) => {
  return new Promise((resolve, reject) => {
    const obj = {
      IsProcessedFileName: data, CreatedAt: moment().format(), ExpireJobRecord: new Date(), IsJobProcessed: false
    }
    model.publicUploads.postPublicUploads(obj, db, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result.insertedId)
      }
    })
  })
}

/**
 * get signed Urls
 * @param data
 * @param customerId
 * @param isIppPrint
 * @returns {Promise<unknown>}
 */

const getSignedUrls = async (data, customerId, isIppPrint) => {
  // return new Promise(async (resolve, reject) => {
  try {
    if (data) {
      const arrayOfLinks = []
      await bluebird.Promise.map(data.JobList, async (upload, index) => {
        upload.customerId = customerId
        const obj = {
          Copies: upload.Copies,
          Color: upload.Color,
          Staple: upload.Staple,
          Duplex: upload.Duplex,
          PaperSize: upload.PaperSize,
          Orientation: upload.Orientation,
          PageRange: upload.PageRange,
          OriginalFileNameWithExt: upload.OriginalFileNameWithExt,
          NewFileNameWithExt: upload.NewFileNameWithExt,
          TotalPagesPerFile: upload.TotalPagesPerFile ? upload.TotalPagesPerFile : null,
          Platform: upload.Platform ? upload.Platform : '',
          App: upload.App ? upload.App : '',
          UploadedFrom: upload.UploadedFrom ? upload.UploadedFrom : '',
          signedAccessLink: isIppPrint ? await getBinaryFileSignedUrl(upload) : await getSignedUrl(upload),
          LibraryCard: data.LibraryCard,
          LocationID: data.LocationID,
          ReleaseCode: data.ReleaseCode,
          Text: data.Text ? data.Text : null,
          TotalCost: data.TotalCost ? data.TotalCost : null,
          Username: data.Username ? data.Username : null,
          AutomaticPrintDelivery: data.AutomaticPrintDelivery ? data.AutomaticPrintDelivery : null,
          CustomerID: data.CustomerID ? data.CustomerID : null,
          Email: data.Email ? data.Email : null,
          GuestName: data.GuestName ? data.GuestName : null,
          JobExpired: data.JobExpired ? data.JobExpired : null,
          IsPrinted: upload.IsPrinted ? upload.IsPrinted : null,
          IsDelivered: data.IsDelivered ? data.IsDelivered : null,
          PrintCounter: upload.PrintCounter ? upload.PrintCounter : null,
          IsProcessed: data.IsProcessedFileName[index].IsProcessed ? data.IsProcessedFileName[index].IsProcessed : null,
          CreatedAt: data.CreatedAt ? data.CreatedAt : null,
          IsDeleted: upload.IsDeleted
        }
        if (!obj.IsDeleted) {
          arrayOfLinks.push(obj)
        }
      }, { concurrency: 3 })
      return arrayOfLinks
    } else {
      return []
    }
  } catch (error) {
    log.error(error.toString())
    throw error
  }
  // })
}

/**
 * confirm upload function
 * @param data
 * @returns {Promise<unknown>}
 */

const confirmUpload = (data) => {
  return new Promise((resolve, reject) => {
    const arrayOfLinks = []
    const uploads = Array.isArray(data) ? data : [];
    for (const upload of uploads) {
      const obj = {
        Copies: upload.copies ? upload.copies : 1,
        Color: upload.color,
        Duplex: upload.duplex,
        PaperSize: upload.paperSize,
        Orientation: upload.orientation,
        TotalPagesPerFile: upload.totalPagesPerFile,
        PageRange: upload.pageRange,
        OriginalFileNameWithExt: upload.originalFileNameWithExt,
        NewFileNameWithExt: `${upload.newFileName}`,
        UploadStatus: upload.uploadStatus,
        Platform: upload.platform ? upload.platform : '',
        IsDeleted: false,
        IsPrinted: false,
        PrintCounter: 0,
        App: upload.app ? upload.app : '',
        Staple: upload?.staple || null,
        UploadedFrom: upload.uploadedFrom ? upload.uploadedFrom : ''
      }
      arrayOfLinks.push(obj)
    }
    resolve(arrayOfLinks)
  })
}

module.exports.generateTheme = (req, res) => {
  log.lambdaSetup(req, 'generateTheme', 'upload.controller')
  const themeCode = req.query.themeCode
  const colorPalette = generatePalette(themeCode)
  setSuccessResponse(colorPalette, res, req)
}

/**
 * API to generate multiple signed Urls with server-side encryption (v2)
 */

module.exports.generateMultipleSignedUrlsV2 = async (req, res) => {
  log.lambdaSetup(req, 'generateMultipleUrlsV2', 'auth.controller')
  const {
    uploadObjectsDetails
  } = req.body
  const subDomain = req.headers.subdomain
  const tier = req.headers.tier
  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(subDomain)
  if (uploadObjectsDetails.length === 0) {
    await setErrorResponse(null, ERROR.NO_FILES_ENTERED, res, req)
  } else if (!subDomain) {
    await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
  } else {
    try {
      const customerId = await fetchCustomerId(subDomain)
      if (!customerId) {
        await setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, res, req)
      } else {
        // Use a v2 version of the generateLinksPromise function that ensures server-side encryption
        const signedUrlLinks = await generateLinksPromiseV2(uploadObjectsDetails, customerId, db)
        await setSuccessResponse(signedUrlLinks, res, req)
      }
    } catch (e) {
      log.error(e.toString())
      await setErrorResponse(null, ERROR.SIGNED_URL_FAILED, res, req)
    }
  }
}


const generateLinksPromiseV2 = async (data, customerId, db) => {
  // return new Promise(async (resolve, reject) => {
  const arrayOfLinks = []
  const arrayOfPostData = []
  for (const upload of data) {
    upload.customerId = customerId._id.toString()
    upload.domain = customerId.DomainName
    const retrievedLink = await imageSignedUrlV2(upload)
    retrievedLink.contentType = upload.contentType
    arrayOfLinks.push(retrievedLink)
    arrayOfPostData.push({ FileName: retrievedLink.newFileName, IsProcessed: false })
  }
  const id = await postSignedUrlData(arrayOfPostData, db)
  return { arrayOfLinks, id }
  // })
}
