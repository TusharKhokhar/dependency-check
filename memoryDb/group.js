const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Groups'
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');


module.exports = {
    addGroup: async (customerId, roleId = null) => {
        const db = await getDb()
        const groupData = {
            "Label" : null,
            "GroupName" :  faker.lorem.word(),
            "Description" : null,
            "GroupType" : "Print Configuration",
            "DeviceID" : [],
            "Priority" : null,
            "Enabled" : null,
            "RoleType" : roleId,
            "Access" : null,
            "PrintConfig" : {
                "ReleaseCode" : true,
                "GuestName" : true,
                "Email" : true,
                "ComputerName" : null,
                "Username" : true,
                "Cost" : null,
                "MaskFileNames" : null
            },
            "LMSRules" : null,
            "Policies" : null,
            "Quota" : null,
            "RulesID" : null,
            "CustomerID" : customerId,
            "UserID" : null,
            "IsActive" : true,
            "PrintReview" : false,
            "ModifyPrintJob" : true,
            "PrinterGroups" : false,
            "PrintGroups" : [ ],
            "Tags" : null,
            "CreatedBy" : ObjectId.createFromHexString(),
            "IsDeleted" : false,
            "PrintConfigurationGroupID" : null,
            "UpdatedBy" : ObjectId.createFromHexString()
        }
        const group = await db.collection(collectionName).insertOne(groupData)
        return {insertedId: group.insertedId, ops: [groupData]}
    },
    addPermissionGroup: async (customerId, roleId = null, GroupName = faker.lorem.word()) => {
        const db = await getDb()
        const permissionGroup =  {
            "Label" : null,
            "GroupName" :  GroupName,
            "Description" : null,
            "GroupType" : "Permissions",
            "Priority" : null,
            "Enabled" : null,
            "RoleType" : roleId,
            "CustomerID" : customerId,
            "IsActive" : true,
            "PrintReview" : false,
            "CreatedBy" : ObjectId.createFromHexString(),
            "IsDeleted" : false,
            "UpdatedBy" : ObjectId.createFromHexString(),
            AssociatedQuotaBalance : []
        }
        const groupData = await db.collection(collectionName).insertOne(permissionGroup)
        return {insertedId: groupData.insertedId, ops: [permissionGroup]}
    },
    updateGroup: async (groupId, updateFields) => {
        const db = await getDb();
        const updateQuery = { $set: updateFields };
        const updatedGroup = await db.collection(collectionName).updateOne(
            { _id: ObjectId.createFromHexString(groupId) },
            updateQuery
        );
        return updatedGroup
    },
    addQuotaGroup: async (customerId, roleId = null) => {
        const db = await getDb()
        const quotaGroup = {
            "Label" : null,
            "GroupName" : "Quota 2",
            "GroupType" : "Quota Balance",
            "CustomerID" : customerId,
            "IsActive" : true,
            "RoleType" : roleId,
            "PrintReview" : false,
            "ModifyPrintJob" : false,
            "PrinterGroups" : false,
            "PrintGroups" : [ ],
            "QuotaBalance" : {
                "Scheduled" : false,
                "MaxBalance" : 20,
                "Amount" : 10,
                "Day" : ""
            },
            "Tags" : null,
            "CreatedBy" : ObjectId.createFromHexString(),
            "IsDeleted" : false,
            "PrintConfigurationGroupID" : null,
            "UpdatedBy" : ObjectId.createFromHexString()
        }
        const group = await db.collection(collectionName).insertOne(quotaGroup)
        return {insertedId: group.insertedId, ops: [quotaGroup]}
    },
    findGroupById: async (groupId) => {
        const db = await getDb()
        return await db.collection(collectionName).findOne({ _id: ObjectId.createFromHexString(groupId) })
    },
    findGroupByQuery: async (query) => {
        const db = await getDb()
        return await db.collection(collectionName).find(query).toArray();
    },
    updateGroup: async (groupId, updateData) => {
        const db = await getDb()
        return await db.collection('Groups').updateOne({_id: groupId}, {$set: updateData})
    }
}