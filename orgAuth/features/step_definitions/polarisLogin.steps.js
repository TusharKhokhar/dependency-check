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

const groupAssignmentRules = [
  {
    SubGroups: [
      {
        Rules: [
          {
            Field: "Barcode",
            Match: "single",
            Condition: "equal_to",
            Value: "11223344",
          },
        ],
        Name: "Test Polaris Users",
        Active: true,
      },
    ],
    Priority: 1,
    GroupName: "Test Polaris Users",
    Enabled: true,
  },
];

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
    case "configured GroupAssignmentRules":
      const { insertedId: groupId } = await addPermissionGroup(config.customerId, config.roleId)
      await updateGroup(groupId, { GroupName: "Test Polaris Users" })
      groupIdFromAssignmentRule = groupId
      updateObj.Mappings['GroupName'] = ""
      updateObj.GroupAssignmentRules = groupAssignmentRules;
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
  "an authentication provider is configured with GroupAssignmentRules, and it contains a group named 'Test Users' with specific matching conditions in Polaris login",
  async function () {
    await modifyConfig("configured GroupAssignmentRules");
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
  "The user should be assigned to the {string} if rules matches for this group in Polaris login",
  async function (groupName) {
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
