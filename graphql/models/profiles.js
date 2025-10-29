const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Profiles Model
const Profiles = {}

/**
 * Method to get all ProfileInformation
 */

Profiles.getProfilesInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, collection, customerIds}) => {
  return new Promise((resolve, reject) => {
    const condition = {IsDeleted: false}
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Profile'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (pattern) {
      Object.assign(searchCondition, {
        $or: [
          { Profile: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    const query = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Customers',
          localField: 'CustomerID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, CustomerName: 1, Tier: 1, DomainName: 1 } }
          ],
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
        $match: searchCondition
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      profile: pageNumber && limit
        ? collection.aggregate(query, { collation: { locale: 'en' } })
          .sort({ [sortKey]: sort })
          .skip(skips)
          .limit(limit).toArray()
        : collection.aggregate(query, { collation: { locale: 'en' } })
          .sort({ [sortKey]: sort }).toArray(),
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

// Export Profiles model
module.exports = Profiles
