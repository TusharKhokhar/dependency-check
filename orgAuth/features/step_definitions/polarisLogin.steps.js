const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const { updateAuthProvider } = require("../../../memoryDb/provider");
const { findUserByHashId, deleteAllUsers } = require("../../../memoryDb/users");
const { addPermissionGroup, updateGroup } = require("../../../memoryDb/group");
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs");
const server = request(config.url);

let response;
let requestBody = {};
let groupIdFromAssignmentRule;

const easyBookingGroupRules = {
  Priority: 1,
  Description: "Group assignment rules for Polaris login",
  EnableSessionSettings: false,
  EasyBookingGroups: [
    {
      EasyBookingGroupName: "Test Polaris Users Assignment",
      IsActive: true,
      Conditions: [
        {
          Field: "Barcode",
          Condition: "equal",
          Value: ["11223344"],
          SingleMatch: true,
        },
      ],
    },
  ],
};

Before('@PolarisLogin', async () => {
  response = null;
  requestBody = {
    orgId: config.orgID,
    barcode: config.polarisLoginCreds.UserName,
    password: config.polarisLoginCreds.Password,
    authId: config.polarisData._id,
  };
  groupIdFromAssignmentRule = null
  await deleteAllUsers()
});

// Helper functions for modifying the request and config
const modifyRequestBody = (modification) => {
  switch (modification) {
    case "without authId":
      delete requestBody.authId;
      break;
    case "without barcode":
      delete requestBody.barcode;
      break;
    case "without password":
      delete requestBody.password;
      break;
    case "with invalid barcode or password":
      requestBody.barcode = "xyz";
      requestBody.password = "xyz";
      break;
    default:
      break;
  }
  }

const modifyConfig = async (modification) => {
  let updateObj = {
    PolarisConfig: { ...config.polarisData.PolarisConfig },
    Mappings: { ...config.polarisData.Mappings },
    AuthProvider: "polaris",
  };
  switch (modification) {
    case "invalid Host or Port":
      updateObj.PolarisConfig.Host = "Test";
      break;
    case "with invalid ClientID":
      updateObj.PolarisConfig.ClientId = "InvalidClientId";
      break;
    case "with LoginType BarcodeOnly and Invalid Username or Password or Domain":
      updateObj.PolarisConfig.Username = "InvalidUsername";
      updateObj.PolarisConfig.Password = "InvalidPassword";
      updateObj.PolarisConfig.Domain = "InvalidDomain";
      updateObj.PolarisConfig.LoginType = "BarcodeOnly";
      break;
    case "with invalid PAPIAccessId":
      updateObj.PolarisConfig.PAPIAccessId = "Test";
      break;
    case "with invalid PAPIAccessKey":
      updateObj.PolarisConfig.PAPIAccessKey = "Test";
      break;
    case "configured EasyBookingGroup":
      const { insertedId: groupId } = await addPermissionGroup(config.customerId, config.roleId)
      await updateGroup(groupId, { 
        GroupName: "Test Polaris Users",
        GroupType: "EasyBooking",
        EasyBooking: easyBookingGroupRules 
      })
      groupIdFromAssignmentRule = groupId
      updateObj.Mappings['GroupName'] = ""
      break;
    default:
      break;
  }
  await updateAuthProvider(updateObj, config.polarisData._id);
};

// Step definitions
Given("a request body {string} for Polaris login", function (requestBody) {
  modifyRequestBody(requestBody);
});

Given(
  "an authProvider with invalid Host or Port for Polaris login",
  async function () {
    await modifyConfig("invalid Host or Port");
  }
);


Given("an authProvider {string} for Polaris login", async function (authCofig) {
  await modifyConfig(authCofig);
});

Given(
  "an authProvider with invalid ServerBaseURL to login with Polaris",
  async function () {
    await modifyConfig("invalid ServerBaseURL");
  }
);

Given(
  "an EasyBooking group is created with specific matching conditions for Polaris login",
  async function () {
    await modifyConfig("configured EasyBookingGroup");
  }
);

When("I send a POST request for Polaris login", function (callback) {
  server
    .post("/auth/login")
    .send(requestBody)
    .end((err, res) => {
      if (err) {
        callback(err);
      }
      response = res.res;
      callback();
    });
});

Then(
  "The response status should be {int} for Polaris login",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
  }
);

Then(
  "The response should contain {string} for Polaris login",
  function (expectedMessage) {
    const responseBody = JSON.parse(response.text);
    expect(responseBody.error.message).to.equal(expectedMessage);
  }
);

Then(
  "The response should contain one of the messages for Polaris login",
  function (dataTable) {
    const expectedMessages = dataTable.raw().flat();
    const actualMessage = JSON.parse(response.text).error.message;
    expect(expectedMessages).to.include(actualMessage);
  }
);

Then("The response should contain hashId for Polaris login", function () {
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property("error", null);
  expect(parsedResponse).to.have.property("data").that.is.an("object");
  expect(parsedResponse.data).to.have.property("hashId");
});

Then(
  "The system should evaluate the EasyBooking group conditions and assign the user to the matching group based on the defined rules for Polaris login",
  async function () {
    const parsedResponse = JSON.parse(response.text);
    const { GroupID: userAssignedGroupId } = await findUserByHashId(
      parsedResponse.data.HashID,
      requestBody.orgId
    );
    expect(userAssignedGroupId[0].toString()).to.be.equal(
      groupIdFromAssignmentRule.toString()
    );
  }
);

Then("The error should stored in AuditLogs collection for for Polaris login",async function () {
  const polarisLoginAuditLogs = await getAuditLogsByType("PolarisLogin")
  expect(polarisLoginAuditLogs.length).to.be.greaterThan(0)
});

Given('a valid Polaris auth provider config with AllowUserCreation set to true', async function () {
  const updateObj = {
    AllowUserCreation: true,
  };
  await updateAuthProvider(updateObj, config.polarisData._id);
});

Given('a valid Polaris auth provider config with AllowUserCreation set to false', async function () {
  const updateObj = {
    AllowUserCreation: false,
  };
  await updateAuthProvider(updateObj, config.polarisData._id);
});

Then('the system should create or update the user and return a hashId for Polaris login', function () {
  expect(response.statusCode).to.equal(200);
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property('error', null);
  expect(parsedResponse).to.have.property('data').that.is.an('object');
  expect(parsedResponse.data).to.have.property('hashId').that.is.a('string');
});

Then('the system should process the request without creating or updating the user and return the validated user response for Polaris', function () {
  expect(response.statusCode).to.equal(200);
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property('error', null);
  expect(parsedResponse).to.have.property('data').that.is.an('object');
  expect(parsedResponse.data).to.have.property('CustomerID');
  expect(parsedResponse.data).to.have.property('TenantDomain');
  expect(parsedResponse.data).to.have.property('PrimaryEmail');
  expect(parsedResponse.data).to.have.property('Username');
  expect(parsedResponse.data).to.have.property('Group');
  expect(parsedResponse.data).to.have.property('FirstName');
  expect(parsedResponse.data).to.have.property('LastName');
  expect(parsedResponse.data).to.have.property('CardNumber');
  expect(parsedResponse.data).to.have.property('Mobile');
});