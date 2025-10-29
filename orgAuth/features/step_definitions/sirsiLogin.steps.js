const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const { updateAuthProvider } = require("../../../memoryDb/provider");
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs");
const server = request(config.url);
const { updateGroup, addPermissionGroup } = require("../../../memoryDb/group");
const { findUserByHashId, deleteAllUsers, addUser, findUserQuery, updateUser } = require("../../../memoryDb/users");
const { loginHandler } = require("../../controllers/common.controller");
const { SIRSI_RESOURCE_USER, SIRSI_LOGIN_TYPE_PATRON, INNOVATION_LOGIN_BARCODE_WITH_PIN, SIRSI_PATRON_LOGIN_END_POINT, SIRSI_STAFF_LOGIN_END_POINT } = require("../../helpers/constants");
const sinon = require("sinon");
let response;
let requestBody = {};
let groupIdFromAssignmentRule;
let userDetail;

const easyBookingGroupRules = {
  Priority: 1,
  Description: "Group assignment rules for Sirsi login",
  EnableSessionSettings: false,
  EasyBookingGroups: [
    {
      EasyBookingGroupName: "Test Sirsi Users Assignment",
      IsActive: true,
      Conditions: [
        {
          Field: "barcode",
          Condition: "equal",
          Value: ["601001"],
          SingleMatch: true,
        },
      ],
    },
  ],
};

Before('@SirsiLogin', async () => {
  response = null;
  requestBody = {
    orgId: config.sirsiData.OrgID,
    barcode: config.sirsiLoginCreds.Barcode,
    password: config.sirsiLoginCreds.Pin,
    authId: config.sirsiData._id,
  };
  groupIdFromAssignmentRule = null;
  await deleteAllUsers();
});

// Helper functions for modifying the request and config
const modifyRequestBody = (modification) => {
  switch (modification) {
    case "without authId":
      delete requestBody.authId;
      break;
    case "without barcode or password":
      delete requestBody.barcode;
      break;
    case "with invalid barcode or password":
      requestBody.barcode = "InvalidBarcode";
      requestBody.password = "InvalidPassword";
      break;
    default:
      break;
  }
};

const modifyConfig = async (modification) => {
  let updateObj = {
    SirsiConfig: { ...config.sirsiData.SirsiConfig },
    Mappings: { ...config.polarisData.Mappings },
    AuthProvider: "sirsi",
  };
  switch (modification) {
    case "with invalid ClientID":
      updateObj.SirsiConfig.ClientId = "InvalidClientId";
      updateObj.SirsiConfig.Password = "Test";
      break;
    case "with LoginType BarcodeOnly and Invalid Username or Password":
      updateObj.SirsiConfig.LoginType = "BarcodeOnly";
      updateObj.SirsiConfig.Username = "InvalidUsername";
      break;
    case "invalid ServerBaseURL":
      updateObj.SirsiConfig.ServerBaseURL = "InvalidServerBaseURL";
      break;
    case "configured EasyBookingGroup":
      const { insertedId: groupId } = await addPermissionGroup(
        config.customerId,
        config.roleId
      );
      await updateGroup(groupId, { 
        GroupName: "Test Sirsi Users",
        GroupType: "EasyBooking",
        EasyBooking: easyBookingGroupRules 
      });
      groupIdFromAssignmentRule = groupId;
      updateObj.Mappings["GroupName"] = "";
      break;
    default:
      break;
  }
  await updateAuthProvider(updateObj, config.sirsiData._id);
};

// Step definitions
Given("a request body {string} to login with sirsi", function (requestBody) {
  modifyRequestBody(requestBody);
});

Given(
  "an authProvider {string} to login with sirsi",
  async function (authCofig) {
    await modifyConfig(authCofig);
  }
);

Given(
  "an authProvider with invalid ServerBaseURL to login with sirsi",
  async function () {
    await modifyConfig("invalid ServerBaseURL");
  }
);

Given(
  "an EasyBooking group is created with specific matching conditions for Sirsi login",
  async function () {
    await modifyConfig("configured EasyBookingGroup");
  }
);

When("I send a POST request to login with sirsi", function (callback) {
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
  "The response status should be {int} in login with sirsi",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
  }
);

Then(
  "The response should contain {string} in login with sirsi",
  function (expectedMessage) {
    expect(JSON.parse(response.text)).to.deep.equal({
      error: { code: null, message: expectedMessage },
      status: 0,
    });
  }
);

Then(
  "The response should contain one of the messages in login with sirsi",
  function (dataTable) {
    const expectedMessages = dataTable.raw().flat();
    const actualMessage = JSON.parse(response.text).error.message;
    expect(expectedMessages).to.include(actualMessage);
  }
);

Then("The response should contain hashId in login with sirsi", function () {
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property("error", null);
  expect(parsedResponse).to.have.property("data").that.is.an("object");
  expect(parsedResponse.data).to.have.property("hashId");
});

Then(
  "The system should evaluate the EasyBooking group conditions and assign the user to the matching group based on the defined rules for Sirsi login",
  async function () {
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

Then(
  "The error should stored in AuditLogs collection for sirsi login",
  async function () {
    const sirsiLoginAuditLogs = await getAuditLogsByType("SirsiLogin");
    expect(sirsiLoginAuditLogs.length).to.be.greaterThan(0);
  }
);

Given(
  "one user already exists in the system - SirsiLogin",
  async function () {
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.sirsiData.OrgID,
      "testsirsi@example.com"
    );
    userDetail = userData[0];
    await updateUser(
      { AuthProviderID: config.sirsiData._id, GenerationTimestamp: Date.now() },
      userDetail._id
    );
  }
);

When("the user log in using Sirsi SSO", async function () {
  const relayStateData = JSON.stringify({
    orgId: config.sirsiData.OrgID,
    tier: "standard",
    feRedirectURI: "https://frontend.example.com",
  });
  this.req = {
    body: {
      code: "valid-token",
      state: "valid-state",
      authId: config.sirsiData._id.toString(),
      orgId: config.sirsiData.OrgID,
      tier: "standard",
    },
    cookies: {
      authstate: "valid-state",
      relaySate: relayStateData,
    },
    headers: { cookie: `relaySate=${relayStateData}` },
  };

  this.res = {
    send: sinon.stub(),
    status: sinon.stub().returnsThis(),
    json: sinon.stub(),
  };

  config.privateDecryptStub.returns(Buffer.from("decrypted-mocked-data"));
  const { ServerBaseURL, LoginType } = config.sirsiData.SirsiConfig;
  const resourceURL = `${ServerBaseURL}${SIRSI_RESOURCE_USER}`;
  const apiURL = `${resourceURL}${
    LoginType == SIRSI_LOGIN_TYPE_PATRON ||
    LoginType == INNOVATION_LOGIN_BARCODE_WITH_PIN
      ? SIRSI_PATRON_LOGIN_END_POINT
      : SIRSI_STAFF_LOGIN_END_POINT
  }`;

  config.mockAxiosInstance.onPost(apiURL).reply(200, {
    sessionToken: "test",
    patronKey: "test",
  });

  const patronApiURL = `${resourceURL}/patron/key/test?includeFields=*,blockList{*},circRecordList{*}`;

  config.mockAxiosInstance.onGet(patronApiURL).reply(200, {
    fields: {
      email: "testsirsi@example.com",
      firstName: "Test",
      LastName: "User",
      CardNumber: "402871",
      barcode: "testsirsi1@example.com",
    },
  });

 await loginHandler(this.req, this.res);
  
});

Then("the system should update the Sirsi user information", async function () {
  let user = null;
  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ PrimaryEmail: "testsirsi@example.com" });
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  expect(user.FirstName.toString()).to.be.equal("Test");
});
