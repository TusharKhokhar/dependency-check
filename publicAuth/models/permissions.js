const Permissions = {}
const Promise = require('bluebird');

Permissions.getAllPermissions = async (permissionIds, requesterDomain, db, partner) => {
  const condition = { _id: { $in: permissionIds } }
  if (requesterDomain !== 'admin') {
    if (partner) {
      Object.assign(condition, { PartnerLevel: true })
    } else {
      Object.assign(condition, { CustomerLevel: true })
    }
  }
  return await db.collection('Permissions').find(condition, {
    projection: {
      PermissionMenuID: 1
    }
  }).toArray()
}

Permissions.getAllAddEditPermissions = (permissionIds, db, callback) => {
  db.collection('Permissions').find({ _id: { $in: permissionIds }, Add: true }, {
  }).toArray((err, permissions) => {
    if (err) {
      callback(err, null)
    } else {
      callback(null, permissions)
    }
  })
}

module.exports = Permissions
