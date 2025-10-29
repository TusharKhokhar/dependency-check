const Promise = require('bluebird')

const CustomPermissions = {}

CustomPermissions.getCustomPermissionsInformation = ({
  status, pattern, sort, pageNumber, limit, sortKey, collection,
  requesterDomain, isPartner
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Order'
    const skips = limit * (pageNumber - 1)
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { CustomPermission: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    if (requesterDomain !== 'admin') {
      if (isPartner) {
        Object.assign(condition, { PartnerLevel: true })
      } else {
        Object.assign(condition, { CustomerLevel: true })
      }
    }
    Promise.props({
      customPermission: collection.aggregate([
        {
          $match: condition
        },
        {
          $sort: { [sortKey]: sort }
        },
        {
          $lookup: {
            from: 'CustomPermissions',
            localField: 'ParentPermissionID',
            foreignField: '_id',
            as: 'ParentPermission'
          }
        },
        {
          $unwind: {
            path: '$ParentPermission',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $group: {
            _id: { ParentData: '$ParentPermission' },
            childPerms: { $push: '$$ROOT' }
          }
        },
        {
          $project:
                    {
                      _id: '$_id.ParentData._id',
                      PermissionName: '$_id.ParentData.PermissionName',
                      Order: '$_id.ParentData.Order',
                      ChildPerms: '$childPerms'
                    }
        }
      ])
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
module.exports = CustomPermissions
