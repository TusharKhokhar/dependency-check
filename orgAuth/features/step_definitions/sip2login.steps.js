const {
  Given,
  When,
  Then,
  Before,
  setDefaultTimeout,
  BeforeAll,
} = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const server = request(config.url);
const { updateAuthProvider } = require("../../../memoryDb/provider");
const { updateGroup, addPermissionGroup } = require("../../../memoryDb/group");
const { findUserByHashId, deleteAllUsers } = require("../../../memoryDb/users");
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs");

setDefaultTimeout(100000);

let response;
let requestBody = {};
let orgID;
let authData;
let loginCreds;
let groupIdFromAssignmentRule;

const easyBookingGroupRules = {
  Priority: 1,
  Description: "Group assignment rules for SIP2 login",
  EnableSessionSettings: true,
  EasyBookingGroups: [
    {
      EasyBookingGroupName: "TBS Users Assignment",
      IsActive: true,
      Conditions: [
        {
          Field: "institutionId",
          Condition: "equal",
          Value: ["TBS"],
          SingleMatch: true,
        },
      ],
    },
  ],
};

BeforeAll(async () => {
  authData = config.sip2Data;
  orgID = config.orgID;
  loginCreds = config.sip2LoginCreds;
});

// Reset variables before each scenario
Before('@Sip2Login', async () => {
  response = null;
  requestBody = {
    orgId: orgID,
    barcode: loginCreds.Barcode,
    pin: loginCreds.Pin,
    authId: authData._id,
  };
  await updateAuthProvider({ Sip2Config: authData.Sip2Config }, authData._id);
  groupIdFromAssignmentRule = null
  await deleteAllUsers()
});

Given("a request body without authId for SIP2 login", function () {
  delete requestBody["authId"];
});

Given("a request body without barcode or pin for SIP2 login", async function () {
  delete requestBody["barcode"];
});

Given(
  "an authProviderConfig with invalid connection details for SIP2 login",
  async function () {
    const updateObj = {
      Sip2Config: {
        Host: "test",
      },
    };
    await updateAuthProvider(updateObj, authData._id);
  }
);

Given(
  "an authProviderConfig with missing Username or Password for SIP2 login",
  async function () {
    const updateObj = {
      Sip2Config: {
        Host: authData.Sip2Config.Host,
        LoginEnabled: true,
        Username: "",
        Password: "",
      },
    };
    await updateAuthProvider(updateObj, authData._id);
  }
);

Given(
  "an authProviderConfig with invalid Username or Password for SIP2 login",
  async function () {
    const updateObj = {
      Sip2Config: {
        Host: authData.Sip2Config.Host,
        LoginEnabled: true,
        Username: "Test",
        Password: "Test",
      },
      AuthProvider: "sip2",
    };
    await updateAuthProvider(updateObj, authData._id);
  }
);

Given("a request body with invalid barcode or pin for SIP2 login", function () {
  requestBody.barcode = "Test";
});

Given("a request body with valid credentials for SIP2 login", function () {});

Given(
  "an EasyBooking group is created with specific matching conditions for SIP2 login",
  async function () {
    const { insertedId: groupId } = await addPermissionGroup(config.customerId, config.roleId)
    await updateGroup(groupId, { 
      GroupName: "TBS Users",
      GroupType: "EasyBooking",
      EasyBooking: easyBookingGroupRules 
    })
    
    groupIdFromAssignmentRule = groupId

    const updateObj = {
      Sip2Config: {
        Host: authData.Sip2Config.Host,
        LoginEnabled: false,
        Username: "",
        Password: "",
      },
      Mappings: { ...authData.Mappings, GroupName: "" },
    };
    await updateAuthProvider(updateObj, authData._id);
  }
);

When(/^I send a POST request to login with sip2$/, (callback) => {
  server
    .post("/auth/login")
    .send(requestBody)
    .end(function (err, res) {
      if (err) {
        callback(err);
      }
      response = res.res;
      callback();
    });
});

Then(
  "The HTTP response status should be {int} and the response should contain {string} in login with sip2",
  function (statusCode, expectedMessage) {
    expect(response.statusCode).to.equal(statusCode);
    expect(JSON.parse(response.text)).to.be.deep.equal({
      error: { code: null, message: expectedMessage },
      status: 0,
    });
  }
);

Then(
  "the response should have status {int} and contain any of the messages in login with sip2",
  function (statusCode, dataTable) {
    expect(response.statusCode).to.equal(statusCode);
    const expectedMessages = dataTable.raw().flat();
    const actualMessage = JSON.parse(response.text).error.message;
    expect(expectedMessages).to.include(actualMessage);
  }
);

Then(
  "The HTTP response status should be {int} and the response should contain hashId in login with sip2",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse).to.have.property("error", null);
    expect(parsedResponse).to.have.property("data").that.is.an("object");
    expect(parsedResponse.data).to.have.property("hashId");
  }
);

Then(
  "The system should evaluate the EasyBooking group conditions and assign the user to the matching group based on the defined rules",
  async function () {
    // Verify successful login response
    expect(response.statusCode).to.equal(200);
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.data).to.have.property('hashId');
    
    // Verify user was assigned to the correct group based on EasyBooking group rules evaluation
    const { GroupID: userAssignedGroupId } = await findUserByHashId(
      parsedResponse.data.hashId,
      requestBody.orgId
    );
    expect(userAssignedGroupId[0].toString()).to.be.equal(
      groupIdFromAssignmentRule.toString()
    );
  }
);

Then("The error should stored in AuditLogs collection for sip2 login",async function () {
  const sip2LoginAuditLogs = await getAuditLogsByType("Sip2Login")
  expect(sip2LoginAuditLogs.length).to.be.greaterThan(0)
});

Given('a valid SIP2 auth provider config with AllowUserCreation set to true', async function () {
  const updateObj = {
    AllowUserCreation: true,
  };
  await updateAuthProvider(updateObj, authData._id);
});

Given('a valid SIP2 auth provider config with AllowUserCreation set to false', async function () {
  const updateObj = {
    AllowUserCreation: false,
  };
  await updateAuthProvider(updateObj, authData._id);
});

Then('the system should create or update the user and return a hashId for SIP2 login', function () {
  expect(response.statusCode).to.equal(200);
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property('error', null);
  expect(parsedResponse).to.have.property('data').that.is.an('object');
  expect(parsedResponse.data).to.have.property('hashId').that.is.a('string');
});

Then('the system should process the request without creating or updating the user and return the validated user response for sip2', function () {
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
