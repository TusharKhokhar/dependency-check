const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const Promise = require('bluebird')

const Faxes = {}

Faxes.getFaxesInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, locationIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'FileName'
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
          { FileName: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === true
      Object.assign(condition, { IsActive: status })
    }
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      Fax: pageNumber && limit
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

module.exports = Faxes
