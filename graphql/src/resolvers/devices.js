const { Devices, Licenses, Things, Customers } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer,
  getDatabaseForGetAllAPI, verifyUserAccess, verifyKioskAndUserAccess
} = require('../../helpers/util')
const { GraphQLError } = require('graphql')
const {
  DEVICE_ALREADY_EXIST, REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, INVALID_STATUS, LICENSE_LIMIT_THINGS,
  NO_ACTIVE_LICENSE, LICENSE_NOT_CONFIGURED, DISASSOCIATE_BEFORE_DELETION, LICENSE_NOT_CONFIGURED_FOR_THIS_TYPE,
  PRINT_MODE_CONFLICT
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const { findReference } = require('../../helpers/referenceFinder')
const { iotPolicy } = require('../../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../../helpers/credentialsGenerator')
const { thingDetails } = require('../../services/iot-online')
const bluebird = require('bluebird')
const { customerSecurity } = require('../../utils/validation')
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const { v4: uuidv4 } = require('uuid');
const {domainName} = require("../../config/config");
const {encryptText, decryptText} = require("../../helpers/encryptDecrypt");
const { deviceData } = require('../../helpers/xlsColumns')
const { Parser } = require('json2csv')
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addDevice (_, { addDeviceInput }, context, info) {
      log.lambdaSetup(context, 'devices', 'addDevice')
      addDeviceInput = await formObjectIds(addDeviceInput)
      const {
        Device,
        DeviceType,
        Description,
        Tags,
        Label,
        Enabled,
        NetBiosName,
        MacAddress,
        CustomerID,
        LocationID,
        IsActive,
        AreaID,
        QrCode,
        ThingID,
        Color,
        Duplex,
        Layout,
        PaperSizes,
        SupportedPrintOptions,
        ColorEnabled,
        DuplexEnabled,
        LayoutEnabled,
        PaperSizesEnabled,
        IppPrintOptions,
        TcpPrintOptions,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted = false
      } = addDeviceInput
      let newDevice = {
        Device: Device,
        DeviceType: DeviceType,
        QrCode: QrCode,
        Description: Description,
        Label: Label,
        Enabled: Enabled,
        NetBiosName: NetBiosName,
        MacAddress: MacAddress,
        IsActive: IsActive,
        CustomerID: CustomerID,
        LocationID: LocationID,
        AreaID: AreaID,
        ThingID: ThingID,
        Color: Color,
        Duplex: Duplex,
        Layout: Layout,
        PaperSizes: PaperSizes,
        Tags: Tags,
        ColorEnabled: ColorEnabled,
        DuplexEnabled: DuplexEnabled,
        LayoutEnabled: LayoutEnabled,
        PaperSizesEnabled: PaperSizesEnabled,
        SupportedPrintOptions: SupportedPrintOptions,
        IppPrintOptions: IppPrintOptions,
        TcpPrintOptions : TcpPrintOptions,
        CreatedBy: CreatedBy,
        IsDeleted: IsDeleted
      }
      if (IppPrintOptions?.IppPrint) {
        newDevice.IppPrintOptions.PrinterUUID = `urn:uuid:${uuidv4()}`
        newDevice.IppPrintOptions.Password = newDevice?.IppPrintOptions?.Password ? await encryptText(newDevice.IppPrintOptions.Password) : null
      }
      try {
        verifyUserAccess(context, CustomerID)
        newDevice = await addCreateTimeStamp(newDevice)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const validateDevice = await db.collection(Devices).findOne({
          CustomerID: CustomerID,
          LocationID: LocationID,
          Device: { $regex: `^${Device}$`, $options: 'i' },
          IsDeleted: false
        })
        if (validateDevice) {
          throw new Error(DEVICE_ALREADY_EXIST)
        } else {
          const commonDb = await getDatabase(context)
          const licenseData = await commonDb.collection(Licenses).findOne({ CustomerID: CustomerID, IsActive: true, IsDeleted: false })
          if (licenseData) {
            if (!licenseData.DevicesLimit) {
              throw new GraphQLError(LICENSE_NOT_CONFIGURED, {
                extensions: {
                  code: '400'
                }
              })
            }
            const deviceArray = await db.collection(Devices).find({ CustomerID: CustomerID, DeviceType: DeviceType, IsActive: true, IsDeleted: false }, { DeviceType: 1 }).toArray()
            let limitObj = {}
            // eslint-disable-next-line array-callback-return
            const deviceLimitMap = licenseData.DevicesLimit.length > 0 && await Promise.all(licenseData.DevicesLimit.map(data => {
              if (data.DeviceType === DeviceType) {
                limitObj = data
                return limitObj
              }
            }))
            log.info(deviceLimitMap);
            if(Object.keys(limitObj).length === 0){
              throw new GraphQLError(LICENSE_NOT_CONFIGURED_FOR_THIS_TYPE, {
                extensions: {
                  code: '400'
                }
              })
            }
            if (deviceArray.length >= limitObj.DeviceNumber) {
              throw new GraphQLError(LICENSE_LIMIT_THINGS, {
                extensions: {
                  code: '400'
                }
              })
            } else {
              if (IppPrintOptions?.IppPrint && TcpPrintOptions?.TcpPrint) {
                throw new GraphQLError(PRINT_MODE_CONFLICT, {
                  extensions: {
                    code: '400'
                  }
                })
              }
              const { insertedId } = await db.collection(Devices).insertOne(newDevice)
              const thingToBeAssigned = ThingID ? await db.collection(Things).findOne({ _id: ObjectId.createFromHexString(ThingID) }) : null
              if(thingToBeAssigned && thingToBeAssigned.ThingType.toLowerCase() === 'kiosk'){
                await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(ThingID) },
                    { $set: { DeviceID: [insertedId] } })
                await db.collection(Devices).updateOne({ _id: {$in: thingToBeAssigned.DeviceID} },
                    { $set: { ThingID: null } })
              } else if (ThingID) {
                await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(ThingID) }, { $push: { DeviceID: insertedId } })
              }
              return await db.collection(Devices).findOne({ _id: insertedId })
            }
          } else {
            throw new GraphQLError(NO_ACTIVE_LICENSE, {
              extensions: {
                code: '400'
              }
            })
          }
        }
      } catch (error) {
        log.error('error: ', error)
        throw new Error(error)
      }
    },

    async updateDevice (_, { updateDeviceInput, deviceId }, context, info) {
      log.lambdaSetup(context, 'devices', 'updateDevice')
      try {        
        const db = await getDatabaseOneCustomer(context, updateDeviceInput.CustomerID)
        verifyUserAccess(context, updateDeviceInput.CustomerID)
        const currentDeviceData = await db.collection(Devices).findOne({ _id: ObjectId.createFromHexString(deviceId) })
        if (updateDeviceInput?.IppPrintOptions?.IppPrint && updateDeviceInput?.TcpPrintOptions?.TcpPrint) {
          throw new GraphQLError(PRINT_MODE_CONFLICT, {
            extensions: {
              code: '400'
            }
          });
        }
        dot.remove('CustomerID', updateDeviceInput)
        if (updateDeviceInput.ThingID) {
          const thingToBeAssigned = await db.collection(Things).findOne({ _id: ObjectId.createFromHexString(updateDeviceInput.ThingID) })
          if ((updateDeviceInput.ThingID && currentDeviceData.ThingID &&
                  (currentDeviceData.ThingID.toString() !== updateDeviceInput.ThingID.toString())) ||
              (!currentDeviceData.ThingID)
          ) {
            // eslint-disable-next-line no-unused-expressions
            currentDeviceData && currentDeviceData.ThingID
              ? await db.collection(Things).updateOne({ _id: currentDeviceData.ThingID },
                { $pull: { DeviceID: ObjectId.createFromHexString(deviceId) } })
              : []
            if(thingToBeAssigned.ThingType.toLowerCase() === 'kiosk'){
              await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(updateDeviceInput.ThingID) },
                  { $set: { DeviceID: [ObjectId.createFromHexString(deviceId)] } })
              await db.collection(Devices).updateOne({ _id: {$in: thingToBeAssigned.DeviceID} },
                  { $set: { ThingID: null } })
            } else {
              await db.collection(Things).updateOne({ _id: ObjectId.createFromHexString(updateDeviceInput.ThingID) },
                  { $push: { DeviceID: ObjectId.createFromHexString(deviceId) } })
            }
          }
        }
        if (updateDeviceInput?.IppPrintOptions?.IppPrint && !updateDeviceInput?.IppPrintOptions?.PrinterUUID) {
          updateDeviceInput.IppPrintOptions.PrinterUUID = `urn:uuid:${uuidv4()}`
          updateDeviceInput.IppPrintOptions.Password = updateDeviceInput?.IppPrintOptions?.Password ? await encryptText(updateDeviceInput.IppPrintOptions.Password) : null

        }
        updateDeviceInput = addUpdateTimeStamp(updateDeviceInput)
        let updateObject = await dot.dot(updateDeviceInput)
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        updateObject = formObjectIds(updateObject, true)
        await db.collection(Devices).updateOne({ _id: ObjectId.createFromHexString(deviceId) }, {
          $set:
          updateObject
        })
        return {
          message: 'Updated successfully',
          statusCode: 200
        }
      } catch (error) {
        log.error('updateDevice error: ', error)
        throw new Error(error)
      }
    },

      async saveIppPrinterAttributes (_, { customerId, deviceId, attributes }, context, info) {
          log.lambdaSetup(context, 'devices', 'saveIppPrinterAttributes')
          try {
              context.data.isKiosk ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
              const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
              await db.collection(Devices).updateOne({
                  CustomerID: ObjectId.createFromHexString(customerId),
                  _id: ObjectId.createFromHexString(deviceId),
                  IsDeleted: false,
              }, {$set: {PrinterAttributes: attributes}})
              return {
                  message: 'Updated successfully',
                  statusCode: 200
              }
          } catch (err) {
              log.error(err)
              throw new Error(err)
          }
      },

    async deviceDeleted (_, { IsDeleted, deviceId, customerId }, context, info) {
      log.lambdaSetup(context, 'devices', 'deviceDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!deviceId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('devices', deviceId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Devices).updateOne({ _id: ObjectId.createFromHexString(deviceId) }, { $set: { IsDeleted: IsDeleted } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async deviceStatus (_, { IsActive, deviceId, customerId }, context) {
      log.lambdaSetup(context, 'devices', 'deviceStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!deviceId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        await db.collection(Devices).updateOne({ _id: ObjectId.createFromHexString(deviceId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getDevices (_, { paginationInput, customerIds, locationIds, online, deviceIds, groupIds, isAssigned }, context) {
      log.lambdaSetup(context, 'devices', 'getDevices')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey,
        searchKey
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
      const collection = db.collection(Devices)
      return await model.devices.getDevicesInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        locationIds,
        collection,
        deviceIds,
        groupIds,
        isAssigned,
        searchKey
      }).then(async deviceList => {
        if (online) {
          const policy = await iotPolicy()
          const credentials = await getStsCredentials(policy)
          const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
          }
          deviceList.device = deviceList.device ? await getOnlineDevicesList(deviceList.device, accessParams) : []
          return deviceList
        } else {
          return deviceList
        }
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getDevice (_, { deviceId, customerId }, context) {
      log.lambdaSetup(context, 'devices', 'getDevice')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const customerData = await db.collection(Customers).findOne({ _id: ObjectId.createFromHexString(customerId) }, { CustomerName: 1 })
        const response = await db.collection(Devices).findOne({ _id: ObjectId.createFromHexString(deviceId) })
        response.CustomerName = customerData.CustomerName
        if (response?.IppPrintOptions?.IppPrint) {
          const encodedDeviceName = encodeURIComponent(response.Device)
          response.IppPrintOptions.PrintUrl = `http://ipp.${domainName}/ipp/${customerData.DomainName}/${encodedDeviceName}`
          if (response?.IppPrintOptions?.Tls) {
            response.IppPrintOptions.PrintSecureUrl = `https://ipp.${domainName}/ipp/${customerData.DomainName}/${encodedDeviceName}`
          }
          if (response?.IppPrintOptions?.Password) {
            try {
              response.IppPrintOptions.Password = await decryptText(response.IppPrintOptions.Password)
            } catch (e) {
              await encryptText(response.IppPrintOptions.Password)
            }
          }
        }
        return response
      } catch (err) {
        throw new Error(err)
      }
    },

    async importDevice (_, { customerId }, context) {
      log.lambdaSetup(context, 'devices', 'importDevice')
      try {
        verifyUserAccess(context, customerId)
        const finalReport = [ {
          Device: 'device1',
          DeviceType: 'printer',
          Description: 'description',
          LocationName: 'locationName1',
          ThingName: 'thingName1',
          MacAddress: 'macAddress1',
          Tags: 'Tags',
        },]
        const json2csvParser = new Parser({ fields: deviceData, del: ',' })
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

const getOnlineDevicesList = async (deviceList, accessParams) => {
  const thingNames = await Promise.all(deviceList.map(device => {
    if (device.ThingData &&
        device.ThingData.PrimaryRegion &&
        device.ThingData.PrimaryRegion.ThingName) {
      return device.ThingData.PrimaryRegion.ThingName
    }
  }).filter(dev => dev !== undefined))
  const onlineTracker = await stepOne(thingNames, accessParams)
  return await stepTwo(thingNames, deviceList, onlineTracker)
}

const stepOne = async (thingNames, accessParams) => {
  const onlineTracker = {}
  await bluebird.Promise.map(thingNames, async (thing) => {
    const currentStatus = await thingDetails({ PrimaryRegion: { ThingName: thing } }, accessParams)
    const onlineStatus = currentStatus.things[0] && currentStatus.things[0].connectivity &&
    currentStatus.things[0].connectivity.connected
      ? currentStatus.things[0].connectivity.connected
      : false
    const obj = {}
    obj[thing] = onlineStatus
    Object.assign(onlineTracker, obj)
  }, { concurrency: 4 })
  return onlineTracker
}

const stepTwo = async (thingNames, deviceList, onlineTracker) => {
  const finalRes = []
  await bluebird.Promise.map(deviceList, (device) => {
    let obj = {}
    obj = device
    device.ThingData.OnlineStatus = device.ThingData &&
    device.ThingData.PrimaryRegion &&
    device.ThingData.PrimaryRegion.ThingName
      ? onlineTracker[device.ThingData.PrimaryRegion.ThingName]
      : false
    finalRes.push(obj)
  }, { concurrency: 4 })
  return finalRes
}
