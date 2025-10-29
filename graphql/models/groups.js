const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// Groups Model
const Groups = {}

/**
 * Method to get all groupInformation
 */

Groups.getGroupsInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'GroupName'
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
          { GroupName: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') },
          { GroupType: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { RoleType: new RegExp(pattern, 'i') }
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
          from: 'Roles',
          localField: 'RoleType',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, RoleName: 1 } }
          ],
          as: 'RoleData'
        }
      },
      {
        $unwind: {
          path: '$RoleData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'Devices',
          localField: 'DeviceID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, Device: 1 } }
          ],
          as: 'DeviceData'
        }
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
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      group: pageNumber && limit
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
// Export Groups model
module.exports = Groups
