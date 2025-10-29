const { Groups, Devices, AuditLogs} = require('../../models/collections')
const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const {
  REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, INVALID_STATUS, GROUP_ALREADY_EXIST, DISASSOCIATE_BEFORE_DELETION,
  INVALID_DATA_ENTERED, UNAUTHORIZED
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, addCreateTimeStamp, getDatabase, addUpdateTimeStamp, getDatabaseOneCustomer,
  getDatabaseForGetAllAPI, verifyUserAccess, ignoreOrderCompare
} = require('../../helpers/util')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const {ResetQuotaBalance} = require("../../config/config");
const {QUOTA_RESET_SUCCESS} = require("../../helpers/success-constants");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addGroup (_, { addGroupInput }, context, info) {
      log.lambdaSetup(context, 'groups', 'addGroup')
      const {
        Label,
        GroupName,
        Description,
        GroupType,
        DeviceID,
        Priority,
        Enabled,
        RoleType,
        Access,
        PrintConfig,
        LMSRules,
        Policies,
        Quota,
        RulesID,
        UserID,
        CustomerID,
        PrintReview,
        ModifyPrintJob,
        PrinterGroups,
        PrintGroups,
        IsActive,
        QuotaBalance,
        PrintConfigurationGroupID,
        AssociatedQuotaBalance,
        DebitBalancePriority,
        Tags,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted = false
      } = addGroupInput
      let newGroup = {
        Label: Label,
        GroupName: GroupName,
        Description: Description,
        GroupType: GroupType,
        DeviceID: DeviceID,
        Priority: Priority,
        Enabled: Enabled,
        RoleType: RoleType,
        Access: Access,
        PrintConfig: PrintConfig,
        LMSRules: LMSRules,
        Policies: Policies,
        Quota: Quota,
        RulesID: RulesID,
        CustomerID: CustomerID,
        UserID: UserID,
        IsActive: IsActive,
        PrintReview: PrintReview,
        ModifyPrintJob: ModifyPrintJob,
        PrinterGroups: PrinterGroups,
        PrintGroups: PrintGroups,
        PrintConfigurationGroupID: PrintConfigurationGroupID,
        QuotaBalance: QuotaBalance,
        AssociatedQuotaBalance: AssociatedQuotaBalance,
        DebitBalancePriority: DebitBalancePriority,
        Tags: Tags,
        CreatedBy: CreatedBy,
        IsDeleted: IsDeleted
      }
      try {
        verifyUserAccess(context, CustomerID)
        newGroup = formObjectIds(newGroup)
        newGroup = addCreateTimeStamp(newGroup)
        if(PrinterGroups && PrintGroups && PrintGroups.length > 0){
          let updatedPrinter = []
          for (let uploadKeys of PrintGroups) {
            uploadKeys._id = ObjectId.createFromHexString()
            uploadKeys.DeviceId = uploadKeys.DeviceId ? uploadKeys.DeviceId.map(id => ObjectId.createFromHexString(id)) : []
            updatedPrinter.push(uploadKeys)
          }
          newGroup.PrintGroups = updatedPrinter
        }
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const collection = db.collection(Groups)
        const deviceCollection = db.collection(Devices)
        const validateGroup = await collection.findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          GroupName: { $regex: `^${GroupName}$`, $options: 'i' },
          IsDeleted: false
        })
        let validateGroupTypeData = false
        if (GroupType === 'Permissions' && PrintConfig) {
          validateGroupTypeData = true
        }
        if (GroupType === 'Print Configuration' && RoleType) {
          validateGroupTypeData = true
        }
        if (validateGroup) {
          throw new Error(GROUP_ALREADY_EXIST)
        } else if (validateGroupTypeData) {
          throw new Error(INVALID_DATA_ENTERED)
        } else {
          const { insertedId } = await collection.insertOne(newGroup)
          if (DeviceID && DeviceID.length > 0) {
            await deviceCollection.updateMany({ _id: { $in: newGroup.DeviceID } }, { $push: { GroupID: insertedId } })
          }
          return await collection.findOne({ _id: insertedId })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateGroup (_, { updateGroupInput, groupId }, context, info) {
      log.lambdaSetup(context, 'groups', 'updateGroup')
      verifyUserAccess(context, updateGroupInput.CustomerID)
      const db = await getDatabaseOneCustomer(context, updateGroupInput.CustomerID)
      const validateGroup = await db.collection('Groups').findOne({
        _id: {$ne: ObjectId.createFromHexString(groupId)},
        CustomerID: ObjectId.createFromHexString(updateGroupInput.CustomerID),
        GroupName: { $regex: `^${updateGroupInput.GroupName}$`, $options: 'i' },
        IsDeleted: false
      })
      let validateGroupTypeData = false
      if (updateGroupInput.GroupType === 'Permissions' && updateGroupInput.PrintConfig) {
        validateGroupTypeData = true
      }
      if (updateGroupInput.GroupType === 'Print Configuration' && updateGroupInput.RoleType) {
        validateGroupTypeData = true
      }
      if (validateGroup) {
        throw new Error(GROUP_ALREADY_EXIST)
      } else if (validateGroupTypeData) {
        throw new Error(INVALID_DATA_ENTERED)
      }
      dot.remove('CustomerID', updateGroupInput)
      updateGroupInput = await addUpdateTimeStamp(updateGroupInput)
      const deviceData = await db.collection(Devices).find({ GroupID: ObjectId.createFromHexString(groupId) }).toArray()
      const deviceIds = deviceData && await Promise.all(deviceData.map(dev => dev._id.toString()))
      const incomingIds = updateGroupInput.DeviceID && await Promise.all(updateGroupInput.DeviceID.map(dev => dev.toString()))
      const oldGroup = await db.collection('Groups').findOne({_id: ObjectId.createFromHexString(groupId)})
      if (oldGroup.GroupType === 'Permissions' &&
          updateGroupInput.AssociatedQuotaBalance
      ) {
        updateGroupInput = await manageQuotaGroupUpdate(updateGroupInput, db, groupId, oldGroup)
      }
      if (updateGroupInput.GroupType &&
          updateGroupInput.GroupType === 'Print Configuration' && incomingIds && (incomingIds.length > 0 || deviceIds.length > 0)) {
        const incomingNewDevice = []
        const removedDevices = []
        // eslint-disable-next-line array-callback-return
        incomingIds && incomingIds.forEach((devId) => {
          if (!deviceIds.includes(devId)) {
            incomingNewDevice.push(ObjectId.createFromHexString(devId))
          }
        })
        // eslint-disable-next-line array-callback-return
        deviceIds &&  deviceIds.forEach(devId => {
          if (!incomingIds.includes(devId)) {
            removedDevices.push(ObjectId.createFromHexString(devId))
          }
        })
        if (incomingNewDevice.length > 0) {
          await db.collection(Devices).updateMany({ _id: { $in: incomingNewDevice } }, { $push: { GroupID: ObjectId.createFromHexString(groupId) } }, { multi: true })
        }
        if (removedDevices.length > 0) {
          await db.collection(Devices).updateMany({ _id: { $in: removedDevices } }, { $pull: { GroupID: ObjectId.createFromHexString(groupId) } }, { multi: true })
        }
        if(updateGroupInput.PrinterGroups && updateGroupInput.PrintGroups && updateGroupInput.PrintGroups.length > 0){
          let updatedPrinter = []
          for (let uploadKeys of updateGroupInput.PrintGroups) {
            uploadKeys._id = uploadKeys._id ? ObjectId.createFromHexString(uploadKeys._id) : ObjectId.createFromHexString()
            uploadKeys.DeviceId = uploadKeys.DeviceId ? uploadKeys.DeviceId.map(id => ObjectId.createFromHexString(id)) : []
            updatedPrinter.push(uploadKeys)
          }
          updateGroupInput.PrintGroups = updatedPrinter
        }
      }
      if (updateGroupInput?.PrintConfigurationGroupID) {
        await updateAllUsersPrinterConfigurations(updateGroupInput.PrintConfigurationGroupID, db, ObjectId.createFromHexString(groupId))
      }
      let updateObject = await dot.dot(updateGroupInput)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = await formObjectIds(updateObject, true)
      await db.collection(Groups).updateOne({ _id: ObjectId.createFromHexString(groupId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async groupDeleted (_, { IsDeleted, groupId, customerId }, context, info) {
      log.lambdaSetup(context, 'groups', 'groupDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!groupId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('groups', groupId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Groups).updateOne({ _id: ObjectId.createFromHexString(groupId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async groupStatus (_, { IsActive, groupId, customerId }, context) {
      log.lambdaSetup(context, 'groups', 'groupStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!groupId) {
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
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        await db.collection(Groups).updateOne({ _id: ObjectId.createFromHexString(groupId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async resetQuotaBalance (_, { amount, groupId, customerId }, context) {
      log.lambdaSetup(context, 'groups', 'resetQuotaBalance')
      try {
        if (amount === null || amount === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!groupId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        amount = parseFloat(amount.toFixed(2))
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        let auditLog = { Type: 'QuotaReset', CustomerID: ObjectId.createFromHexString(customerId), User:  context.data.user.Username,
          Amount: amount, GroupID: ObjectId.createFromHexString(groupId)}
        const groups = context.data.user.GroupID
        let { RoleType } = await db.collection('Groups').findOne({_id: {$in: groups}, GroupType: 'Permissions'})
        let { CustomPermissions } = await db.collection('Roles').findOne({_id: RoleType, IsDeleted: false})
        CustomPermissions = CustomPermissions.map(perms => perms.toString())
        if (CustomPermissions && !CustomPermissions.includes(ResetQuotaBalance)) {
          throw new GraphQLError(UNAUTHORIZED, {
            extensions: {
              code: '401'
            }
          })
        }
        const date = new Date()
        const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
          date.getUTCDate(), date.getUTCHours(),
          date.getUTCMinutes(), date.getUTCSeconds())
        auditLog.Date = new Date(new Date(nowUtc).getTime())
        auditLog.IsActive = true;
        auditLog = addCreateTimeStamp(auditLog)
        await db.collection(AuditLogs).insertOne(auditLog)
        await db.collection('Users').updateMany({CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false,
            'GroupQuotas.GroupID': ObjectId.createFromHexString(groupId)},
          {$set: {'GroupQuotas.$.QuotaBalance': amount}}, {multi: true})

        return {
          message: QUOTA_RESET_SUCCESS,
          statusCode: 200
        }
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getGroups (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'groups', 'getGroups')
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
      const collection = db.collection(Groups)
      return await model.groups.getGroupsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection
      }).then(groupList => {
        // groupList.total = groupList.total.length
        return groupList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getGroup (_, { groupId, customerId }, context) {
      log.lambdaSetup(context, 'groups', 'getGroup')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const groupData = await db.collection(Groups).aggregate([
          {
            $match: { _id: ObjectId.createFromHexString(groupId) }
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
          }
        ]).toArray()
        if (groupData) {
          return groupData[0]
        } else {
          return {}
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

let getBalances = async (current, newGroup) => {
  let newAssigned = await newGroup.filter(f => !current.includes(f))
  let removedGroup = await current.filter(f => !newGroup.includes(f))
  return {newAssigned, removedGroup}
}

/**
 * @param groupData
 * @returns {Promise<*[]>}
 */

let formQuotaBalance = async (groupData) => {
  let groups = []
  await groupData.forEach(group => {
    groups.push({
      GroupID: group._id,
      QuotaBalance: group.QuotaBalance.Amount
    })
  })
  return groups
}

/**
 * @param db
 * @param userIds
 * @param action
 * @param data
 * @returns {Promise<void>}
 */

let updateUsers = async (db, userIds, action, data) => {
  if(action === '$pull' ) {
    await db.collection('Users').updateMany({_id: {$in: userIds}, IsDeleted: false, $and: [{GroupQuotas: {$exists: true}}, {GroupQuotas:{$ne: null}}]},
        {$pull: {GroupQuotas: {GroupID: ObjectId.createFromHexString(data)}}}, {multi: true})
  } else if (action === '$push') {
    await db.collection('Users').updateMany({_id: {$in: userIds}, IsDeleted: false, $and: [{GroupQuotas: {$exists: true}}, {GroupQuotas:{$ne: null}}]},
        {'$push': {GroupQuotas: data}}, {multi: true})
    await db.collection('Users').updateMany({_id: {$in: userIds}, IsDeleted: false, $or: [{GroupQuotas: {$exists: false}}, {GroupQuotas: null}]},
        {'$set': {GroupQuotas: [data]}}, {multi: true})
  }
}

/**
 * @param updateGroupInput
 * @param db
 * @param groupId
 * @param groupAssigned
 * @returns {Promise<*>}
 */

let manageQuotaGroupUpdate = async (updateGroupInput, db, groupId, groupAssigned) => {
  let groupIdArray = await updateGroupInput.AssociatedQuotaBalance.map(id => id.toString())
  let arrayOfAssigned = groupAssigned?.AssociatedQuotaBalance ?
      await groupAssigned.AssociatedQuotaBalance.map(id => id.toString()) : []
  const notDifferent = ignoreOrderCompare(groupIdArray, arrayOfAssigned)
  let {
    newAssigned, removedGroup
  } = notDifferent ? {newAssigned: [], removedGroup: []} : await getBalances(arrayOfAssigned, groupIdArray)
  let usersData = await db.collection('Users').find({GroupID: ObjectId.createFromHexString(groupId)}).toArray()
  let userIds = await usersData.map(user => user._id)
  log.info(userIds);
  log.info(newAssigned);
  log.info(removedGroup);
  const nullQuotas = await usersData.filter(u => !u?.GroupQuotas).map(u => u._id)
  if (nullQuotas?.length) {
    await db.collection("Users").updateMany(
      {
        _id: { $in: nullQuotas },
        $or: [
          { GroupQuotas: { $exists: false } },
          { GroupQuotas: null },
          { GroupQuotas: { $not: { $type: "array" } } },
        ],
      },
      { $set: { GroupQuotas: [] } }
    );
  }
  if (removedGroup && removedGroup.length > 0) {
    let removedGroupObjectIds = removedGroup.map(gr => ObjectId.createFromHexString(gr))
    for (let remove of removedGroupObjectIds) {
      await updateUsers(db, userIds, '$pull', remove)
    }
  }
  if (newAssigned && newAssigned.length > 0) {
    let addGroupObjectIds = newAssigned.map(gr => ObjectId.createFromHexString(gr))
    log.info('addGroupObjectIds',addGroupObjectIds);
    let groupDataSet = await db.collection('Groups').find({_id: {$in: addGroupObjectIds}}).toArray()
    groupDataSet = await formQuotaBalance(groupDataSet)
    log.info('groupDataSet: ',groupDataSet);
    for (let add of groupDataSet) {
      await updateUsers(db, userIds, '$push', add)
    }
  }
  return updateGroupInput
}

const updateAllUsersPrinterConfigurations = async (printConfigurationGroupID, db, groupId) => {
  try {
    const usersCollection = db.collection('Users')
    const updateObj = {
      GroupID: [ObjectId.createFromHexString(groupId), ObjectId.createFromHexString(printConfigurationGroupID)]
    }
    await usersCollection.updateMany({GroupID: groupId, IsDeleted: false}, {$set: updateObj}, {multi: true})
  } catch (error) {
    console.error('error****',error)
  }
}
