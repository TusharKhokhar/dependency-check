const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const { Things: Thing } = require("../models/collections");

// Things Model
const Things = {}

/**
 * Method to get all ThingInformation
 */

Things.getThingsInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, locationIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'asc' ? 1 : -1
    sortKey = sortKey || '_id'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (locationIds && locationIds.length > 0) {
      locationIds = locationIds.map(locId => {
        return ObjectId.createFromHexString(locId)
      })
      Object.assign(condition, { LocationID: { $in: locationIds } })
    }
    if (pattern) {
      Object.assign(searchCondition, {
        $or: [
          { Thing: new RegExp(pattern, 'i') },
          { ThingType: new RegExp(pattern, 'i') },
          { AppVersion: new RegExp(pattern, 'i') },
          { OnlineStatus: new RegExp(pattern, 'i') },
          { LocationName: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { Label: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === true
      Object.assign(condition, { IsActive: status })
    }
    const query = [
      {
        $match: condition
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
      },
      {
        $lookup: {
          from: 'Customers',
          localField: 'CustomerID',
          foreignField: '_id',
          as: 'CustomerData'
        }
      },
      {
        $unwind: {
          path: '$CustomerData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'Devices',
          localField: 'DeviceID',
          foreignField: '_id',
          as: 'DeviceData'
        }
      },
      {
        $project: {
          DisplayName: '$DisplayName',
          ThingType: '$ThingType',
          DeviceID: '$DeviceID',
          LocationName: '$LocationData.Location',
          DeviceData: '$DeviceData',
          CustomerID: '$CustomerID',
          CustomerData: {
            CustomerName: '$CustomerData.CustomerName',
            _id: '$CustomerData._id',
            DomainName: '$CustomerData.DomainName'
          },
          LocationID: '$LocationID',
          LocationData: {
            Location: '$LocationData.Location',
            _id: '$LocationData._id'
          },
          AppVersion: '$AppVersion',
          OnlineStatus: '$OnlineStatus',
          Application: '$Application',
          Enabled: '$Enabled',
          IsActive: '$IsActive',
          Thing: '$Thing',
          Label: '$Label',
          Status: '$Status',
          ActivationCode: '$ActivationCode',
          ActivationStatus: '$ActivationStatus',
          DisplayQrCode: '$DisplayQrCode',
          DefaultDevice: '$DefaultDevice',
          TimeOut: '$TimeOut',
          ClearLogsAfter: '$ClearLogsAfter',
          DebugLog: '$DebugLog',
          AutoSelectPrinter: '$AutoSelectPrinter',
          LoginOptions: '$LoginOptions',
          PaymentOptions: '$PaymentOptions',
          AutomaticSoftwareUpdate: '$AutomaticSoftwareUpdate',
          CreatedBy: '$CreatedBy',
          Tags: '$Tags',
          PJLPrint: '$PJLPrint',
          PdfiumPrint: '$PdfiumPrint',
          PrintUSBAsGuest: '$PrintUSBAsGuest',
          PrintUSBWithAccount: '$PrintUSBWithAccount',
          MultithreadPrint: '$MultithreadPrint',
          PromptForAccount: '$PromptForAccount',
          EmailAsReleaseCode: '$EmailAsReleaseCode',
          SerialNumber: '$SerialNumber',
          Firmware: '$Firmware',
          IpAddress: '$IpAddress',
          MacAddress: '$MacAddress',
          ComputerName: '$ComputerName',
          RedundancySetting: {
            Redundancy: '$RedundancySetting.Redundancy',
            Primary: '$RedundancySetting.Primary',
            ThingsAssociated: '$RedundancySetting.ThingsAssociated',
            PrimaryThingID: '$RedundancySetting.PrimaryThingID'
          }
        }
      },
      {
        $match: searchCondition
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      thing: collection.aggregate(query, { collation: { locale: 'en' } })
        .sort({ [sortKey]: sort })
        .skip(skips)
        .limit(limit).toArray(),
      total: collection.aggregate(totalQuery).toArray()
    }).then(results => {
      results.total = results.total[0] &&
            results.total[0].total
        ? results.total[0].total
        : 0
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Things.getThingById = async ({ thingId, projection, db }) => {
  try {
    return await db
      .collection(Thing)
      .findOne({ _id: ObjectId.createFromHexString(thingId) }, { projection });
  } catch (error) {
    throw error;
  }
};

// Export Things model
module.exports = Things
