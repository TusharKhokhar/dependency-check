const Promise = require('bluebird')

// Loggings Model
const Loggings = {}

/**
 * Method to get all LoggingInformation
 */

Loggings.getLoggingsInformation = ({
  status, pattern, sort,
  pageNumber, limit, sortKey, collection
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Logging'
    const skips = limit * (pageNumber - 1)
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { Logging: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    Promise.props({
      logging: limit && pageNumber
        ? collection.find(condition)
          .sort({ [sortKey]: sort })
          .skip(skips)
          .limit(limit).toArray()
        : collection.find(condition).toArray(),
      total: collection.find(condition).toArray()
    }).then(results => {
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

// Export Loggings model
module.exports = Loggings
