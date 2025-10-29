const Promise = require('bluebird')
const { Groups: GroupsCollection  } = require('../models/collections')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const CustomLogger = require("../helpers/customLogger");
const { utcDateGet } = require('../helpers/util');
const log = new CustomLogger()

// Groups Model
const Groups = {}

/**
 * Method to get all groupInformation
 */

Groups.getGroupsInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection, groupTypes }) => {
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
    
    if (groupTypes && groupTypes?.length > 0) {
      Object.assign(condition, { GroupType: { $in: groupTypes } })
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

Groups.reArrangeEasyBookingPriorities = async (
  groupId,
  db,
  customerId,
  context
) => {
  try {
    const groupToDelete = await db
      .collection(GroupsCollection)
      .findOne({ _id: ObjectId.createFromHexString(groupId) });

    if (
      groupToDelete &&
      groupToDelete.GroupType === "EasyBooking" &&
      groupToDelete.Priority
    ) {
      // Find all EasyBooking groups with priority greater than the deleted group's priority
      const groupsToUpdate = await db
        .collection(GroupsCollection)
        .find({
          CustomerID: ObjectId.createFromHexString(customerId),
          GroupType: "EasyBooking",
          Priority: { $gt: groupToDelete.Priority },
          IsDeleted: false,
        })
        .toArray();

      if (groupsToUpdate.length > 0) {
        // Create bulk operations to reduce priority by 1 for each group
        const bulkOperations = groupsToUpdate.map((group) => ({
          updateOne: {
            filter: { _id: group._id },
            update: {
              $set: {
                Priority: group.Priority - 1,
                UpdatedBy: ObjectId.createFromHexString(context.data._id),
                UpdatedAt: utcDateGet(),
              },
            },
          },
        }));
        await db.collection(GroupsCollection).bulkWrite(bulkOperations);
      }
    }
  } catch (error) {
    log.error("error in reArrangeEasyBookingPriorities =>>>", error);
    throw new Error(error.message);
  }
};
// Export Groups model
module.exports = Groups
