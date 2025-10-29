const { Given, When, Then, BeforeAll } = require("@cucumber/cucumber");
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { config } = require("../configs/config");
const { updateCustomer } = require("../../../memoryDb/customer");
const server = request(config.url);
const sinon = require("sinon");
const { OAuth2Client } = require("google-auth-library");
const { redirectCallback } = require("../../controllers/common.controller");
const {
  addUser,
  deleteUser,
  findUserQuery,
  updateUser,
} = require("../../../memoryDb/users");

let response;
let relayStateCookie;
let orgID;
let oauth2ClientMock;
let gsuiteUser;
let userDetail;

const generateRandomString = (length = 10) => [...Array(length)].map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.random() * 62)).join('');

BeforeAll(() => {
  oauth2ClientMock = {
    getToken: config.sandbox.stub().resolves({
      tokens: {
        access_token: generateRandomString(),
        refresh_token: "fakeRefreshToken",
        id_token: "fakeIdToken",
      },
    }),
  };

  config.sandbox
    .stub(OAuth2Client.prototype, "getToken")
    .callsFake(oauth2ClientMock.getToken);

  this.oauth2Client = oauth2ClientMock;
});

Given("a user with OrgID {string} and Tier {string}", async (orgId, tier) => {
  orgID = orgId;
  await updateCustomer({ DomainName: orgId }, config.customerId);
  relayStateCookie = JSON.stringify({ orgId, tier });
});

When("the user navigates to the Gsuite login endpoint", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.gsuiteData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then("the application should generate the Gsuite authorization URL", () => {
  expect(response.headers).to.have.property("location");
  expect(response.status).to.equal(302);
});

Then(
  "the authorization URL should contain the following:",
  function (dataTable) {
    const [baseUrl, queryString] = response.headers.location.split("?");

    expect(baseUrl).to.equal(dataTable.rowsHash()["Base URL"]);

    const queryParams = {};
    queryString.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      queryParams[key] = decodeURIComponent(value);
    });

    const expectedValues = dataTable.rowsHash();

    expect(queryParams.access_type).to.equal(expectedValues.access_type);
    expect(queryParams.scope).to.equal(expectedValues.scope);
    expect(queryParams.prompt).to.equal(expectedValues.prompt);
    expect(queryParams.response_type).to.equal(expectedValues.response_type);
    expect(queryParams.redirect_uri).to.equal(expectedValues.redirect_uri);
  }
);

Given(
  "the user is redirected to the Gsuite callback endpoint with a valid authorization code",
  async function () {
    this.req = {
      query: {
        code: "valid-token",
        authId: config.gsuiteData._id.toString(),
        orgId: orgID,
        tier: "standard",
      },
      headers: { cookie: `relaySate=${relayStateCookie}` },
    };

    this.res = {
      redirect: sinon.spy(),
    };
  }
);

When("the callback endpoint exchanges the code for tokens", async function () {
  config.jwtStubDecode.returns({
    payload: {
      email: "test@gmail.com",
      given_name: "test_given_name",
      family_name: "test_family_name",
    },
  });

  await redirectCallback(this.req, this.res);
});

Then("the user is redirected to a URL that includes hashId", function () {
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  expect(redirectUrl).to.include("hashId=");
});

Given("one internal user already exists in the system", async function () {
  await deleteUser("test@gmail.com", orgID);
  await addUser(
    [config.groupPermissionId],
    [],
    config.customerId,
    "standard",
    orgID,
    "test@gmail.com"
  );
});

When("the user logs in using Gsuite SSO", async function () {
  const relayStateData = JSON.stringify({
    orgId: config.gsuiteData.OrgID,
    tier: "standard",
    feRedirectURI: "https://frontend.example.com",
  });
  this.req = {
    query: {
      code: "valid-token",
      authId: config.gsuiteData._id.toString(),
      orgId: config.oidcData.OrgID,
      tier: "standard",
    },
    headers: { cookie: `relaySate=${relayStateData}` },
  };

  this.res = {
    redirect: sinon.spy(),
  };
  config.jwtStubDecode.returns({
    payload: {
      email: "test@gmail.com",
      given_name: "test_given_name",
      family_name: "test_family_name",
    },
  });
  await redirectCallback(this.req, this.res);
});

Then("then it should create new user with Gsuite provider", async function () {
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  const hashId = redirectUrl.split("hashId=")[1];
  const user = await findUserQuery({ HashID: hashId });
  expect(user.AuthProviderID.toString()).to.be.equal(
    config.gsuiteData._id.toString()
  );
});

Given("one Gsuite user already exists in the system", async function () {
  await deleteUser("test@gmail.com", orgID);
  const { ops: userData } = await addUser(
    [config.groupPermissionId],
    [],
    config.customerId,
    "standard",
    config.oidcData.OrgID,
    "test@gmail.com"
  );
  userDetail = userData[0];
  await updateUser({ AuthProviderID: config.gsuiteData._id, GenerationTimestamp: Date.now() }, userDetail._id);
  gsuiteUser = await findUserQuery({ Username: "test@gmail.com" });
});

Then("then it should not create new user", async function () {
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  const hashId = redirectUrl.split("hashId=")[1];
  const newGsuitUser = await findUserQuery({ HashID: hashId });

  expect(gsuiteUser.Username).to.be.equal(newGsuitUser.Username);

  expect(gsuiteUser.AuthProviderID.toString()).to.be.equal(
    newGsuitUser.AuthProviderID.toString()
  );
});

Then("the system should update the Gsuite user information",async function () {
  sinon.assert.calledOnce(this.res.redirect);
  const userData = await findUserQuery({ PrimaryEmail: "test@gmail.com" });
  expect(userData.FirstName.toString()).to.be.equal("test_given_name");
  expect(userData.LastName.toString()).to.be.equal("test_family_name");
  }
);
