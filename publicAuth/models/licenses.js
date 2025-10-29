const { getDb } = require('../config/db')

// Licenses Model
const Licenses = {}

Licenses.fetchLicenseByCustomerId = (customerId, callback) => {
  getDb().then(async instance => {
    const fetchLicenseCustomerData = await instance.collection('Licenses').findOne({ CustomerID: customerId })
    callback(null, fetchLicenseCustomerData)
  }).catch(error => {
    callback(error, null)
  })
}

Licenses.fetchLicenseAndUpdate = (id, newThingsIds, callback) => {
  getDb().then(async instance => {
    const fetchAndUpdateData = await instance.collection('Licenses').updateOne({ CustomerID: id }, { $set: { ThingsIDs: newThingsIds } })
    callback(null, fetchAndUpdateData)
  }).catch(error => {
    callback(error, null)
  })
}

module.exports = Licenses
