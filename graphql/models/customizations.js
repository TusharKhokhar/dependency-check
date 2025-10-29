const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Customizations Model
const Customizations = {}

Customizations.getCustomizationsInformation = ({
  status, pattern, sort, pageNumber,
  limit, sortKey, customerIds, collection
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Customization'
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
          { Customization: new RegExp(pattern, 'i') },
          { Description: new RegExp(pattern, 'i') },
          { CustomerID: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { Enabled: status })
    }
    Promise.props({
      customization: collection.find(condition)
        .sort({ [sortKey]: sort })
        .skip(skips)
        .limit(limit).toArray(),
      total: collection.find(condition).toArray()
    }).then(results => {
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

// Export Customizations model
module.exports = Customizations
