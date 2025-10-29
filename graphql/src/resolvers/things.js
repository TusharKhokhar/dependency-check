const { GraphQLError } = require('graphql')
const {
  THING_ALREADY_EXIST, REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, LICENSE_LIMIT_THINGS, INVALID_STATUS,
  PDS_ALREADY_EXISTS, LICENSE_NOT_CONFIGURED, DISASSOCIATE_BEFORE_DELETION, LICENSE_NOT_CONFIGURED_FOR_THIS_TYPE,
  KIOSK_CAN_BE_ASSOCIATED_WITH_ONE_DEVICE, THING_TYPE_NOT_SUPPORTED, NO_ACTIVE_LICENSE, SENT_EMAIL_SUCCESSFULLY
} = require('../../helpers/error-messages')
const {
  createThing, createPolicy,
  attachCertificateWithThing, attachPrincipalPolicy, decryptIoTCertificate,
  encryptIoTCertificate, fetchCertificatesById, fetchIoTEndpoint, registerDeviceCert, fetchCaCertificate,
  getPrivateKeyToSignCert, deleteIoTThing, deAttachThingPrincipalPolicy, deleteCertificate, deactivateCertificate,
  detachPolicy
} = require('../../services/iot-handler')
const config = require('../../config/config')
const { iotPolicy } = require('../../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../../helpers/credentialsGenerator')
const { ACTIVATED_CODE_SUCCESSFULLY } = require('../../helpers/success-constants')
const fs = require('fs')
const { randomDigits } = require('crypto-secure-random-digit')
const dot = require('dot-object')
const { createDeviceCert } = require('../../helpers/certCreate')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer,
  getDatabaseForGetAllAPI, verifyUserAccess, verifyKioskAndUserAccess,
  escapeRegex
} = require('../../helpers/util')
const model = require('../../models/index')
const { Things, ActivationCodes, Customers, Licenses, Devices } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { thingDetails } = require('../../services/iot-online')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const {primaryRegion, secondaryRegion, awsAccountNumber, domainName} = require("../../config/config");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
const { thingData } = require('../../helpers/xlsColumns')
const { Parser } = require('json2csv')
const sendEmailAttachments = require("../../services/emailService");

dot.keepArray = true

module.exports = {
  Mutation: {
    async addThing (_, { addThingInput }, context, info) {
      log.lambdaSetup(context, 'things', 'addThing')
      addThingInput = formObjectIds(addThingInput)
      const {
        Label,
        Thing,
        ThingType,
        DisplayQrCode,
        Description,
        Enabled,
        CustomerID,
        LocationID,
        AreaID,
        DeviceID,
        CustomizationID,
        ThingArn,
        ThingName,
        ThingID,
        Topic,
        AppVersion,
        OnlineStatus,
        ProfileID,
        Application,
        Tags,
        AutoSelectPrinter,
        DebugLog,
        ClearLogsAfter,
        TimeOut,
        DefaultDevice,
        LoginOptions,
        PaymentOptions,
        PJLPrint,
        PdfiumPrint,
        MultithreadPrint,
        MessageBox,
        GuestCopy,
        GuestScan,
        PrintUSBAsGuest,
        PrintUSBWithAccount,
        SupportedIdentityProviderID,
        RedundancySetting,
        AutomaticSoftwareUpdate = true,
        PromptForAccount,
        EmailAsReleaseCode,
        SerialNumber,
        Firmware,
        IpAddress,
        MacAddress,
        ComputerName,
        IsActive,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted
      } = addThingInput
      let newThing = {
        Label: Label,
        Thing: Thing,
        ThingType: ThingType,
        Description: Description,
        Enabled: Enabled,
        CustomerID: CustomerID,
        LocationID: LocationID,
        AreaID: AreaID,
        DeviceID: DeviceID || [],
        CustomizationID: CustomizationID,
        ThingArn: ThingArn,
        ThingName: ThingName,
        ThingID: ThingID,
        Topic: Topic,
        AppVersion: AppVersion,
        OnlineStatus: OnlineStatus,
        ProfileID: ProfileID,
        Application: Application,
        Tags: Tags,
        AutoSelectPrinter: AutoSelectPrinter,
        DebugLog: DebugLog,
        PrintUSBAsGuest,
        PrintUSBWithAccount,
        ClearLogsAfter: ClearLogsAfter,
        TimeOut: TimeOut,
        DefaultDevice: ObjectId.createFromHexString(DefaultDevice),
        CreatedBy: CreatedBy,
        DisplayQrCode: DisplayQrCode || false,
        IsDeleted: IsDeleted,
        PaymentOptions: PaymentOptions,
        PJLPrint: PJLPrint,
        PdfiumPrint: PdfiumPrint,
        MultithreadPrint: MultithreadPrint,
        MessageBox: MessageBox,
        GuestCopy: GuestCopy,
        GuestScan: GuestScan,
        AutomaticSoftwareUpdate: AutomaticSoftwareUpdate,
        LoginOptions: LoginOptions,
        SupportedIdentityProviderID: SupportedIdentityProviderID,
        RedundancySetting: RedundancySetting,
        PromptForAccount: PromptForAccount || false,
        EmailAsReleaseCode: EmailAsReleaseCode|| false,
        SerialNumber: SerialNumber,
        Firmware: Firmware,
        IpAddress: IpAddress,
        MacAddress: MacAddress,
        ComputerName: ComputerName,
        IsActive: IsActive
      }
      newThing.SupportedIdentityProviderID = newThing?.SupportedIdentityProviderID?.map(idp => ObjectId.createFromHexString(idp))
      verifyUserAccess(context, CustomerID)
      const db = await getDatabaseOneCustomer(context, CustomerID)
      newThing = addCreateTimeStamp(newThing)
      try {
        const validateThing = await db.collection(Things).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          $or: [
            { Label: { $regex: `^${escapeRegex(Label)}$`, $options: 'i' } },
            { Thing: { $regex: `^${escapeRegex(Thing)}$`, $options: 'i' } }
          ],
          IsDeleted: false
        })
        if(ThingType && (ThingType.toLowerCase() === 'kiosk' && DeviceID.length > 1)){
          throw new Error(KIOSK_CAN_BE_ASSOCIATED_WITH_ONE_DEVICE)
        }
        if (validateThing) {
          throw new Error(THING_ALREADY_EXIST)
        } else {
          const commonDb = await getDatabase(context)
          const {ThingType: supportedThingTypes} = await commonDb.collection('Dropdowns').findOne({}, {ThingType: 1})
          if (!supportedThingTypes.includes(ThingType)) {
            throw new Error(THING_TYPE_NOT_SUPPORTED)
          }
          const licenseData = await commonDb.collection(Licenses).findOne({ CustomerID: ObjectId.createFromHexString(CustomerID) })
          if (!licenseData.ThingsLimit) {
            throw new GraphQLError(LICENSE_NOT_CONFIGURED, {
              extensions: {
                code: '400'
              }
            })
          }
          const thingArray = await db.collection(Things).find({
            CustomerID: CustomerID,
            ThingType: ThingType,
            IsActive: true,
            IsDeleted: false
          }, { ThingType: 1 }).toArray()
          let limitObj = {}
          log.info('======>>>>', licenseData)
          // eslint-disable-next-line
          licenseData.ThingsLimit.forEach(data => {
            if (data.ThingType === ThingType) {
              limitObj = data
            }
          })
          if(Object.keys(limitObj).length === 0){
            throw new GraphQLError(LICENSE_NOT_CONFIGURED_FOR_THIS_TYPE, {
              extensions: {
                code: '400'
              }
            })
          }
          if (thingArray.length >= limitObj.ThingNumber) {
            throw new GraphQLError(LICENSE_LIMIT_THINGS, {
              extensions: {
                code: '121'
              }
            })
          } else {
            // validate print delivery at one location logic
            const printDeliveryFound = ThingType === 'print delivery station'
              ? await db.collection(Things).findOne({
                LocationID: ObjectId.createFromHexString(LocationID),
                ThingType: 'print delivery station',
                IsDeleted: false
              })
              : false
            if (printDeliveryFound) {
              throw new GraphQLError(PDS_ALREADY_EXISTS, {
                extensions: {
                  code: '121'
                }
              })
            } else {
              const { insertedId } = await db.collection(Things).insertOne(newThing)
              if (DeviceID) {
                await deviceMapping({ DeviceID, db, thingId: insertedId, update: false })
              }
              const data = await db.collection(Things).findOne({ _id: insertedId })
              await mapRedundantIds(data, db, null)
              data.iotThingName = `${data._id}-${Date.now()}`
              const primaryRegion = await createIoTResources(data, config.primaryRegion)
              data.PrimaryRegion = {
                PolicyName: primaryRegion.policyData.policyName,
                ThingArn: primaryRegion.iotData.thingArn,
                ThingName: primaryRegion.iotData.thingName,
                ThingID: primaryRegion.iotData.thingId,
                CertificateID: primaryRegion.certificateData.certificateId,
                EncryptedPrivateKey: primaryRegion.privateKey
              }
              await createIoTResourcesSecondaryRegion(data, config.secondaryRegion, primaryRegion.deviceCerts, primaryRegion.devicePrivateKey)
              await db.collection(Things).updateOne({ _id: insertedId }, { $set: data })
              return data
            }
          }
        }
      } catch (error) {
        log.error(error)
        throw new Error(error)
      }
    },

    async updateThing (_, { updateThingInput, thingId }, context, info) {
      log.lambdaSetup(context, 'things', 'updateThing')
      let {
        Thing,
        Label,
        CustomerID,
        LocationID,
        DeviceID,
        ThingType
      } = updateThingInput
      const db = await getDatabaseOneCustomer(context, CustomerID)
      verifyUserAccess(context, CustomerID)
      const validateThingDuplicacy = await db.collection(Things).findOne({
        _id: { $ne: ObjectId.createFromHexString(thingId) },
        CustomerID: ObjectId.createFromHexString(CustomerID),
        $or: [
          { Label: { $regex: `^${escapeRegex(Label)}$`, $options: 'i' } },
          { Thing: { $regex: `^${escapeRegex(Thing)}$`, $options: 'i' } }
        ],
        IsDeleted: false
      })
      const commonDb = await getDatabase(context)
      const {ThingType: supportedThingTypes} = await commonDb.collection('Dropdowns').findOne({}, {ThingType: 1})
      if (!supportedThingTypes.includes(ThingType)) {
        throw new Error(THING_TYPE_NOT_SUPPORTED)
      }
      const thingCurrent = await db.collection(Things).findOne({ _id: ObjectId.createFromHexString(thingId) })
      ThingType = ThingType ? ThingType : thingCurrent.ThingType
      if(ThingType && (ThingType.toLowerCase() === 'kiosk' && DeviceID.length > 1)){
        throw new Error(KIOSK_CAN_BE_ASSOCIATED_WITH_ONE_DEVICE)
      }
      if (validateThingDuplicacy) {
        throw new Error(THING_ALREADY_EXIST)
      } else {
        // validate print delivery at one location logic
        if (ThingType === 'print delivery station' && LocationID !== thingCurrent.LocationID.toString()) {
          const printDeliveryFound = await db.collection(Things).findOne({
            LocationID: ObjectId.createFromHexString(LocationID),
            IsDeleted: false,
            ThingType: 'print delivery station',
            _id: { $ne: ObjectId.createFromHexString(thingId) }
          })
          if (printDeliveryFound) {
            throw new GraphQLError(PDS_ALREADY_EXISTS, {
              extensions: {
                code: '121'
              }
            })
          }
        }
        if (DeviceID) {
          await deviceMapping({
            DeviceID,
            db,
            thingCurrent,
            thingId,
            update: true
          })
        }
        updateThingInput = await addUpdateTimeStamp(updateThingInput)
        await mapRedundantIds(thingCurrent, db, updateThingInput)
        let updateObject = await dot.dot(updateThingInput)
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        updateObject = await formObjectIds(updateObject, true)
        dot.remove('CustomerID', updateObject)
        await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(thingId) }, {
          $set:
          updateObject
        })
        return {
          message: 'Updated successfully',
          statusCode: 200
        }
      }
    },

    async thingDeleted (_, { IsDeleted, thingId, customerId }, context, info) {
      log.lambdaSetup(context, 'things', 'thingDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!thingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const errorSet = await findReference('things', thingId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '121'
            }
          })
        } else {
          await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(thingId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
          const thingData = await db.collection(Things).findOne({ _id: ObjectId.createFromHexString(thingId)})
          const licenseFound = await db.collection(Licenses).findOne({ ThingsIDs: thingId })
          await deleteIoTResources(thingData, primaryRegion)
          await deleteIoTResources(thingData, secondaryRegion)
          if (licenseFound) {
            const newArrayIds = licenseFound.ThingsIDs.filter(e => e !== thingId)
            await db.collection(Licenses).updateOne({ _id: licenseFound._id }, {
              $set: {
                ThingsIDs: newArrayIds
              }
            })
            return response
          } else {
            return response
          }
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async thingStatus (_, { IsActive, thingId, customerId }, context) {
      log.lambdaSetup(context, 'things', 'thingStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!thingId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(thingId) }, { $set: { IsActive: IsActive } })
        const licenseFound = await db.collection(Licenses).findOne({ ThingsIDs: ObjectId.createFromHexString(thingId) })
        if (licenseFound) {
          const newArrayIds = licenseFound.ThingsIDs.filter(e => e !== thingId)
          await db.collection(Licenses).updateOne({ _id: licenseFound._id }, {
            $set: {
              ThingsIDs: newArrayIds
            }
          })
          return response
        } else {
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },
    async emailService (_, { emailBody, customerId, serviceName }, context) {
      const {
        EmailAddress: emailAddress,
        CC: cc,
        Subject: subject,
        BodyMessage: bodyMessage,
        Attachments: attachments
      } = emailBody
      try {
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const jobListData = await db.collection('JobLists').findOne({CustomerID: ObjectId.createFromHexString(customerId)})
        const licenseData = await db.collection('Licenses').findOne({CustomerID: ObjectId.createFromHexString(customerId)})
        if (licenseData?.EmailService) {
          const {totalSize, response} = attachments?.length > 0 ?
            await sendEmailAttachments.sendEmailAttachments(attachments, `DoNotReply@${domainName}`, emailAddress,
            subject, bodyMessage, cc, customerId, jobListData?.ExpireJobRecord, serviceName) : {totalSize: 0, response: true}
          await logEmailServiceData(db, customerId, attachments, emailAddress, cc, serviceName, response, totalSize)
          return {
            message: SENT_EMAIL_SUCCESSFULLY,
            statusCode: 200
          }
        } else {
          throw new GraphQLError(NO_ACTIVE_LICENSE, {
            extensions: {
              code: '121'
            }
          })
        }
      } catch (error) {
        log.error(error)
        throw new Error(error)
      }
    }
  },

  Query: {
    async getThings (_, { paginationInput, customerIds, locationIds }, context) {
      log.lambdaSetup(context, 'things', 'getThings')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(Things)
      return await model.things.getThingsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        locationIds,
        collection
      }).then(thingList => {
        return thingList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getThing (_, { thingId, customerId }, context) {
      log.lambdaSetup(context, 'things', 'getThing')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = await db.collection(Things).findOne({ _id: ObjectId.createFromHexString(thingId) })
        const customerData = await db.collection(Customers).findOne({ _id: ObjectId.createFromHexString(customerId) }, { CustomerName: 1 })
        response.DeviceData = await response.DeviceID ? db.collection(Devices).find({ _id: { $in: response.DeviceID } }).toArray() : []
        const policy = await iotPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
          accessKeyId: credentials.Credentials.AccessKeyId,
          secretAccessKey: credentials.Credentials.SecretAccessKey,
          sessionToken: credentials.Credentials.SessionToken
        }
        const currentStatus = await thingDetails(response, accessParams)
        const onlineStatus = currentStatus.things[0] && currentStatus.things[0].connectivity &&
            currentStatus.things[0].connectivity.connected
          ? currentStatus.things[0].connectivity.connected
          : false
        const disconnectReason = currentStatus.things[0] && currentStatus.things[0].connectivity &&
            currentStatus.things[0].connectivity.disconnectReason
          ? currentStatus.things[0].connectivity.disconnectReason
          : false
        response.CustomerName = customerData.CustomerName
        response.OnlineStatus = onlineStatus
        response.DisconnectReason = disconnectReason
        log.info(response)
        return response
      } catch (err) {
        log.error(err)
        throw new Error(err)
      }
    },

    async generateActivationCode (_, { thingId, customerId }, context) {
      log.lambdaSetup(context, 'things', 'generateActivationCode')
      try {
        verifyUserAccess(context, customerId)
        customerId = ObjectId.createFromHexString(customerId)
        thingId = ObjectId.createFromHexString(thingId)
        const commonDb = await getDatabase(context)
        const db = await getDatabaseOneCustomer(context, customerId)
        const activationCode = randomDigits(4).join('') + Date.now().toString().slice(10 - 3)
        const customerData = await db.collection(Customers).findOne({ _id: customerId }, { Tier: 1, DomainName: 1 })
        const newActivationCode = {
          CustomerID: customerId,
          ActivationCode: activationCode,
          Tier: customerData.Tier,
          DomainName: customerData.DomainName,
          ThingID: thingId
        }
        await commonDb.collection(ActivationCodes).insertOne(newActivationCode)
        await db.collection(Things).updateOne({ _id: thingId, CustomerID: customerId },
          { $set: { ActivationCode: activationCode, ActivationStatus: 'PENDING', ThingTagID: null } })
        return {
          message: `${ACTIVATED_CODE_SUCCESSFULLY}: ${activationCode}`,
          statusCode: 200
        }
      } catch (err) {
        throw new Error(err)
      }
    },

    async getThingCertificates (_, { certId, customerId }, context) {
      log.lambdaSetup(context, 'things', 'getThingCertificates')
      try {
        verifyUserAccess(context, customerId)
        const policy = await iotPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
          accessKeyId: credentials.Credentials.AccessKeyId,
          secretAccessKey: credentials.Credentials.SecretAccessKey,
          sessionToken: credentials.Credentials.SessionToken
        }
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const thingData = await db.collection(Things).findOne({ 'PrimaryRegion.CertificateID': certId })
        const decryptedPrivateKey = await decryptIoTCertificate(thingData.PrimaryRegion.EncryptedPrivateKey)
        const certData = await fetchCertificatesById(certId, config.region, accessParams)
        const endPoint = await fetchIoTEndpoint(config.region, accessParams)
        const rootCa = fs.readFileSync('./amazonCerts/AmazonRootCA1.pem').toString()
        return {
          PrivateKey: decryptedPrivateKey,
          Certificate: certData.certificateDescription.certificatePem,
          RootCa: rootCa,
          Endpoint: endPoint.endpointAddress
        }
      } catch (err) {
        throw new Error(err)
      }
    },

    async importThing (_, { customerId }, context) {
      log.lambdaSetup(context, 'things', 'importThing')
      try {
        verifyUserAccess(context, customerId)
        const finalReport = [{
          Label: 'Label',
          Thing: 'Thing',
          ThingType: 'kiosk',
          LocationName: 'LocationName',
          DeviceName: 'DeviceName',
          AutoSelectPrinter: 'false',
          GuestCopy: 'false',
          GuestScan: 'false',
          PrintUSBAsGuest: 'false',
          PrintUSBWithAccount: 'false',
          DebugLog: 'false',
          ClearLogsAfter: 7,
          TimeOut: 60,
          AutomaticSoftwareUpdate: 'true',
          LoginOptionReleaseCode: 'true',
          PromptForAccount: 'true',
          LoginOptionReleaseCodeLabel: 'LoginOptionReleaseCodeLabel',
          LoginOptionReleaseCodeHomeMessage: 'welcome message',
          LoginOptionGuestName: 'false',
          LoginOptionGuestLabel: 'LoginOptionGuestLabel',
          LoginOptionCardNumber: 'false',
          LoginOptionCardNumberPin: 'false',
          ExternalCardValidation: 'false',
          ExternalCardIdpName: 'ExternalCardIdpName',
          LoginOptionUsername: 'false',
          LoginOptionUsernameLabel: 'LoginOptionUsernameLabel',
          LoginOptionIdentityProvider: 'false',
          LoginOptionIdentityProviderOne: 'LoginOptionIdentityProviderOne',
          LoginOptionIdentityProviderTwo: 'LoginOptionIdentityProviderTwo',
          LoginOptionIdentityProviderThree: 'LoginOptionIdentityProviderThree',
          LoginOptionIdentityProviderFour: 'LoginOptionIdentityProviderFour',
          Tags: 'Tags',
          DisplayQrCode: 'false',
        }]
        const json2csvParser = new Parser({ fields: thingData, del: ',' })
        const finalCsvData = await json2csvParser.parse(finalReport)
        const template = Buffer.from(finalCsvData).toString('base64')
        return {
          "message": template,
          "statusCode": 200
        }
      } catch (e) {
        log.error(e)
        throw new Error(e)
      }
    }
  }
}

// Function calls

const createIoTResources = async (data, region) => {
  try {
    const policy = await iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const iotData = await createThing(data, region, accessParams)
    const { certificateDescription: { certificatePem } } = await fetchCaCertificate(region, accessParams)
    const signerPrivateKey = await getPrivateKeyToSignCert(region)
    const { certificate: deviceCerts, privateKey: devicePrivateKey } = await createDeviceCert(certificatePem, signerPrivateKey, data.iotThingName)
    const certificateData = await registerDeviceCert(region, accessParams, deviceCerts, certificatePem)
    const policyData = await createPolicy(data, iotData, region, accessParams)
    await attachPrincipalPolicy(policyData, certificateData, region, accessParams)
    await attachCertificateWithThing(iotData, certificateData, region, accessParams)
    const privateKey = await encryptIoTCertificate(devicePrivateKey)
    return { iotData, certificateData, policyData, privateKey, deviceCerts }
  } catch (e) {
    console.log('e********',e);
    log.info('=======', e)
    return e
  }
}

const deleteIoTResources = async (data, region) => {
  try {
    const policy = await iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken
    }
    const certificateArn = `arn:aws:iot:${region}:${awsAccountNumber}:cert/${data.PrimaryRegion.CertificateID}`
    await deAttachThingPrincipalPolicy(certificateArn, region, accessParams, data.PrimaryRegion.ThingName)
    await detachPolicy(data.PrimaryRegion.PolicyName, region, accessParams, certificateArn)
    await deactivateCertificate(data.PrimaryRegion.CertificateID, region, accessParams)
    await deleteCertificate(data.PrimaryRegion.CertificateID, region, accessParams)
    await deleteIoTThing(accessParams, data.PrimaryRegion.ThingName, region)
    return true
  } catch (e) {
    log.error('=======', e)
    throw new Error(e)
  }
}

const createIoTResourcesSecondaryRegion = async (data, region, deviceCerts, devicePrivateKey) => {
  const policy = await iotPolicy()
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  const iotData = await createThing(data, region, accessParams)
  const { certificateDescription: { certificatePem } } = await fetchCaCertificate(region, accessParams)
  const certificateData = await registerDeviceCert(region, accessParams, deviceCerts, certificatePem)
  const policyData = await createPolicy(data, iotData, region, accessParams)
  await attachPrincipalPolicy(policyData, certificateData, region, accessParams)
  await attachCertificateWithThing(iotData, certificateData, region, accessParams)
  return { iotData, certificateData, policyData, deviceCerts, devicePrivateKey }
}

const deviceMapping = async ({ DeviceID, db, thingCurrent, thingId, update }) => {
  try {
    const incomingDeviceList = DeviceID && DeviceID.length > 0 ? await Promise.all(DeviceID.map(dev => ObjectId.createFromHexString(dev))) : []
    thingId = ObjectId.createFromHexString(thingId)
    log.info('ob device: ', `${incomingDeviceList} and ${thingCurrent}`)
    if (update && incomingDeviceList && thingCurrent.DeviceID) {
      const allDevices = await db.collection(Devices).find({ ThingID: thingId }, { QrCode: 0 }).toArray()
      const arrayOfDeviceIds = await allDevices.map(obj => obj._id.toString())
      log.info('arrayOfDeviceIds = ', arrayOfDeviceIds)
      // eslint-disable-next-line
      const devicesUnassigned = await allDevices.map(obj => {
        if (!DeviceID.includes(obj._id.toString())) {
          return obj._id
        }
      }).filter(fi => fi !== undefined)
      log.info('devicesUnassigned = ', devicesUnassigned)
      log.info('incomingDeviceList = ', incomingDeviceList)
      let devicesAssigned = DeviceID.filter(obj => !arrayOfDeviceIds.includes(obj))
      devicesAssigned = devicesAssigned.map(obj => ObjectId.createFromHexString(obj))
      log.info('devicesAssigned = ', devicesAssigned)
      const noChangeInAssignment = incomingDeviceList.toString() === arrayOfDeviceIds.toString()
      if (noChangeInAssignment) {
        log.info('No assignment change')
      } else {
        if (devicesUnassigned.length > 0) {
          const resp = await db.collection(Things).updateMany({ _id: ObjectId.createFromHexString(thingId) },
            { $pull: { DeviceID: { $in: devicesUnassigned } } }, { multi: true })
          log.info(resp)
          // await db.collection(Devices).updateMany({_id: {$in: incomingDeviceList}}, {$set: {ThingID: ObjectId(thingId)}}, {multi: true})
          await db.collection(Devices).updateMany({ _id: { $in: devicesUnassigned } }, { $set: { ThingID: null } }, { multi: true })
        }
        if (devicesAssigned.length > 0) {
          await changeDeviceAssociation(db, devicesAssigned, thingId)
        }
      }
    } else {
      await changeDeviceAssociation(db, incomingDeviceList, thingId)
    }
  } catch (e) {
    log.error(e)
    throw new Error(e)
  }
}

const changeDeviceAssociation = async (db, DeviceID, thingId) => {
  const deviceData = await db.collection(Devices).find({ _id: { $in: DeviceID } }).toArray()
  const thingIdsToBeDisassociated = deviceData && await deviceData.map(dev => dev.ThingID)
  if (thingIdsToBeDisassociated.length > 0) {
    await db.collection(Things).updateMany({ _id: { $in: thingIdsToBeDisassociated } },
      { $pull: { DeviceID: { $in: DeviceID } } }, { multi: true })
  }
  await db.collection(Devices).updateMany({ _id: { $in: DeviceID } }, { $set: { ThingID: ObjectId.createFromHexString(thingId) } }, { multi: true })
}


const logEmailServiceData = async (db, customerId, attachments, emailAddress, cc,
                                   serviceName, status, attachmentSize) => {
  let data = {
    CustomerID: ObjectId.createFromHexString(customerId),
    SentToEmailAddress: emailAddress,
    SentCCEmailAddress: cc,
    Status: status,
    FilesMetaData: attachments,
    ServiceType: serviceName,
    IsActive: true
  }
  data = addCreateTimeStamp(data)
  return db.collection('EmailUploads').insertOne(data)
}

const mapRedundantIds = async (thingCurrent, db, thingNew) => {
  if (thingCurrent?.RedundancySetting?.Redundancy && thingCurrent?.RedundancySetting?.Primary &&  thingNew?.RedundancySetting?.ThingsAssociated) {
      await db.collection('Things').updateMany({IsDeleted: false, _id: {$in: thingNew.RedundancySetting.ThingsAssociated}, CustomerID: thingCurrent.CustomerID}, {$set: {
          'RedundancySetting.PrimaryThingID': thingCurrent.RedundancySetting.PrimaryThingID
        }}, {multi: true})
  } else if (thingCurrent?.RedundancySetting?.Redundancy && !thingCurrent?.RedundancySetting?.Primary
    && thingNew.RedundancySetting.PrimaryThingID) {
    await db.collection('Things').updateOne({IsDeleted: false, _id: thingNew.RedundancySetting.PrimaryThingID,
        CustomerID: thingCurrent.CustomerID},
      { $addToSet: { 'RedundancySetting.PrimaryThingID': thingCurrent.RedundancySetting.PrimaryThingID } })
  } else if (thingCurrent?.RedundancySetting?.Redundancy === false &&
    thingNew?.RedundancySetting?.Redundancy !== thingCurrent?.RedundancySetting?.Redundancy) {
    await db.collection('Things').updateMany({IsDeleted: false, _id: {$in: thingNew.RedundancySetting.ThingsAssociated}, CustomerID: thingCurrent.CustomerID}, {$set: {
        'RedundancySetting.PrimaryThingID': null
      }}, {multi: true})
  }
}