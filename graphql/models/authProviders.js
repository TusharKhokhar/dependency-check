const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// AuthProviders Model
const AuthProviders = {}

/**
 * Method to get all AuthProviderInformation
 */

AuthProviders.getAuthProvidersInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, authProviderType, collection, customerIds}) => {
  return new Promise((resolve, reject) => {
    const condition = {IsDeleted: false}
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'AuthProvider'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if(authProviderType && authProviderType.length > 0){
      Object.assign(condition, { AuthProvider: { $in: authProviderType } })
    }
    if (pattern) {
      Object.assign(searchCondition, {
        $or: [
          { AuthProvider: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') },
          { ProviderName: new RegExp(pattern, 'i') },
          { LabelText: new RegExp(pattern, 'i') }
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
        $match: searchCondition
      },
      {
        $lookup: {
          from: 'Groups',
          localField: 'DefaultGroupID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, GroupName: 1 } }
          ],
          as: 'DefaultGroupData'
        }
      },
      {
        $unwind: {
          path: '$DefaultGroupData',
          preserveNullAndEmptyArrays: true
        }
      },
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      authProvider: pageNumber && limit
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

// Export AuthProviders model
module.exports = AuthProviders
