const { GraphQLError } = require('graphql')
const {
  REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, ROLE_NAME_ALREADY_EXIST, INVALID_STATUS,
  DISASSOCIATE_BEFORE_DELETION
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess
} = require('../../helpers/util')
const { Roles } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

dot.keepArray = true

module.exports = {
  Mutation: {
    async addRole (_, { addRoleInput }, context, info) {
      log.lambdaSetup(context, 'roles', 'addRole')
      const {
        CustomerID,
        Permissions,
        CustomPermissions,
        Root,
        RoleName,
        NavigationPermissionID,
        IsActive,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addRoleInput
      let newRole = {
        CustomerID: ObjectId.createFromHexString(CustomerID),
        Permissions: Permissions ? Permissions.map(perm => ObjectId.createFromHexString(perm)) : [],
        CustomPermissions: CustomPermissions ? CustomPermissions.map(perm => ObjectId.createFromHexString(perm)) : [],
        Root: Root,
        RoleName: RoleName,
        NavigationPermissionID,
        CreatedBy: CreatedBy,
        IsActive: IsActive
      }
      try {
        verifyUserAccess(context, CustomerID)
        newRole = await formObjectIds(newRole)
        newRole = await addCreateTimeStamp(newRole)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const validateRole = await db.collection(Roles).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          RoleName: { $regex: `^${RoleName}$`, $options: 'i' },
          IsDeleted: false
        })
        if (validateRole) {
          throw new GraphQLError(ROLE_NAME_ALREADY_EXIST, {
            extensions: {
              code: '121'
            }
          })
        } else {
          const { insertedId } = await db.collection(Roles).insertOne(newRole)
          return await db.collection(Roles).findOne({ _id: insertedId })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateRole (_, { updateRoleInput, roleId }, context, info) {
      log.lambdaSetup(context, 'roles', 'updateRole')
      const db = await getDatabaseOneCustomer(context, updateRoleInput.CustomerID)
      verifyUserAccess(context, updateRoleInput.CustomerID)
      dot.remove('CustomerID', updateRoleInput)
      updateRoleInput.Permissions = updateRoleInput.Permissions
        ? updateRoleInput.Permissions.map(perm => ObjectId.createFromHexString(perm))
        : []
      updateRoleInput.CustomPermissions = updateRoleInput.CustomPermissions
        ? updateRoleInput.CustomPermissions.map(perm => ObjectId.createFromHexString(perm))
        : []
      let updateObject = await dot.dot(updateRoleInput)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = formObjectIds(updateObject, true)
      updateObject = addUpdateTimeStamp(updateObject)
      await db.collection(Roles).updateOne({ _id: ObjectId.createFromHexString(roleId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async roleDeleted (_, { IsDeleted, roleId, customerId }, context, info) {
      log.lambdaSetup(context, 'roles', 'roleDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!roleId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('roles', roleId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Roles).updateOne({ _id: ObjectId.createFromHexString(roleId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async roleStatus (_, { IsActive, roleId, customerId }, context) {
      log.lambdaSetup(context, 'roles', 'roleStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!roleId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabase(context)
        await db.collection(Roles).updateOne({ _id: ObjectId.createFromHexString(roleId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }
  },

  Query: {
    async getRoles (_, { paginationInput, customerIds, locationIds }, context) {
      log.lambdaSetup(context, 'roles', 'getRoles')
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
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(Roles)
      return await model.roles.getRolesInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          locationIds,
          collection
        }).then(roleList => {
        // roleList.total = roleList.total.length
        return roleList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getRole (_, { roleId, customerId }, context) {
      log.lambdaSetup(context, 'roles', 'getRole')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        return await db.collection(Roles).findOne({ _id: ObjectId.createFromHexString(roleId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
