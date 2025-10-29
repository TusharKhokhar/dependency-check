const request = require("supertest");
const {
  Given,
  When,
  Then,
  setDefaultTimeout,
  Before,
} = require("@cucumber/cucumber");
const expect = require("chai").expect;
const { config } = require("../configs/config");
const { handler } = require("../../graphql");
const { addGroup, findGroupById, updateGroup, addPermissionGroup, addQuotaGroup, createEasyBookingGroup } = require("../../../memoryDb/group");
const { getDb } = require('../../config/dbHandler');
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter');
const {
  updateGroupMutation,
  addEasyBookingGroup,
  updateEasyBookingGroup,
  updateEasyBookingGroupPriorities,
  addPermissionGroupWithEasyBookingID,
  updatePermissionGroupWithEasyBookingID,
  deleteGroup,
} = require("../mutations/groups.mutation");
const {
  getEasyBookingGroup,
  getGroupsWithFilter,
  getPermissionGroupWithEasyBookingID
} = require("../queries/groups");
const {getEvent} = require("../mocks/event");
const { getPrinterDeviceByCustomerID } = require("../../../memoryDb/device");
const { getUserByCustomerId, updateUser, findUser, findUserQuery } = require("../../../memoryDb/users");

let server;
let globalResponse = {};
let groupID;
let userData;
let quotaGroupID

setDefaultTimeout(100000);

server = request(config.url);


Given("a PrintGroups array is configured to print using a printer group", async () => {
  const { insertedId: groupId } = await addGroup(config.customerId, config.roleId);
  groupID = groupId;
  const printDevice = await getPrinterDeviceByCustomerID(config.customerId)
  
  updateGroupMutation.variables.groupId = groupID.toString();
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.DeviceID = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.PrintGroups[0].DeviceId = [printDevice._id.toString()];
});

When('the updateGroup API is called', async function () {
  const event = getEvent(updateGroupMutation)
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("each PrintGroup entry should contain a valid _id", async () => {
    const groupData = await findGroupById(groupID)

  expect(groupData.PrintGroups[0]._id).to.be.exist;
});

Given("the users exist in the database with null GroupQuotas", async () => {
  const { insertedId: groupId, ops: groupData } = await addGroup(config.customerId, config.roleId);
  groupID = groupId;
  
  await updateGroup( groupID, { GroupType: "Permissions",  });
  const printDevice = await getPrinterDeviceByCustomerID(config.customerId)
  userData = await getUserByCustomerId(config.customerId)
  await updateUser({ GroupQuotas: null, GroupID: [groupId] }, userData._id);

  updateGroupMutation.variables.groupId = groupID.toString();
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.DeviceID = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.PrintGroups[0].DeviceId = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.GroupName = groupData[0].GroupName
  updateGroupMutation.variables.updateGroupInput.GroupType = "Permissions"
  delete updateGroupMutation.variables.updateGroupInput.PrintConfig;
});

Then("users that previously had null or missing GroupQuotas should now have empty array", async () => {
  const responseData = await findUser(userData.Username, userData.TenantDomain)
  expect(Array.isArray(responseData.GroupQuotas), "GroupQuotas should be an array").to.be.true;
  expect(responseData.GroupQuotas.length, "GroupQuotas should be empty").to.equal(0);
});

Given("a request to add a quota group to a specific permission group", async () => {
  const { insertedId: permissionGroup, ops: groupData } = await addPermissionGroup(config.customerId, config.roleId)
  const { insertedId: quotaGroup } = await addQuotaGroup(config.customerId)
  quotaGroupID = quotaGroup.toString();
  await updateGroup(permissionGroup, {
    AssociatedQuotaBalance: [],
  });
  const printDevice = await getPrinterDeviceByCustomerID(config.customerId)
  userData = await getUserByCustomerId(config.customerId)
  await updateUser({ GroupQuotas: null, GroupID: [permissionGroup] }, userData._id);

  updateGroupMutation.variables.groupId = permissionGroup.toString();
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.DeviceID = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.PrintGroups[0].DeviceId = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.GroupName = groupData[0].GroupName
  updateGroupMutation.variables.updateGroupInput.GroupType = "Permissions"
  updateGroupMutation.variables.updateGroupInput.AssociatedQuotaBalance = [quotaGroup.toString()]
  delete updateGroupMutation.variables.updateGroupInput.PrintConfig;
});

Then("the quota group should be added to the permission group and to all users associated with that permission group", async() => {
  const user = await findUserQuery({_id: userData._id})
  expect(Array.isArray(user.GroupQuotas)).to.equal(true);
  expect(user.GroupQuotas[0].GroupID.toString()).to.equal(quotaGroupID);
})

Given("a request to remove a quota group from a specific permission group", async () =>{
  const { insertedId: permissionGroup, ops: groupData } = await addPermissionGroup(config.customerId, config.roleId)
  const { insertedId: quotaGroup } = await addQuotaGroup(config.customerId)
  quotaGroupID = quotaGroup.toString();
  await updateGroup(permissionGroup, {
    AssociatedQuotaBalance: [quotaGroupID],
  });
  const printDevice = await getPrinterDeviceByCustomerID(config.customerId)
  userData = await getUserByCustomerId(config.customerId)
  await updateUser(
    {
      GroupQuotas: [{ GroupID: quotaGroup, QuotaBalance: 20 }],
      GroupID: [permissionGroup],
    },
    userData._id
  );
  updateGroupMutation.variables.groupId = permissionGroup.toString();
  updateGroupMutation.variables.updateGroupInput.CustomerID = config.customerId;
  updateGroupMutation.variables.updateGroupInput.DeviceID = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.PrintGroups[0].DeviceId = [printDevice._id.toString()];
  updateGroupMutation.variables.updateGroupInput.GroupName = groupData[0].GroupName
  updateGroupMutation.variables.updateGroupInput.GroupType = "Permissions"
  updateGroupMutation.variables.updateGroupInput.AssociatedQuotaBalance = []
  delete updateGroupMutation.variables.updateGroupInput.PrintConfig;
})

Then("the quota group should be removed from the permission group and from all users associated with that quota group",  async() => {
  const user = await findUserQuery({_id: userData._id})
  expect(Array.isArray(user.GroupQuotas)).to.equal(true);
  const idExists = user.GroupQuotas.some(item => item.GroupID.toString() === quotaGroupID);
  expect(idExists).to.equal(false);
})

Given("a request to add a EasyBooking group with valid input data", async () => {
  addEasyBookingGroup.variables.addGroupInput.CustomerID = config.customerId;
});

When('the addGroup API is called for EasyBooking', async function () {
  const event = getEvent(addEasyBookingGroup)
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then('the response should contain the group with EasyBooking settings', function () {
  expect(globalResponse.response.body.data).to.have.property('addGroup');
  expect(globalResponse.response.body.data.addGroup).to.have.property('EasyBooking');
  expect(globalResponse.response.body.data.addGroup.EasyBooking.EasyBookingGroups).to.be.an('array').that.is.not.empty;
  expect(globalResponse.response.body.data.addGroup).to.have.property('Priority');
  expect(globalResponse.response.body.data.addGroup).to.have.property('Description');
});

Given("a request to update an existing EasyBooking group with new details", async () => {
  const { insertedId: groupId, ops: groupData } = await createEasyBookingGroup(config.customerId, config.roleId);
  updateEasyBookingGroup.variables.updateGroupInput.CustomerID = config.customerId;
  updateEasyBookingGroup.variables.groupId = groupId;
});

When("the updateGroup API is called for EasyBooking", async function () {
  const event = getEvent(updateEasyBookingGroup);
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should reflect the updated EasyBooking settings", function () {
  expect(globalResponse.response.body.data).to.have.property('updateGroup');
  expect(globalResponse.response.body.data.updateGroup.message).to.equal('Updated successfully');
});


Given("a request to fetch an existing EasyBooking group by ID", async () => {
  const { insertedId: groupId, ops: groupData } = await createEasyBookingGroup(config.customerId, config.roleId);
  getEasyBookingGroup.variables.groupId = groupId
  getEasyBookingGroup.variables.customerId = config.customerId;
});

When("the getGroup API is called for EasyBooking", async function () {
  const event = getEvent(getEasyBookingGroup);
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should contain the correct EasyBooking group details", function () {
  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('getGroup');
  expect(globalResponse.response.body.data.getGroup).to.not.be.null;
  expect(globalResponse.response.body.data.getGroup).to.have.property('_id');
  expect(globalResponse.response.body.data.getGroup).to.have.property('EasyBooking');
  expect(globalResponse.response.body.data.getGroup.EasyBooking.EasyBookingGroups).to.be.an('array');
  if (globalResponse.response.body.data.getGroup.EasyBooking) {
    expect(globalResponse.response.body.data.getGroup.EasyBooking.EasyBookingGroups).to.be.an('array');
  }
});

// New step definitions for EasyBookingGroupID functionality
let easyBookingGroupID;
let permissionGroupID;

Given("an existing EasyBooking group in the database", async () => {
  const { insertedId: groupId } = await createEasyBookingGroup(config.customerId, config.roleId);
  easyBookingGroupID = groupId.toString();
});

Given("a request to add a Permission group with EasyBookingGroupID reference", async () => {
  addPermissionGroupWithEasyBookingID.variables.addGroupInput.CustomerID = config.customerId;
  addPermissionGroupWithEasyBookingID.variables.addGroupInput.EasyBookingGroupID = easyBookingGroupID;
});

When("the addGroup API is called for Permission group", async function () {
  const event = getEvent(addPermissionGroupWithEasyBookingID);
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
    if (response.body.data && response.body.data.addGroup) {
      permissionGroupID = response.body.data.addGroup._id;
    }
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    globalResponse.error = error;
  }
});

Then("the response should contain the Permission group with EasyBookingGroupID", function () {
  expect(globalResponse.response.body.data).to.have.property('addGroup');
  expect(globalResponse.response.body.data.addGroup).to.have.property('EasyBookingGroupID');
  expect(globalResponse.response.body.data.addGroup.EasyBookingGroupID).to.equal(easyBookingGroupID);
  expect(globalResponse.response.body.data.addGroup.GroupType).to.equal('Permissions');
});

Then("the Permission group should be successfully associated with the EasyBooking group", async function () {
  const groupData = await findGroupById(permissionGroupID);
  expect(groupData.EasyBookingGroupID.toString()).to.equal(easyBookingGroupID);
});

Given("an existing Permission group without EasyBookingGroupID", async () => {
  const { insertedId: groupId } = await addPermissionGroup(config.customerId, config.roleId);
  permissionGroupID = groupId.toString();
});

When("the updateGroup API is called to add EasyBookingGroupID association", async function () {
  updatePermissionGroupWithEasyBookingID.variables.groupId = permissionGroupID;
  updatePermissionGroupWithEasyBookingID.variables.updateGroupInput.CustomerID = config.customerId;
  updatePermissionGroupWithEasyBookingID.variables.updateGroupInput.EasyBookingGroupID = easyBookingGroupID;
  
  const event = getEvent(updatePermissionGroupWithEasyBookingID);
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error updating Permission group with EasyBookingGroupID:", error);
    globalResponse.error = error;
  }
});

Then("the Permission group should be updated with the EasyBookingGroupID", async function () {
  const groupData = await findGroupById(permissionGroupID);
  expect(groupData.EasyBookingGroupID.toString()).to.equal(easyBookingGroupID);
});

Then("the association should be properly established", function () {
  expect(globalResponse.response.body.data.updateGroup.message).to.equal('Updated successfully');
});

Given("an existing Permission group with EasyBookingGroupID association", async () => {
  const { insertedId: easyBookingId } = await createEasyBookingGroup(config.customerId, config.roleId);
  easyBookingGroupID = easyBookingId.toString();
  
  const { insertedId: permissionId } = await addPermissionGroup(config.customerId, config.roleId);
  permissionGroupID = permissionId.toString();
  
  await updateGroup(permissionId, { EasyBookingGroupID: easyBookingId });
});

When("the getGroup API is called for the Permission group", async function () {
  getPermissionGroupWithEasyBookingID.variables.groupId = permissionGroupID;
  getPermissionGroupWithEasyBookingID.variables.customerId = config.customerId;
  
  const event = getEvent(getPermissionGroupWithEasyBookingID);
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in getGroup API step:", error);
    globalResponse.error = error;
  }
});

Then("the response should contain the Permission group details", function () {
  expect(globalResponse.response.body.data).to.have.property('getGroup');
  expect(globalResponse.response.body.data.getGroup).to.have.property('_id');
  expect(globalResponse.response.body.data.getGroup).to.have.property('GroupType');
  expect(globalResponse.response.body.data.getGroup.GroupType).to.equal('Permissions');
});

Then("the EasyBookingGroupID should be included in the response", function () {
  expect(globalResponse.response.body.data.getGroup).to.have.property('EasyBookingGroupID');
  expect(globalResponse.response.body.data.getGroup.EasyBookingGroupID).to.equal(easyBookingGroupID);
});

Given("multiple EasyBooking groups exist with priorities", async function () {
  const db = await getDb();
  const existingEasyBookingGroups = await db.collection('Groups').find({
    CustomerID: ObjectId.createFromHexString(config.customerId),
    GroupType: 'EasyBooking',
    IsDeleted: false
  }).toArray();

  if (existingEasyBookingGroups.length > 0) {
    await db.collection('Groups').updateMany(
      {
        CustomerID: ObjectId.createFromHexString(config.customerId),
        GroupType: 'EasyBooking',
        IsDeleted: false
      },
      { $set: { IsDeleted: true, DeletedAt: new Date() } }
    );
  }

  const { insertedId: group1 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group1, { Priority: 1, GroupName: "EasyBooking Group 1" });

  const { insertedId: group2 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2, { Priority: 2, GroupName: "EasyBooking Group 2" });

  const { insertedId: group3 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group3, { Priority: 3, GroupName: "EasyBooking Group 3" });

  this.easyBookingGroups = [group3.toString(), group1.toString(), group2.toString()];
});

When("the updateEasyBookingGroupPriorities API is called with reordered group IDs", async function () {
  updateEasyBookingGroupPriorities.variables.groupIds = this.easyBookingGroups;
  updateEasyBookingGroupPriorities.variables.customerId = config.customerId;

  const event = getEvent(updateEasyBookingGroupPriorities);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the groups should be updated with new priorities based on array index", async function () {
  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('updateEasyBookingGroupPriorities');
  expect(globalResponse.response.body.data.updateEasyBookingGroupPriorities).to.not.be.null;
  expect(globalResponse.response.body.data.updateEasyBookingGroupPriorities.message).to.equal('Successfully updated priorities');

  const group1 = await findGroupById(this.easyBookingGroups[0]);
  const group2 = await findGroupById(this.easyBookingGroups[1]); 
  const group3 = await findGroupById(this.easyBookingGroups[2]);

  expect(group1.Priority).to.equal(1);
  expect(group2.Priority).to.equal(2);
  expect(group3.Priority).to.equal(3);
});

Given("some EasyBooking groups exist in database", async function () {
  const db = await getDb();
  const existingEasyBookingGroups = await db.collection('Groups').find({
    CustomerID: ObjectId.createFromHexString(config.customerId),
    GroupType: 'EasyBooking',
    IsDeleted: false
  }).toArray();

  if (existingEasyBookingGroups.length > 0) {
    await db.collection('Groups').updateMany(
      {
        CustomerID: ObjectId.createFromHexString(config.customerId),
        GroupType: 'EasyBooking',
        IsDeleted: false
      },
      { $set: { IsDeleted: true, DeletedAt: new Date() } }
    );
  }

  const { insertedId: group1 } = await createEasyBookingGroup(config.customerId, config.roleId);
  const { insertedId: group2 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2, { GroupName: "EasyBooking Group 2" });

  this.existingGroups = [group1.toString(), group2.toString()];
});

When("the updateEasyBookingGroupPriorities API is called with incomplete group IDs list", async function () {
  updateEasyBookingGroupPriorities.variables.groupIds = [this.existingGroups[0]];
  updateEasyBookingGroupPriorities.variables.customerId = config.customerId;

  const event = getEvent(updateEasyBookingGroupPriorities);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the API should return an error about missing groups", function () {
  expect(globalResponse.response.body.errors).to.be.an('array');
  expect(globalResponse.response.body.errors[0].message).to.include('Number of provided groups does not match existing EasyBooking groups count');
});

When("the updateEasyBookingGroupPriorities API is called with invalid group IDs", async function () {
  updateEasyBookingGroupPriorities.variables.groupIds = [
    ...this.existingGroups,
    ObjectId.toString()
  ];
  updateEasyBookingGroupPriorities.variables.customerId = config.customerId;

  const event = getEvent(updateEasyBookingGroupPriorities);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the API should return an error about invalid groups", function () {
  expect(globalResponse.response.body.errors).to.be.an('array');
  expect(globalResponse.response.body.errors[0].message).to.include('Number of provided groups does not match existing EasyBooking groups count');
});

Given("multiple EasyBooking groups exist with sequential priorities", async function () {
  const { insertedId: group1 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group1, { Priority: 1, GroupName: "EasyBooking Priority 1" });

  const { insertedId: group2 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2, { Priority: 2, GroupName: "EasyBooking Priority 2" });

  const { insertedId: group3 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group3, { Priority: 3, GroupName: "EasyBooking Priority 3" });

  const { insertedId: group4 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group4, { Priority: 4, GroupName: "EasyBooking Priority 4" });

  this.priorityGroups = {
    group1: group1.toString(),
    group2: group2.toString(), 
    group3: group3.toString(),
    group4: group4.toString()
  };
});

When("an EasyBooking group with middle priority is deleted", async function () {
  deleteGroup.variables.groupId = this.priorityGroups.group2;
  deleteGroup.variables.customerId = config.customerId;
  deleteGroup.variables.IsDeleted = true;

  const event = getEvent(deleteGroup);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the remaining groups with higher priorities should be decremented by 1", async function () {
  expect(globalResponse.response.body.data).to.have.property('groupDeleted');
  expect(globalResponse.response.body.data.groupDeleted.message).to.equal('Deleted Successfully');

  const group1 = await findGroupById(this.priorityGroups.group1);
  const group3 = await findGroupById(this.priorityGroups.group3);
  const group4 = await findGroupById(this.priorityGroups.group4);

  expect(group1.Priority).to.equal(1);
  expect(group3.Priority).to.equal(2);
  expect(group4.Priority).to.equal(3);
});

Given("multiple groups of different types exist including EasyBooking groups", async function () {
  const db = await getDb();
  const existingEasyBookingGroups = await db.collection('Groups').find({
    CustomerID: ObjectId.createFromHexString(config.customerId),
    GroupType: 'EasyBooking',
    IsDeleted: false
  }).toArray();

  if (existingEasyBookingGroups.length > 0) {
    await db.collection('Groups').updateMany(
      {
        CustomerID: ObjectId.createFromHexString(config.customerId),
        GroupType: 'EasyBooking',
        IsDeleted: false
      },
      { $set: { IsDeleted: true, DeletedAt: new Date() } }
    );
  }

  const { insertedId: easyGroup1 } = await createEasyBookingGroup(config.customerId, config.roleId);
  const { insertedId: easyGroup2 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(easyGroup2, { GroupName: "EasyBooking Group 2" });

  const { insertedId: permGroup } = await addPermissionGroup(config.customerId, config.roleId);

  const { insertedId: printGroup } = await addGroup(config.customerId, config.roleId);
  await updateGroup(printGroup, { GroupType: "Print Configuration", GroupName: "Print Config Group" });

  this.mixedGroups = {
    easyBooking: [easyGroup1.toString(), easyGroup2.toString()],
    permission: permGroup.toString(),
    printConfig: printGroup.toString()
  };
});

When("the getGroups API is called with groupTypes filter for EasyBooking", async function () {
  getGroupsWithFilter.variables.groupTypes = ["EasyBooking"];
  getGroupsWithFilter.variables.customerIds = [config.customerId];

  const event = getEvent(getGroupsWithFilter);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("only EasyBooking groups should be returned", function () {
  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('getGroups');
  expect(globalResponse.response.body.data.getGroups).to.not.be.null;
  expect(globalResponse.response.body.data.getGroups.group).to.be.an('array');

  const groups = globalResponse.response.body.data.getGroups.group;
  groups.forEach(group => {
    expect(group.GroupType).to.equal('EasyBooking');
  });

  expect(groups.length).to.equal(this.mixedGroups.easyBooking.length);
});

Given("multiple EasyBooking groups exist with different priorities", async function () {
  const db = await getDb();
  const existingEasyBookingGroups = await db.collection('Groups').find({
    CustomerID: ObjectId.createFromHexString(config.customerId),
    GroupType: 'EasyBooking',
    IsDeleted: false
  }).toArray();

  if (existingEasyBookingGroups.length > 0) {
    await db.collection('Groups').updateMany(
      {
        CustomerID: ObjectId.createFromHexString(config.customerId),
        GroupType: 'EasyBooking',
        IsDeleted: false
      },
      { $set: { IsDeleted: true, DeletedAt: new Date() } }
    );
  }

  const { insertedId: lowPriority } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(lowPriority, { Priority: 3, GroupName: "Low Priority EasyBooking" });

  const { insertedId: highPriority } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(highPriority, { Priority: 1, GroupName: "High Priority EasyBooking" });

  const { insertedId: midPriority } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(midPriority, { Priority: 2, GroupName: "Mid Priority EasyBooking" });

  this.prioritySortGroups = [
    { id: highPriority.toString(), priority: 1, name: "High Priority EasyBooking" },
    { id: midPriority.toString(), priority: 2, name: "Mid Priority EasyBooking" },
    { id: lowPriority.toString(), priority: 3, name: "Low Priority EasyBooking" }
  ];
});

When("the getGroups API is called with groupTypes EasyBooking and sort by Priority", async function () {
  getGroupsWithFilter.variables.groupTypes = ["EasyBooking"];
  getGroupsWithFilter.variables.customerIds = [config.customerId];
  getGroupsWithFilter.variables.paginationInput.sortKey = "Priority";
  getGroupsWithFilter.variables.paginationInput.sort = "asc";

  const event = getEvent(getGroupsWithFilter);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the groups should be returned sorted by priority field", function () {
  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('getGroups');
  expect(globalResponse.response.body.data.getGroups).to.not.be.null;
  expect(globalResponse.response.body.data.getGroups.group).to.be.an('array');

  const groups = globalResponse.response.body.data.getGroups.group;

  groups.forEach(group => {
    expect(group.GroupType).to.equal('EasyBooking');
  });

  for (let i = 0; i < groups.length - 1; i++) {
    expect(groups[i].Priority).to.be.at.most(groups[i + 1].Priority);
  }

  if (groups.length > 0) {
    expect(groups[0].Priority).to.equal(1);
  }
});

Given("an EasyBooking group exists with associated references", async function () {

  const db = await getDb();
  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );

  const { insertedId: easyBookingGroupId } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(easyBookingGroupId, { 
    Priority: 1, 
    GroupName: "EasyBooking Group with References"
  });

  const { insertedId: referencingGroupId } = await db.collection('Groups').insertOne({
    GroupName: 'Group with EasyBooking Reference',
    GroupType: 'Permissions',
    CustomerID: ObjectId.createFromHexString(config.customerId),
    EasyBookingGroupID: [easyBookingGroupId],
    IsDeleted: false,
    CreatedAt: new Date(),
    IsActive: true
  });

  this.referencedEasyBookingGroup = {
    groupId: easyBookingGroupId.toString(),
    referencingGroupId: referencingGroupId.toString()
  };

});

When("the groupDeleted API is called to delete the referenced group", async function () {
  deleteGroup.variables.groupId = this.referencedEasyBookingGroup.groupId;
  deleteGroup.variables.customerId = config.customerId;
  deleteGroup.variables.IsDeleted = true;

  const event = getEvent(deleteGroup);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the API should return an error about disassociating references first", function () {
  expect(globalResponse.response.body.errors).to.be.an('array');
  expect(globalResponse.response.body.errors[0].message).to.include('Failed to delete: Found references in');
});

Given("multiple EasyBooking groups exist without references", async function () {
  const db = await getDb();

  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );

  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      EasyBookingGroupID: { $exists: true, $ne: null },
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );

  const { insertedId: group1 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group1, { Priority: 1, GroupName: "EasyBooking No Ref 1" });

  const { insertedId: group2 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2, { Priority: 2, GroupName: "EasyBooking No Ref 2" });

  const { insertedId: group3 } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group3, { Priority: 3, GroupName: "EasyBooking No Ref 3" });

  this.noReferencesGroups = {
    group1: group1.toString(),
    group2: group2.toString(),
    group3: group3.toString()
  };

});

When("the groupDeleted API is called to delete a group without references", async function () {

  deleteGroup.variables.groupId = this.noReferencesGroups.group2;
  deleteGroup.variables.customerId = config.customerId;
  deleteGroup.variables.IsDeleted = true;

  const event = getEvent(deleteGroup);
  const context = {};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    globalResponse.error = error;
  }
});

Then("the group should be deleted successfully and remaining priorities should be rearranged", async function () {

  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('groupDeleted');
  expect(globalResponse.response.body.data.groupDeleted.message).to.equal('Deleted Successfully');

  const group1 = await findGroupById(this.noReferencesGroups.group1);
  const group3 = await findGroupById(this.noReferencesGroups.group3);

  expect(group1.Priority).to.equal(1);
  expect(group3.Priority).to.equal(2);

  const deletedGroup = await findGroupById(this.noReferencesGroups.group2);
  expect(deletedGroup.IsDeleted).to.equal(true);
});

Given("an existing EasyBooking group with priority 1 for duplicate test", async function () {
  const db = await getDb();
  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );
  const { insertedId: existingGroupId } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(existingGroupId, { 
    Priority: 1, 
    GroupName: "Existing EasyBooking Priority 1"
  });
  
  this.existingEasyBookingGroup = {
    groupId: existingGroupId.toString(),
    priority: 1
  };
});

Given("a request to add another EasyBooking group with the same priority 1", async function () {
  addEasyBookingGroup.variables.addGroupInput.CustomerID = config.customerId;
  addEasyBookingGroup.variables.addGroupInput.Priority = 1;
  addEasyBookingGroup.variables.addGroupInput.GroupName = "Duplicate Priority EasyBooking Group";
});

Then("the API should return an error about duplicate priority", function () {
  expect(globalResponse.response.body.errors).to.be.an('array');
  expect(globalResponse.response.body.errors[0].message).to.include('Another EasyBooking group with the same priority already exists');
});

Given("two existing EasyBooking groups with different priorities", async function () {
  const db = await getDb();
  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );
  
  const { insertedId: group1Id } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group1Id, { 
    Priority: 1, 
    GroupName: "EasyBooking Group Priority 1"
  });
  
  const { insertedId: group2Id } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2Id, { 
    Priority: 2, 
    GroupName: "EasyBooking Group Priority 2"
  });
  
  this.existingEasyBookingGroups = {
    group1: { id: group1Id.toString(), priority: 1 },
    group2: { id: group2Id.toString(), priority: 2 }
  };
  
});

Given("a request to update one EasyBooking group to use the other group's priority", async function () {
  updateEasyBookingGroup.variables.groupId = this.existingEasyBookingGroups.group2.id;
  updateEasyBookingGroup.variables.updateGroupInput.CustomerID = config.customerId;
  updateEasyBookingGroup.variables.updateGroupInput.Priority = 1; // Same priority as group1
  updateEasyBookingGroup.variables.updateGroupInput.GroupName = "Updated EasyBooking Group Priority Conflict";
});

Given("existing EasyBooking groups with priorities 1 and 2", async function () {
  const db = await getDb();
  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );

  const { insertedId: group1Id } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group1Id, { 
    Priority: 1, 
    GroupName: "EasyBooking Priority 1"
  });
  
  const { insertedId: group2Id } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(group2Id, { 
    Priority: 2, 
    GroupName: "EasyBooking Priority 2"
  });
  
  this.existingPriorityGroups = {
    group1: { id: group1Id.toString(), priority: 1 },
    group2: { id: group2Id.toString(), priority: 2 }
  };
});

Given("a request to add EasyBooking group with priority 0", async function () {
  addEasyBookingGroup.variables.addGroupInput.CustomerID = config.customerId;
  addEasyBookingGroup.variables.addGroupInput.Priority = 0;
  addEasyBookingGroup.variables.addGroupInput.GroupName = "Invalid Priority 0 Group";

});

Given("a request to add EasyBooking group with priority 5", async function () {
  addEasyBookingGroup.variables.addGroupInput.CustomerID = config.customerId;
  addEasyBookingGroup.variables.addGroupInput.Priority = 5;
  addEasyBookingGroup.variables.addGroupInput.GroupName = "Invalid Priority 5 Group";
});

Given("a request to add EasyBooking group with priority 3", async function () {
  addEasyBookingGroup.variables.addGroupInput.CustomerID = config.customerId;
  addEasyBookingGroup.variables.addGroupInput.Priority = 3;
  addEasyBookingGroup.variables.addGroupInput.GroupName = "Valid Priority 3 Group";
});

Then("the API should return an error about invalid priority value", function () {
  expect(globalResponse.response.body.errors).to.be.an('array');
  expect(globalResponse.response.body.errors[0].message).to.include('Invalid Priority value');
});

Given("an existing EasyBooking group with priority 1 for update test", async function () {
  const db = await getDb();
  await db.collection('Groups').updateMany(
    {
      CustomerID: ObjectId.createFromHexString(config.customerId),
      GroupType: 'EasyBooking',
      IsDeleted: false
    },
    { $set: { IsDeleted: true, DeletedAt: new Date() } }
  );

  const { insertedId: groupId } = await createEasyBookingGroup(config.customerId, config.roleId);
  await updateGroup(groupId, { 
    Priority: 1, 
    GroupName: "EasyBooking Priority Immutable Test"
  });
  
  this.immutablePriorityGroup = {
    id: groupId.toString(),
    originalPriority: 1
  };

});

Given("a request to update the EasyBooking group with new priority 2", async function () {
  updateEasyBookingGroup.variables.groupId = this.immutablePriorityGroup.id;
  updateEasyBookingGroup.variables.updateGroupInput.CustomerID = config.customerId;
  updateEasyBookingGroup.variables.updateGroupInput.Priority = 2;
  updateEasyBookingGroup.variables.updateGroupInput.GroupName = "Updated Group Name";
  updateEasyBookingGroup.variables.updateGroupInput.Description = "Updated description";

});

Then("the group priority should remain unchanged", async function () {
  expect(globalResponse.response.body).to.have.property('data');
  expect(globalResponse.response.body.data).to.not.be.null;
  expect(globalResponse.response.body.data).to.have.property('updateGroup');
  expect(globalResponse.response.body.data.updateGroup.message).to.equal('Updated successfully');

  const updatedGroup = await findGroupById(this.immutablePriorityGroup.id);
  expect(updatedGroup.Priority).to.equal(this.immutablePriorityGroup.originalPriority);
  expect(updatedGroup.GroupName).to.equal("Updated Group Name");
  expect(updatedGroup.Description).to.equal("Updated description");
});