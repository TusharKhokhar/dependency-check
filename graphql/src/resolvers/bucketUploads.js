const { imageSignedUrl, uploadMultipleFiles, uploadMultipleFilesV2} = require('../../helpers/imageUpload')
const {getObjectId: ObjectId} = require("../../helpers/objectIdConverter");
const {getDb, isolatedDatabase} = require("../../config/dbHandler");
const {verifyKioskAndUserAccess, verifyUserAccess, formObjectIds, getDatabaseOneCustomer} = require("../../helpers/util");
const {LICENSE_NOT_ACTIVE} = require("../../helpers/error-messages");
const { GraphQLError } = require('graphql');
const {STANDARD_TIER} = require("../../helpers/constants");
const CustomLogger = require("../../helpers/customLogger");
const {customerSecurity} = require("../../utils/validation");
const {randomDigits} = require("crypto-secure-random-digit");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async signedUrl (_, { fileInput }, context, info) {
      return await imageSignedUrl(fileInput)
    },
    async uploadMultipleFiles (_, { fileInput, customerId, path }, context, info) {
      try {
        const db = await getDb()
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        if (path === 'TranslationService') {
          const license = await db.collection('Licenses').findOne({CustomerID: ObjectId.createFromHexString(customerId), 'TranslationLicenseOption.Text': true})
          if (!license) {
            throw new GraphQLError(LICENSE_NOT_ACTIVE,{extensions: {code: '121'}})
          }
          path = `PublicUploads/${path}`
          const response =  await uploadMultipleFiles(fileInput, customerId, path)
          return {id: response.id, signedUrls: response.signedUrls}
        }
        return uploadMultipleFiles(fileInput, customerId, path, context)
      } catch (error) {
        return error
      }
    },
    async uploadMultipleFilesV2 (_, { fileInput, customerId, path }, context, info) {
      try {
        const db = await getDb()
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        if (path === 'TranslationService') {
          const license = await db.collection('Licenses').findOne({CustomerID: ObjectId.createFromHexString(customerId), 'TranslationLicenseOption.Text': true})
          if (!license) {
            throw new GraphQLError(LICENSE_NOT_ACTIVE,{extensions: {code: '121'}})
          }
          path = `PublicUploads/${path}`
          const response =  await uploadMultipleFilesV2(fileInput, customerId, path)
          return {id: response.id, signedUrls: response.signedUrls}
        }
        return uploadMultipleFilesV2(fileInput, customerId, path, context)
      } catch (error) {
        return error
      }
    },
    async confirmFileUpload (_, {customerId, recordId, confirmFileUploadData}, context) {
      let {
        JobList,
        Username,
        SourceLanguage,
        TargetLanguage,
        GenerateAudio,
        DeliveryMethod
      } = confirmFileUploadData
      context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
      DeliveryMethod = await formObjectIds(DeliveryMethod)
      const date = new Date()
      const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
        date.getUTCDate(), date.getUTCHours(),
        date.getUTCMinutes(), date.getUTCSeconds())
      const db = await getDb()
      let finalUploadData = {
        "CreatedAt" : new Date(now_utc),
        "ExpireJobRecord" : null,
        "CustomerID" : ObjectId.createFromHexString(customerId),
        "IsDelivered" : false,
        "IsTranslated" : false,
        "JobExpired" : false,
        "JobList" : JobList,
        "Username" : Username,
        "SourceLanguage" : SourceLanguage,
        "TargetLanguage" : TargetLanguage,
        "GenerateAudio" : GenerateAudio,
        DeliveryMethod: DeliveryMethod,
      }
      await db.collection('TranslationUploads').updateOne({_id: ObjectId.createFromHexString(recordId)}, {$set: finalUploadData})
      return await db.collection('TranslationUploads').findOne({_id: ObjectId.createFromHexString(recordId),
        CustomerID: ObjectId.createFromHexString(customerId)})
    },

    async confirmFileUploadV2 (_, {customerId, recordId, confirmFileUploadData}, context) {
      log.lambdaSetup(context, 'bucketUploads', 'confirmFileUploadV2')
      let {
        Notification: notification,
        DeviceID: deviceId,
        DeviceName: deviceName,
        GuestName: guestName,
        Username: userName,
        LibraryCard: libraryCard,
        CustomerLocation: customerLocation,
        TotalCost: totalCost,
        LocationID: locationId,
        AutomaticDelivery: automaticDelivery,
        ComputerName: computerName,
        JobList: formInputData
      } = confirmFileUploadData
      verifyUserAccess(context, customerId)
      const email = notification ? notification?.Email?.toLowerCase() : false
      const text = notification ? notification.Text : false
      const db = await getDatabaseOneCustomer(context, customerId)
      try {
        const releaseCode = await generateVerifyReleaseCode(db)
        const jobList = await confirmUpload(formInputData)
        await postPublicUploads({
          jobList,
          releaseCode,
          guestName,
          userName: context?.data?.user?.Username,
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
        return {
        GuestName: guestName,
        Username: userName,
        LibraryCard: libraryCard,
        CustomerLocation: customerLocation,
        TotalCost: totalCost,
        ReleaseCode: releaseCode,
        Data: jobList
      }
      } catch (error) {
        console.error(error)
        log.error(error.toString())
        throw new Error(error)
      }
    }
  }
}


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
  return new Promise(async (resolve, reject) => {
    await getPublicUploadAll(releaseCode, db, (err, found) => {
      if (err) {
        reject(err)
      } else {
        resolve(!found)
      }
    })
  })
}

const getPublicUploadAll = async (releaseCode, db, callback) => {
  const getPublicUploadAllData = await db.collection('PublicUploads').findOne({ ReleaseCode: releaseCode })
  callback(null, getPublicUploadAllData)
}

const confirmUpload = (data) => {
  return new Promise((resolve, reject) => {
    const arrayOfLinks = []
    for (const upload of data) {
      const obj = {
        Copies: upload.Copies ? upload.Copies : 1,
        Color: upload.Color,
        Duplex: upload.Duplex,
        PaperSize: upload.PaperSize,
        Orientation: upload.Orientation,
        TotalPagesPerFile: upload.TotalPagesPerFile,
        PageRange: upload.PageRange,
        OriginalFileNameWithExt: upload.OriginalFileNameWithExt,
        NewFileNameWithExt: `${upload.NewFileNameWithExt}`,
        UploadStatus: upload.UploadStatus,
        Platform: upload.Platform ? upload.Platform : '',
        IsDeleted: false,
        IsPrinted: false,
        PrintCounter: 0,
        App: upload.App ? upload.App : '',
        Staple: upload?.Staple || null,
        UploadedFrom: upload.UploadedFrom ? upload.UploadedFrom : ''
      }
      arrayOfLinks.push(obj)
    }
    resolve(arrayOfLinks)
  })
}

const postPublicUploads = ({
                             jobList, releaseCode, guestName, userName,
                             libraryCard, totalCost, text, email, customerId, locationId, recordId, db, automaticDelivery, computerName,
                             deviceId, deviceName,
                           }) => {
  return new Promise((resolve, reject) => {
    const date = new Date()
    const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
      date.getUTCDate(), date.getUTCHours(),
      date.getUTCMinutes(), date.getUTCSeconds())
    const obj = {
      JobList: jobList,
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
    updatePublicUploads(obj, recordId, db, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(obj)
      }
    })
  })
}

const updatePublicUploads = async (data, id, db, callback) => {
  const updatePublicUploadData = await db.collection('PublicUploads').findOneAndUpdate({ _id: ObjectId.createFromHexString(id) }, { $set: data })
  callback(null, updatePublicUploadData)
}