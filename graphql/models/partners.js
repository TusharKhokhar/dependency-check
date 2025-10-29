const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

const Partners = {}

Partners.getPartnersInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'UpdatedAt'
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
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') }
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
          from: 'Customers',
          localField: 'CustomerID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, CustomerName: 1 } }
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
        $group: {
          _id: { CustomerName: '$CustomerData.CustomerName', CustomerID: '$CustomerID' },
          Keys: {
            $push: {
              ApiKey: '$ApiKey',
              CreatedAt: '$CreatedAt',
              IsActive: '$IsActive'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          CustomerName: '$_id.CustomerName',
          CustomerID: '$_id.CustomerID',
          Keys: '$Keys'
        }
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      partner: pageNumber && limit
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
      reject(err)
    })
  })
}

Partners.getApiKeysByCustomerID = ({ status, pattern, sort, pageNumber, limit, sortKey, customerId, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false, CustomerID: ObjectId.createFromHexString(customerId) }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'UpdatedAt'
    const skips = limit * (pageNumber - 1)
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { ApiKey: new RegExp(pattern, 'i') }
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
        $project: {
          ApiKey: 1,
          CustomerID: 1,
          CreatedAt: 1,
          IsActive: 1,
          IsDeleted: 1,
          Read: 1,
          Write: 1
        }
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      keys: pageNumber && limit
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
      reject(err)
    })
  })
}

module.exports = Partners
