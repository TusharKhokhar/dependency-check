const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Areas Model
const Areas = {}

/**
 * Method to get all areaInformation
 */

Areas.getAreasInformation = ({
  status, pattern, sort, pageNumber, limit,
  sortKey, customerIds, collection
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Area'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { Area: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    Promise.props({
      area: limit && pageNumber
        ? collection.find(condition, { collation: { locale: 'en' } })
          .sort({ [sortKey]: sort })
          .skip(skips)
          .limit(limit).toArray()
        : collection.find(condition, { collation: { locale: 'en' } }).toArray(),
      total: collection.find(condition).toArray()
    }).then(results => {
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

// Export Areas model
module.exports = Areas
