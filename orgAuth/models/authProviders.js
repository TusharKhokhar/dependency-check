const AuthProviders = {}
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

AuthProviders.getAuthProvider = async (db, authType, orgId) => {
  try {
    const auth = await db.collection('AuthProviders').findOne({ AuthProvider: authType, OrgID: orgId, IsActive: true, IsDeleted: false })
    return auth
  } catch (err) {
    log.error("getAuthProvider Error =>", err)
    throw new Error(err)
  }
}

AuthProviders.getAuthProviderById = async (db, authId) => {
  try {
    const auth = await db.collection('AuthProviders').findOne({ _id: ObjectId.createFromHexString(authId), IsActive: true, IsDeleted: false })
    return auth
  } catch (err) {
    log.error("getAuthProviderById Error =>", err)
    throw new Error(err)
  }
}

module.exports = AuthProviders
