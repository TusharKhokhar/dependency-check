const dot = require('dot-object')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const model = require('../../models/index')
const { CustomPermissions } = require('../../models/collections')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, verifyUserAccess } = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

dot.keepArray = true

module.exports = {
  Query: {
    async getCustomPermissions (_, { paginationInput }, context) {
      log.lambdaSetup(context, 'customPermissions', 'getCustomPermissions')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      const db = await getDatabase(context)
      const collection = await db.collection(CustomPermissions)
      const requesterDomain = context.requesterDomain
      const isPartner = context.data &&
            context.data.user && context.data.user.IsPartner
        ? context.data.user.IsPartner
        : false
      return await model.customPermissions.getCustomPermissionsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        collection,
        requesterDomain,
        isPartner
      }).then(customPermissionList => {
        customPermissionList.total = customPermissionList.total.length
        return customPermissionList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getCustomPermission (_, { customId }, context) {
      log.lambdaSetup(context, 'customPermissions', 'getCustomPermission')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        return await db.collection(CustomPermissions).findOne({ _id: ObjectId.createFromHexString(customId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
