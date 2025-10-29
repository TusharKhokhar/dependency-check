const model = require('../../models/index')
const { Permissions, Customers } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { getDatabase, formObjectIds, addCreateTimeStamp, verifyUserAccess } = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addPermission (_, { addPermissionInput }, context, info) {
      log.lambdaSetup(context, 'permissions', 'addPermission')
      const {
        PermissionName,
        RootLevel,
        CustomerLevel,
        ProductLevel,
        PermissionCategoryId,
        PermissionMenuID,
        InnerParent,
        ParentPermission,
        Order,
        CreatedAt,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addPermissionInput
      let newPermission = {
        Order: Order,
        PermissionName: PermissionName,
        RootLevel: RootLevel,
        CustomerLevel: CustomerLevel,
        ProductLevel: ProductLevel,
        PermissionCategoryId: PermissionCategoryId
          ? ObjectId.createFromHexString(PermissionCategoryId)
          : null,
        ParentPermission: ParentPermission,
        PermissionMenuID: ObjectId.createFromHexString(PermissionMenuID),
        InnerParent: InnerParent,
        CreatedAt: CreatedAt,
        CreatedBy: CreatedBy,
        IsDeleted: false
      }
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        newPermission = formObjectIds(newPermission)
        newPermission.IsActive = true;
        newPermission = addCreateTimeStamp(newPermission)
        const db = await getDatabase(context)
        const { insertedId } = await db.collection(Permissions).insertOne(newPermission)
        await db.collection(Permissions).findOne({ _id: insertedId })
      } catch (error) {
        throw new Error(error)
      }
    }
  },

  Query: {

    // eslint-disable-next-line no-empty-pattern
    async getCustomerLevelPermission (_, {}, context) {
      log.lambdaSetup(context, 'permissions', 'getCustomerLevelPermission')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const collection = db.collection(Permissions)
        return await model.permissions.getCustomerLevelInformation(collection)
      } catch (err) {
        throw new Error(err)
      }
    },

    // eslint-disable-next-line no-empty-pattern
    async getRootLevelPermission (_, {}, context) {
      log.lambdaSetup(context, 'permissions', 'getRootLevelPermission')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const collection = db.collection(Permissions)
        return await model.permissions.getRootLevelInformation(collection)
      } catch (err) {
        throw new Error(err)
      }
    },

    async getParentPermission (_, {}, context) {
      log.lambdaSetup(context, 'permissions', 'adgetParentPermissiondUser')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const collection = db.collection(Permissions)
        return await model.permissions.getParentLevelInformation(collection)
      } catch (err) {
        throw new Error(err)
      }
    },

    async getChildPermission (_, { permissionID }, context) {
      log.lambdaSetup(context, 'permissions', 'getChildPermission')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const collection = db.collection(Permissions)
        return await model.permissions.getChildLevelInformation(permissionID, collection)
      } catch (err) {
        throw new Error(err)
      }
    },

    async getParentChildPermission (_, {}, context, info) {
      log.lambdaSetup(context, 'permissions', 'getParentChildPermission')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabase(context)
        const parentCondition = { ParentPermission: true }
        const customerData = await db.collection(Customers).findOne({ DomainName: context.requesterDomain })
        if (context.requesterDomain && context.requesterDomain !== 'admin') {
          if (customerData && customerData.Partner) {
            Object.assign(parentCondition, { PartnerLevel: true })
          } else {
            Object.assign(parentCondition, { CustomerLevel: true })
          }
        }
        const collection = db.collection(Permissions)
        const parentPerms = await collection.find(parentCondition, {
          child: [],
          PermissionName: 1,
          RootLevel: 1,
          CustomerLevel: 1,
          ProductLevel: 1,
          PartnerLevel: 1,
          PermissionCategoryId: 1,
          PermissionMenuID: 1,
          ParentPermission: 1,
          InnerParent: 1
        }).sort({ Order: 1 }).toArray()
        const innerParents = await model.permissions.getInnerParentWithChildPerms(collection, context.requesterDomain, customerData.Partner)
        const mapParentPerms = await parentPerms.map(perms => perms._id.toString())
        // eslint-disable-next-line array-callback-return
        innerParents.forEach((per) => {
          if (parentPerms[mapParentPerms.indexOf(per.PermissionCategoryId.toString())].child === undefined) {
            parentPerms[mapParentPerms.indexOf(per.PermissionCategoryId.toString())].child = []
          }
          parentPerms[mapParentPerms.indexOf(per.PermissionCategoryId.toString())].child.push(per)
        })
        return parentPerms
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
