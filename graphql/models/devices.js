const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Devices Model
const Devices = {}

Devices.getDevicesInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, locationIds, collection, deviceIds, groupIds, isAssigned, searchKey }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Device'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (deviceIds && deviceIds.length > 0) {
      deviceIds = deviceIds.map(devId => {
        return ObjectId.createFromHexString(devId)
      })
      Object.assign(condition, { _id: { $in: deviceIds } })
    }
    if (groupIds && groupIds.length > 0) {
      groupIds = groupIds.map(groupIdd => {
        return ObjectId.createFromHexString(groupIdd)
      })
      Object.assign(condition, { GroupID: { $in: groupIds } })
    }
    if (locationIds && locationIds.length > 0) {
      locationIds = locationIds.map(locId => {
        return ObjectId.createFromHexString(locId)
      })
      Object.assign(condition, { LocationID: { $in: locationIds } })
    }

    if (searchKey) {
        Object.assign(searchCondition, {
            $or: [
            { [searchKey]: new RegExp(pattern, 'i') }
            ]})
    }
    if (pattern && !searchKey) {
      Object.assign(searchCondition, {
        $or: [
          { Device: new RegExp(pattern, 'i') },
          { DeviceType: new RegExp(pattern, 'i') },
          { NetBiosName: new RegExp(pattern, 'i') },
          { MacAddress: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') },
          { 'ThingData.Thing': new RegExp(pattern, 'i') },
          { 'LocationData.Location': new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === true
      Object.assign(condition, { IsActive: status })
    }
    if(isAssigned === false){
      Object.assign(condition, { ThingID: null })
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
          from: 'Things',
          localField: 'ThingID',
          foreignField: '_id',
          as: 'ThingData'
        }
      },
      {
        $unwind: {
          path: '$ThingData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          Device: '$Device',
          Description: '$Description',
          DeviceType: '$DeviceType',
          MacAddress: '$MacAddress',
          NetBiosName: '$NetBiosName',
          CustomerID: '$CustomerID',
          QrCode: '$QrCode',
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
          ThingData: {
            Thing: '$ThingData.Thing',
            _id: '$ThingData._id',
            PrimaryRegion: '$ThingData.PrimaryRegion'
          },
          ThingID: '$ThingID',
          IsActive: '$IsActive',
          CreatedBy: '$CreatedBy',
          UpdatedBy: '$UpdatedBy',
          Label: '$Label',
          Tags: '$Tags'
        }
      },
      {
        $match: searchCondition
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      device: limit
        ? collection
            .aggregate(query, { collation: { locale: "en" } })
            .sort({ [sortKey]: sort })
            .skip(skips)
            .limit(limit)
            .toArray()
        : collection
            .aggregate(query, { collation: { locale: "en" } })
            .sort({ [sortKey]: sort })
            .toArray(),
      total: collection.aggregate(totalQuery).toArray(),
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

// Export Devices model
module.exports = Devices
