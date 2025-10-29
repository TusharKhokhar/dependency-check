const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

const Licenses = {}

Licenses.getLicensesInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = { }
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
          { Tags: new RegExp(pattern, 'i') },
          { ThingCount: new RegExp(pattern, 'i') },
          { OrderNumber: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsActive: status })
    }

    const query = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Things',
          localField: '_id',
          foreignField: 'CustomerID',
          as: 'ThingCount'
        }
      },
      { $addFields: { ThingCount: { $size: '$ThingCount' } } },
      {
        $lookup: {
          from: 'Customers',
          localField: 'CustomerID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, Tier: 1, DomainName: 1, CustomerName: 1 } }
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
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      license: collection.aggregate(query, { collation: { locale: 'en' } })
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

module.exports = Licenses
