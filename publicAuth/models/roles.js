
// Things Model
const Roles = {}

// Get user by public upload and status
Roles.getRoleOfUser = async (roleId, db) => {
  return await db.collection('Roles').findOne({ _id: roleId })
}

module.exports = Roles
