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
const { addGroup, findGroupById, updateGroup, addPermissionGroup, addQuotaGroup } = require("../../../memoryDb/group");
const {updateGroupMutation} = require("../mutations/groups.mutation");
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