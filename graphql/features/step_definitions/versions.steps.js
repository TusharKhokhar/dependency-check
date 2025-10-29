const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const { addVersion } = require("../mutations/versions.mutation");
const {config} = require('../configs/config')
const { getEvent } = require("../mocks/event");
const expect = chai.expect;
const { addCustomer, updateCustomer, getCustomer } = require("../../../memoryDb/customer");
const { addPermissionGroup, addQuotaGroup, addGroup } = require("../../../memoryDb/group");
const { addRole, getRole, updateRole } = require("../../../memoryDb/roles");
const { fetchToken } = require("../../../memoryDb/users");
const { addUser } = require("../../../memoryDb/users");
const { addDropdowns } = require('../../../memoryDb/dropdowns');
const { getCustomPermission } = require("../../../memoryDb/customerPermissions");

let globalResponse = {};
let customerID;
const context = {};

Given("the input does not include the IsActive field", async function () {
  const { insertedId: customerId } = await addCustomer();
  await updateCustomer({ DomainName: "admin" }, customerId);
  const updatedCustomerData = await getCustomer(customerId);
  const { insertedId: roleId } = await addRole(customerId);
  const role = await getRole(roleId);
  
  const customPermission = await getCustomPermission("Add_Software_Update");
  await updateRole({
    CustomPermissions: [
      ...role.CustomPermissions,
      customPermission._id,
    ],
  },roleId);
  const { insertedId: groupId, ops: groupData } = await addGroup(customerId);
  const { insertedId: quotaGroupId } = await addQuotaGroup(customerId);
  const { insertedId: groupPermissionId } = await addPermissionGroup(
    customerId,
    roleId
  );
  const { ops: userData } = await addUser(
    [groupId, groupPermissionId],
    [
      {
        GroupID: quotaGroupId,
        QuotaBalance: 10,
      },
    ],
    customerId,
    updatedCustomerData.Tier,
    updatedCustomerData.DomainName
  );
  await addDropdowns()
  config.token = await fetchToken(userData[0]);
  customerID = customerId.toString();
  addVersion.variables.addVersionInput.CustomerID = customerID;
  addVersion.variables.addVersionInput.VersionNumber = "1.0.0";
  return addVersion;
});



When("the user calls the addVersion mutation with the provided VersionInput", async function () {
  const event = getEvent(addVersion);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});


Then("the response should contain the Version data with IsActive set to false", function () {
  expect(globalResponse.response.body.data.addVersion.IsActive).to.equal(false);
});


Given("the input includes IsActive set to false", async function () {
  addVersion.variables.addVersionInput.CustomerID = customerID;
  addVersion.variables.addVersionInput.VersionNumber = "1.0.1";
  addVersion.variables.addVersionInput["IsActive"] = false;
  return addVersion;
});

Given("the input includes IsActive set to true", async function () {
  addVersion.variables.addVersionInput.CustomerID = customerID;
  addVersion.variables.addVersionInput.VersionNumber = "1.0.2";
  addVersion.variables.addVersionInput["IsActive"] = true;
  return addVersion;
});

Then("the response should contain the Version data with IsActive set to true", function () {
  expect(globalResponse.response.body.data.addVersion.IsActive).to.equal(true);
});