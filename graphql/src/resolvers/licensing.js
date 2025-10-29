const model = require('../../models/index')
const { REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, INVALID_STATUS } = require('../../helpers/error-messages')
const { GraphQLError } = require('graphql')
const dot = require('dot-object')
const { Licenses } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess} = require('../../helpers/util')
const {customerSecurity} = require("../../utils/validation");
const { fromZonedTime, format, toZonedTime } = require('date-fns-tz')
const {Parser} = require("json2csv");
const {licenseMapping} = require("../../helpers/xlsColumns");
const Customers = require("../../models/customers");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async updateLicense (_, { updateLicenseInput, licenseId }, context, info) {
      log.lambdaSetup(context, 'licenses', 'updateLicense')
      updateLicenseInput.UpdatedBy = context.data._id
      verifyUserAccess(context, updateLicenseInput.CustomerID)
      if (updateLicenseInput.RegisterDate) {
        updateLicenseInput.RegisterDate = new Date(updateLicenseInput.RegisterDate)
        updateLicenseInput.RegisteredTo = new Date(updateLicenseInput.RegisteredTo)
      }
      let updateObject = await dot.dot(updateLicenseInput)
      updateObject = await formObjectIds(updateObject, true)
      updateLicenseInput = await addUpdateTimeStamp(updateLicenseInput)
      const db = await getDatabase(context)
      await db.collection(Licenses).updateOne({ _id: ObjectId.createFromHexString(licenseId) }, {
        $set: updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async licenseDeleted (_, { IsDeleted, licenseId }, context, info) {
      log.lambdaSetup(context, 'licneses', 'licenseDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!licenseId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        await db.collection(Licenses).updateOne({ _id: ObjectId.createFromHexString(licenseId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async licenseStatus (_, { IsActive, licenseId, customerId }, context) {
      log.lambdaSetup(context, 'licenses', 'licenseStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!licenseId) {
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
        const db = await getDatabase(context)
        await db.collection(Licenses).updateOne({ _id: ObjectId.createFromHexString(licenseId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getLicenses (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'licenses', 'getLicenses')
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
      const db = await getDatabase(context)
      const collection = db.collection(Licenses)
      return await model.licenses.getLicensesInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection
      }).then(licenseList => {
        // licenseList.total = licenseList.total.length
        return licenseList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getLicense (_, { customerId }, context) {
      log.lambdaSetup(context, 'licenses', 'getLicense')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        return await db.collection(Licenses).findOne({ CustomerID: ObjectId.createFromHexString(customerId) })
      } catch (err) {
        throw new Error(err)
      }
    },

    async licenseExpiringCustomers (_, { timezone, startDate, endDate, customerIds }, context) {
      log.lambdaSetup(context, 'licenses', 'licenseExpiringCustomers')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        let finalReport = []
        let customerId = context.data.customerIdsStrings
        const db = await getDatabase(context)
        customerId = customerId.map(cust => ObjectId.createFromHexString(cust))
        customerIds = customerIds ? customerIds.map(id => ObjectId.createFromHexString(id)) : []
        customerId = customerId.concat(customerIds)
        timezone = timezone || 'America/Chicago'
        const { dateFrom, dateTo } = await convertFilterTime(startDate, endDate, timezone)
        let licenseQuery = {IsDeleted: false, RegisteredTo: {$gte: dateFrom, $lte: dateTo}}
        customerId.length > 0 ? Object.assign(licenseQuery, {CustomerID: {$in: customerId}}) : {}
        const licensesData = await db.collection(Licenses).find(licenseQuery).sort({ RegisterDate: 1 }).toArray()
        let customerQuery = {IsDeleted: false}
        customerId.length > 0 ? Object.assign(customerQuery, {_id: {$in: customerId}}) : {}
        const customers = await db.collection('Customers').find().toArray()
        const mappedCustomers = await customers.map(cust => cust._id.toString())
        log.info(licensesData);
        await licensesData.forEach(data => {
          const obj = {}
          Object.assign(obj, data)
          obj.RegisteredTo = format(toZonedTime(data.RegisteredTo, timezone), 'MM/dd/yyyy')
          obj.CustomerName = customers[mappedCustomers.indexOf(data.CustomerID.toString())].CustomerName
          obj.CustomerType = customers[mappedCustomers.indexOf(data.CustomerID.toString())].CustomerType
          obj.Tier = customers[mappedCustomers.indexOf(data.CustomerID.toString())].Tier
          obj.Partner = customers[mappedCustomers.indexOf(data.CustomerID.toString())].Partner
          obj.Envisionware = data.Envisionware ? 'Enabled' : 'Disabled'
          obj.ItsMyPc = data.ItsMyPc ? 'Enabled' : 'Disabled'
          obj.EmailService = data.EmailService ? 'Enabled' : 'Disabled'
          obj.Things =  commaSeperatedThingOrDeviceType(null, data.ThingsLimit)
          obj.Devices = commaSeperatedThingOrDeviceType(data.DevicesLimit, null)
          finalReport.push(obj)
        })
        const json2csvParser = new Parser({ fields: licenseMapping, del: ','})
        const finalCsvData = await json2csvParser.parse(finalReport)
        return { base64: Buffer.from(finalCsvData).toString('base64') }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

const commaSeperatedThingOrDeviceType = (deviceLimit, thingLimit) => {
  if (deviceLimit) {
    let device = ''
    deviceLimit.forEach(dev => {
      device = device.concat(`${dev.DeviceType} = ${dev.DeviceNumber} | `)
    })
    return device
  }
  if (thingLimit) {
    let thing = ''
    thingLimit.forEach(dev => {
      thing = thing.concat(`${dev.ThingType} = ${dev.ThingNumber} | `,)
    })
    return thing
  }
}

const convertFilterTime = async (dateFrom, nowUtc, timeZone) => {
  if (dateFrom && nowUtc) {
    dateFrom = await fromZonedTime(dateFrom, timeZone)
    nowUtc = await fromZonedTime(nowUtc, timeZone)
    dateFrom = new Date(dateFrom)
    nowUtc = new Date(nowUtc)
    return { dateFrom, dateTo: nowUtc, timeZone }
  }
}