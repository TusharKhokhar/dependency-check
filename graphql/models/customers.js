const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Customers Model
const Customers = {}

/**
 * Method to get all customerInformation
 */

Customers.getCustomersInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection, deleted, isPartner, retrieveSubCustomers }) => {
  return new Promise((resolve, reject) => {
    const condition = { }
    if (!deleted || deleted === false) {
      Object.assign(condition, {IsDeleted: false})
    }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'CustomerName'
    const skips = limit ? limit * (pageNumber - 1) : 0
    if (retrieveSubCustomers) {
      Object.assign(condition, {
        ParentCustomer: ObjectId.createFromHexString(customerIds),
        IsDeleted: false,
      });
    } else {
      if (customerIds && customerIds.length > 0) {
        customerIds = customerIds.map(custId => {
          return ObjectId.createFromHexString(custId)
        })
        Object.assign(condition, { _id: { $in: customerIds } })
      }
    }
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { DomainName: new RegExp(pattern, 'i') },
          { CustomerName: new RegExp(pattern, 'i') },
          { CustomerType: new RegExp(pattern, 'i') },
          { TimeZone: new RegExp(pattern, 'i') },
          { Tier: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === true
      Object.assign(condition, { Enabled: status })
    }
    if (isPartner) {
      Object.assign(condition, { Partner: isPartner })
    }
    const query = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Customers',
          localField: 'ParentCustomer',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, CustomerName: 1, DisplayName: 1, Description: 1 } }
          ],
          as: 'ParentCustomerData'
        }
      },
      {
        $unwind: {
          path: '$ParentCustomerData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'Customers',
          localField: 'SubCustomers',
          foreignField: '_id',
          pipeline: [
            { $project: { CustomerName: 1, DisplayName: 1, Description: 1 } }
          ],
          as: 'SubCustomerData'
        }
      },
      {
        $lookup: {
          from: 'Locations',
          localField: '_id',
          foreignField: 'CustomerID',
          pipeline: [
            { $match: { IsDeleted: false} }
          ],
          as: 'LocationCount'
        }
      },
      {
        $lookup: {
          from: 'Licenses',
          localField: '_id',
          foreignField: 'CustomerID',
          pipeline: [
            { $project: { RegisteredTo: 1, RegisterDate: 1, OrderNumber: 1 } }
          ],
          as: 'LicenseData'
        }
      },
      {
        $unwind: {
          path: '$LicenseData',
          preserveNullAndEmptyArrays: true
        }
      },
      { $addFields: { LocationCount: { $size: '$LocationCount' } } }
    ]
    Promise.props({
      customer: limit && pageNumber
        ? collection.aggregate(query, { collation: { locale: 'en' } })
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

Customers.getSubCustomersInformation = async ({ pattern, customerId, collection }) => {
  try {
    const condition = {}
    if (customerId) {
      Object.assign(condition, { ParentCustomer: ObjectId.createFromHexString(customerId), IsDeleted: false })
    }
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { DomainName: new RegExp(pattern, 'i') },
          { CustomerName: new RegExp(pattern, 'i') },
          { CustomerType: new RegExp(pattern, 'i') },
          { TimeZone: new RegExp(pattern, 'i') },
          { Tier: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    return await collection.find(condition, { collation: { locale: 'en' } }).toArray()
  } catch (error) {
    throw error
  }
}

// Export Customers model
module.exports = Customers
