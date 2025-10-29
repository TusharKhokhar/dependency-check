const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const { updateAuthProvider } = require("../../../memoryDb/provider");
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs");
const {  addUser, findUserQuery, updateUser } = require("../../../memoryDb/users");
const server = request(config.url);
const sinon = require("sinon");
const { Client } = require('ldapts');
const { loginHandler } = require("../../controllers/common.controller");

let response;
let requestBody = {};
let userDetail;

let ldapResponse;

const sandbox = sinon.createSandbox();

Before('@LdapLogin', async () => {
  response = null;
  requestBody = {
    orgId: config.orgID,
    authId: config.ldapData._id,
    username: config.ldapLoginCreds.UserName,
    password: config.ldapLoginCreds.Password,
  };
});

// Helper functions for modifying the request and config
const modifyRequestBody = (modification) => {
  switch (modification) {
    case "without authId":
      delete requestBody.authId;
      break;
    case "without username or invalid username":
      requestBody.username = "xyz";
      break;
    case "invalid password":
      requestBody.password = "xyz";
      break;
    default:
      break;
  }
};

const modifyConfig = async (modification) => {
  let updateObj = {
    LdapConfig: { ...config.ldapData.LdapConfig },
    AuthProvider: "ldap",
  };
  switch (modification) {
    case "invalid Host or Port":
      updateObj.LdapConfig.Host = "Test";
      break;
    case "with invalid BindDn":
      updateObj.LdapConfig.BindDn = "Test";
      break;
    case "with invalid BindCredential":
      updateObj.LdapConfig.BindCredential = "Test";
      break;
    case "with invalid LdapBase":
      updateObj.LdapConfig.LdapBase = "Test";
      break;
    default:
      break;
  }
  await updateAuthProvider(updateObj, config.ldapData._id);
};

// Step definitions
Given("a request body {string} for ldap login", function (requestBody) {
  modifyRequestBody(requestBody);
});

Given(
  "an authProvider with invalid Host or Port for ldap login",
  async function () {
    await modifyConfig("invalid Host or Port");
  }
);

Given("an authProvider {string} for ldap login", async function (authCofig) {
  await modifyConfig(authCofig);
});


When("I send a POST request for ldap login", function (callback) {
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
  "The response status should be {int} for ldap login",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
  }
);

Then(
  "The response should contain {string} for ldap login",
  function (expectedMessage) {
    const responseBody = JSON.parse(response.text);
    expect(responseBody.error.message).to.equal(expectedMessage);
  }
);

Then(
  "The response should contain one of the messages for ldap login",
  function (dataTable) {
    const expectedMessages = dataTable.raw().flat();
    const actualMessage = JSON.parse(response.text).error.message;
    expect(expectedMessages).to.include(actualMessage);
  }
);

Then("The response should contain hashId for ldap login", function () {
  const parsedResponse = JSON.parse(response.text);
  expect(parsedResponse).to.have.property("error", null);
  expect(parsedResponse).to.have.property("data").that.is.an("object");
  expect(parsedResponse.data).to.have.property("hashId");
});

Then("The error should stored in AuditLogs collection for ldap login",async function () {
  const ldapLoginAuditLogs = await getAuditLogsByType("LdapLogin")
  expect(ldapLoginAuditLogs.length).to.be.greaterThan(0)
});

Given(
  "one user already exists in the system - ldapLogin",
  async function () {

    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.ldapData.OrgID,
      "testldap@example.com"
    );
    userDetail = userData[0];
    await updateUser(
      { AuthProviderID: config.ldapData._id, GenerationTimestamp: Date.now() },
      userDetail._id
    );

    clientStub = sinon.stub(Client.prototype, 'bind').resolves();
    sinon.stub(Client.prototype, 'unbind').resolves();
   
    ldapResponse = [{ cn: 'testldap@example.com',fn: 'test ldap', cardNumber: '123456', email :"testldap@example.com",  }];

    searchStub = sinon.stub(Client.prototype, 'search').resolves({ searchEntries: ldapResponse });
    
  }
);

When("the user log in using ldap SSO", async function () {
  const relayStateData = JSON.stringify({
    orgId: config.ldapData.OrgID,
    tier: "standard",
    feRedirectURI: "https://frontend.example.com",
  });
  this.req = {
    body: {
      code: "valid-token",
      state: "valid-state",
      authId: config.ldapData._id.toString(),
      username: "test",
      orgId: config.ldapData.OrgID,
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

  const { Protocol, Host, Port, CaCert } = config.ldapData.LdapConfig;
  const LdapConfig = {
    Protocol: Protocol,
    Host: Host,
    Port: Port,
    CaCert: CaCert
};

const tlsOptions = {
  ca: [LdapConfig.CaCert],
  rejectUnauthorized: false
};

const clientOptions = {
  url: `${LdapConfig.Protocol}://${LdapConfig.Host}:${LdapConfig.Port}`
};

if (LdapConfig.Protocol === "ldaps") {
  clientOptions.tlsOptions = tlsOptions;
}

const client = new Client(clientOptions);

await client.bind('', '');


const opts = {
  filter: `('uid'=test)`,
  scope: 'sub',
  attributes: ['*'],
};

const { searchEntries } = await client.search( 'dc=example,dc=com', opts);

this.searchResult = searchEntries; // Store for assertio

  await loginHandler(this.req, this.res);
});

Then("the system should update the ldap user information", async function () {
  let user = null;
  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ PrimaryEmail: "testldap@example.com" });
    
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  expect(user.FirstName.toString()).to.be.equal("test ldap");
});