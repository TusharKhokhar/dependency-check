const { getDb } = require('../config/db')

// Customers Model
const Customers = {}

// Get user by customer and status
Customers.getCustomer = ({ CustomerName, DomainName }, callback) => {
  getDb().then(async instance => {
    const getCustomerData = await instance.collection('Customers').findOne({ $or: [{ DomainName: DomainName.toLowerCase() }, { CustomerName: CustomerName.toLowerCase() }] })
    callback(null, getCustomerData)
  }).catch(error => {
    callback(error, null)
  })
}

// Get user by customer and status
Customers.getCustomerByDomain = ({ DomainName, IsDeleted }, callback) => {
  console.log(DomainName)
  getDb().then(async instance => {
    const getCustomerDomainData = await instance.collection('Customers').findOne({ DomainName: DomainName.toLowerCase(), IsDeleted: false })
    callback(null, getCustomerDomainData)
  }).catch(error => {
    callback(error, null)
  })
}

Customers.createCustomer = (data, callback) => {
  getDb().then(async instance => {
    const createCustomerData = await instance.collection('Customers').insertOne(data)
    callback(null, createCustomerData)
  }).catch(error => {
    callback(error, null)
  })
}

Customers.fetchCustomer = (callback) => {
  getDb().then(async instance => {
    const fetchCustomerData = await instance.collection('Customers').find({ DomainName: { $ne: 'admin' }, IsActive: true, IsDeleted: false }, {
      projection: {
        CustomerName: 1,
        _id: 1,
        Tier: 1,
        DomainName: 1
      }
    }).toArray()
    callback(null, fetchCustomerData)
  }).catch(error => {
    callback(error, null)
  })
}

// Export Customers model
module.exports = Customers
