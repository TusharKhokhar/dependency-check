const {
  Given,
  When,
  Then,
  Before,
  setDefaultTimeout,
  BeforeAll,
  AfterAll,
} = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const { addCustomer } = require("../../../memoryDb/customer");
const { addPartner } = require("../../../memoryDb/partners");
const {
  addProvider,
  updateAuthProvider,
} = require("../../../memoryDb/provider");
const server = request(config.url);
const { VALIDATION_ERROR, BAD_REQUEST } = require("../helpers/error-codes");
const { getDb, closeDb} = require("../../config/db");
const {
  addQuotaGroup,
  addGroup,
  addPermissionGroup,
} = require("../../../memoryDb/group");
const { addRole } = require("../../../memoryDb/roles");
const { addUser } = require("../../../memoryDb/users");
setDefaultTimeout(50000);

let response;
let requestBody;
let token;
let orgID;
let userID;
let customerID;
let groupPermissionID;

BeforeAll(async () => {
  const { insertedId: customerId, ops: customerData } = await addCustomer();
  orgID = customerData[0].DomainName;
  customerID = customerId;
  const { insertedId: groupId } = await addGroup(customerId);
  const { insertedId: quotaGroupId } = await addQuotaGroup(customerId);
  const { insertedId: roleId } = await addRole(customerId);
  const { insertedId: groupPermissionId } = await addPermissionGroup(
    customerId,
    roleId
  );
  groupPermissionID = groupPermissionId;
  const { insertedId: userId, ops: userData } = await addUser(
    [groupId, groupPermissionId],
    [
      {
        GroupID: quotaGroupId,
        QuotaBalance: 10,
      },
    ],
    customerId,
    customerData[0].Tier,
    customerData[0].DomainName,
    "admin",
    "Test@123$"
  );
  userID = userId;
  config.userNameAuth = userData[0].Username;
  config.passwordAuth = userData[0].Password;

  const { apiKey, secretKey } = await addPartner(customerId);
  const base64String = Buffer.from(`${apiKey}:${secretKey}`, "utf8").toString(
    "base64"
  );
  token = `Basic ${base64String}`;
});

AfterAll(async () => {
  let db = await getDb();
  await db.collection("Users").deleteOne({ _id: userID });
  await closeDb();
});

// Reset variables before each scenario
Before('@RequireAuth', () => {
  response = null;
  requestBody = null;
});

Given("a request body without userName", function () {
  requestBody = {
    password: config.passwordAuth,
    identityProvider: "internal",
  };
});

Given("a request body without identityProvider", function () {
  requestBody = {
    userName: config.userNameAuth,
    password: config.passwordAuth,
  };
});

Given(
  "a request body with {string} {string} {string}",
  async function (userName, password, identityProvider) {
    if (identityProvider !== "saml") {
      const authData = await addProvider(
        customerID,
        identityProvider,
        orgID,
        groupPermissionID
      );
      await updateAuthProvider(
        { ProviderName: `${identityProvider}-test`,  AllowUserCreation: false},
        authData._id
      );
    }
    requestBody = {
      userName: userName,
      password: password,
      identityProvider: `${identityProvider}-test`,
    };
  }
);

When(/^I send a POST request to validateUser$/, (callback) => {
  server
    .post("/partner/validateUser")
    .set("authorization", token)
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
  'The HTTP response status should be 400 and the response should contain "Username is required"',
  function () {
    expect(response.statusCode).to.equal(BAD_REQUEST);
    expect(JSON.parse(response.text)).to.be.deep.equal({
      error: { code: VALIDATION_ERROR, message: "Username is required" },
      status: 0,
    });
  }
);

Then(
  'The HTTP response status should be 400 and the response should contain "Identity Provider is required"',
  function () {
    expect(response.statusCode).to.equal(BAD_REQUEST);
    expect(JSON.parse(response.text)).to.be.deep.equal({
      error: {
        code: VALIDATION_ERROR,
        message: "Identity Provider is required",
      },
      status: 0,
    });
  }
);

Then("The response status should be {int}", function (statusCode) {
  expect(response.statusCode).to.equal(statusCode);
});

Then("The response should contain {string}", function (expectedMessage) {
  const parsedResponse = JSON.parse(response.text);
  if (expectedMessage === "Success") {
    expect(parsedResponse).to.have.property("data");
    expect(parsedResponse.data).to.have.property("CustomerID");
    expect(parsedResponse.data).to.have.property("TenantDomain");
    expect(parsedResponse.data).to.have.property("Username");
    expect(parsedResponse.data).to.have.property("FirstName");
    expect(parsedResponse.data).to.have.property("LastName");
    expect(parsedResponse.data).to.have.property("PrimaryEmail");
    expect(parsedResponse.data).to.have.property("Mobile");
    expect(parsedResponse.data).to.have.property("CardNumber");
    expect(parsedResponse.data).to.have.property("Group");
  } else {
    expect(parsedResponse).to.have.property("error");
    expect(parsedResponse.error.message).to.equal(expectedMessage);
  }
});
