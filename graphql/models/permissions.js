const Promise = require('bluebird')

const Permissions = {}

Permissions.getCustomerLevelInformation = (collection) => {
  return new Promise((resolve, reject) => {
    const condition = { CustomerLevel: true }
    Promise.props({
      permission: collection.find(condition)
        .sort({ permission: 1 }).toArray()
    }).then(results => {
      resolve(results.permission)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Permissions.getRootLevelInformation = (collection) => {
  return new Promise((resolve, reject) => {
    const condition = { RootLevel: true }
    Promise.props({
      permission: collection.find(condition)
        .sort({ permission: 1 }).toArray()
    }).then(results => {
      resolve(results.permission)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Permissions.getParentLevelInformation = (collection) => {
  return new Promise((resolve, reject) => {
    const condition = { ParentPermission: true }
    Promise.props({
      permission: collection.find(condition)
        .sort({ permission: 1 }).toArray()
    }).then(results => {
      resolve(results.permission)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Permissions.getChildLevelInformation = (permissionID, collection) => {
  return new Promise((resolve, reject) => {
    const condition = { PermissionCategoryId: permissionID }
    Promise.props({
      permission: collection.find(condition)
        .sort({ permission: 1 }).toArray()
    }).then(results => {
      resolve(results.permission)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Permissions.getInnerParentWithChildPerms = (collection, requesterDomain, partner) => {
  return new Promise((resolve, reject) => {
    const condition = {
      InnerParent: true
    }
    const innerCondition = {}
    if (requesterDomain !== 'admin') {
      if (partner) {
        Object.assign(condition, { PartnerLevel: true })
        Object.assign(innerCondition, { PartnerLevel: true })
      } else {
        Object.assign(condition, { CustomerLevel: true })
        Object.assign(innerCondition, { CustomerLevel: true })
      }
    }
    const query = [

      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Permissions',
          localField: '_id',
          foreignField: 'PermissionCategoryId',
          pipeline: [
            { $match: innerCondition },
            { $sort: { Order: 1 } }
          ],
          as: 'childPermissions'
        }
      }
    ]
    Promise.props({
      permissions: collection.aggregate(query)
        .sort({ Order: 1 }).toArray()
    }).then(results => {
      resolve(results.permissions)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}
module.exports = Permissions
