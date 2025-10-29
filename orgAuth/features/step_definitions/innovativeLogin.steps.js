const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const { updateAuthProvider } = require("../../../memoryDb/provider");
const server = request(config.url);
const { addPermissionGroup, updateGroup } = require("../../../memoryDb/group");
const { findUserByHashId, deleteAllUsers } = require("../../../memoryDb/users")
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs")

let response;
let requestBody = {};
let groupIdFromAssignmentRule;

const groupAssignmentRules = [
  {
    SubGroups: [
      {
        Rules: [
          {
            Field: "barcodes",
            Match: "single",
            Condition: "equal_to",
            Value: "1122334455",
          },
        ],
        Name: "Test Innovative Users",
        Active: true,
      },
    ],
    Priority: 1,
    GroupName: "Test Innovative Users",
    Enabled: true,
  },
];

Before('@InnovativeLogin', async () => {
  response = null;
  requestBody = {
    orgId: config.orgID,
    barcode: config.innovativeLoginCreds.Barcode,
    pin: config.innovativeLoginCreds.Pin,
    authId: config.innovativeData._id,
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
        case "without pin":
          delete requestBody.pin;
          break;
        case "with invalid barcode or pin":
          requestBody.barcode = "InvalidBarcode";
          requestBody.pin = "Invalidpin";
          break;
        default:
          break;
      }
};

const modifyConfig = async (modification) => {
  let updateObj = {
    Mappings: { ...config.innovativeData.Mappings },
    InnovativeConfig: { ...config.innovativeData.InnovativeConfig },
    AuthProvider: "innovative",
  };
  switch (modification) {
    case "with invalid ClientID":
      updateObj.InnovativeConfig.ClientId = "InvalidClientId";
      break;
    case "with invalid ClientSecret": 
      updateObj.InnovativeConfig.ClientSecret = "InvalidClientSecret"
      break;
    case "with LoginType BarcodeOnly and Invalid Barcode":
      updateObj.InnovativeConfig.LoginType = "BarcodeOnly";
      requestBody.barcode = "InvalidUsername";
      break;
    case "invalid ServerBaseURL":
      updateObj.InnovativeConfig.ServerBaseURL = "InvalidServerBaseURL";
      break;
    case "configured GroupAssignmentRules":
      const { insertedId: groupId } = await addPermissionGroup(config.customerId, config.roleId)
      await updateGroup(groupId, { GroupName: "Test Innovative Users" })
      groupIdFromAssignmentRule = groupId
      updateObj.Mappings['GroupName'] = ""
      updateObj.GroupAssignmentRules = groupAssignmentRules;
      break;
    default:
      break;
  }
  await updateAuthProvider(updateObj, config.innovativeData._id);
};

// Step definitions
Given("a request body {string} for Innovative login", function (requestBody) {
  modifyRequestBody(requestBody);
});


Given("an authProvider {string} for Innovative login", async function (authCofig) {
  await modifyConfig(authCofig);
});

Given(
  "an authProvider with invalid ServerBaseURL to login with Innovative",
  async function () {
    await modifyConfig("invalid ServerBaseURL");
  }
);

Given(
  "an authentication provider is configured with GroupAssignmentRules, and it contains a group named 'Test Users' with specific matching conditions for Innovative login",
  async function () {
    await modifyConfig("configured GroupAssignmentRules");
  }
);

When("I send a POST request for Innovative login", function (callback) {
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
  "The response status should be {int} for Innovative login",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
  }
);

Then(
  "The response should contain {string} for Innovative login",
  function (expectedMessage) {
    const responseBody = JSON.parse(response.text);
    expect(responseBody.error.message).to.equal(expectedMessage);
  }
);

Then(
  "The response should contain one of the messages for Innovative login",
  function (dataTable) {
    const expectedMessages = dataTable.raw().flat();
    const actualMessage = JSON.parse(response.text).error.message;
    expect(expectedMessages).to.include(actualMessage);
  }
);

Then("The response should contain hashId for Innovative login", function () {
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property("error", null);
  expect(parsedResponse).to.have.property("data").that.is.an("object");
  expect(parsedResponse.data).to.have.property("hashId");
});


Then(
  "The user should be assigned to the {string} if rules matches for this group for Innovative login",
  async function (groupName) {
    const parsedResponse = JSON.parse(response.text);
    const { GroupID: userAssignedGroupId } = await findUserByHashId(
      parsedResponse.data.hashId,
      requestBody.orgId
    );
    expect(userAssignedGroupId[0].toString()).to.be.equal(
      groupIdFromAssignmentRule.toString()
    );
  }
);

Then("The error should stored in AuditLogs collection for Innovative login",async function () {
  const innovativeLoginAuditLogs = await getAuditLogsByType("InnovativeLogin")
  expect(innovativeLoginAuditLogs.length).to.be.greaterThan(0)
});
