const {
  Given,
  When,
  Then,
  BeforeAll
} = require("@cucumber/cucumber");
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { config } = require("../configs/config");
const { updateCustomer } = require("../../../memoryDb/customer");
const server = request(config.url);
const sinon = require("sinon");
const { redirectCallback } = require("../../controllers/common.controller");
const { ConfidentialClientApplication } = require("@azure/msal-node");
const { AZURE_AD_GRAPH_BASE_URL } = require("../../helpers/constants");
const {
  addUser,
  deleteUser,
  findUserQuery,
  updateUser,
} = require("../../../memoryDb/users");

let response;
let relayStateCookie;
let orgID;
let queryParams;
let ccaMock;
let userDetail;

const generateRandomString = (length = 10) => [...Array(length)].map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.random() * 62)).join('');

BeforeAll(() => {
  ccaMock = {
    acquireTokenByCode: config.sandbox.stub().resolves({
      accessToken: generateRandomString(),
    }),
  };

  config.sandbox
    .stub(ConfidentialClientApplication.prototype, "acquireTokenByCode")
    .callsFake(ccaMock.acquireTokenByCode);

  this.cca = ccaMock;

});


Given(
  "a user with OrgID {string} and Tier {string} for Azuread login",
  async (orgId, tier) => {
    orgID = orgId;
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ orgId, tier });
  }
);

When("the user navigates to the Azuread login endpoint", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.azureadData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then("the application should generate the Azuread authorization URL", () => {
  expect(response.headers).to.have.property("location");
  expect(response.status).to.equal(302);
});

Then(
  "the AzureadLogin authorization URL should contain the following:",
  function (dataTable) {
    const [baseUrl, queryString] = response.headers.location.split("?");
    const tenantId = config?.azureadData?.AadConfig?.TenantId;
    const expectedValues = dataTable.rowsHash();
    expectedValues.Base_URL = expectedValues.Base_URL.replace(
      "<Tenant_Id>",
      tenantId
    );
    expect(baseUrl).to.equal(expectedValues.Base_URL);

    queryParams = {};
    queryString.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      queryParams[key] = decodeURIComponent(value);
    });

    expect(queryParams.scope).to.equal(expectedValues.scope);
    expect(queryParams.response_type).to.equal(expectedValues.response_type);
    expect(queryParams.redirect_uri).to.equal(expectedValues.redirect_uri);
    expect(queryParams.response_mode).to.equal(expectedValues.response_mode);
  }
);

Given(
  "the user is redirected to the Azuread callback endpoint with a valid authorization code",
  async function () {
    this.req = {
      query: {
        code: "valid-token",
        state: "valid-state",
        authId: config.azureadData._id.toString(),
        orgId: orgID,
        tier: "standard",
      },
      cookies: {
        authstate: "valid-state",
        relaySate: relayStateCookie,
      },
      headers: { cookie: `relaySate=${relayStateCookie}` },
    };

    this.res = {
      redirect: sinon.spy(),
    };

    config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me`).reply(200, {
      id: "12345",
      displayName: "Test User",
      mail: "test@example.com",
    });

    config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me/memberOf`).reply(200, {
      value: [
        {
          id: "group-1",
          displayName: "Admin Group",
        },
        {
          id: "group-2",
          displayName: "User Group",
        },
      ],
    });

    config.privateDecryptStub.returns(Buffer.from("decrypted-mocked-data"))
  }
);

When(
  "the Azuread callback endpoint exchanges the code for tokens",
  async function () {
    await redirectCallback(this.req, this.res);
  }
);

Then(
  "the Azuread user is redirected to a URL that includes hashId",
  async function () {
    let user = null;
    const maxRetries = 40;
    for (let i = 0; i < maxRetries; i++) {
      user = await findUserQuery({ AuthProviderID: config.azureadData._id });
      if (user) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(user).to.not.be.null;
    sinon.assert.calledOnce(this.res.redirect);
    const redirectUrl = this.res.redirect.getCall(0).args[0];
    expect(redirectUrl).to.include("hashId=");
  }
);

Given(
  "one internal user already exists in the system - AzureadLogin",
  async function () {
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.azureadData.OrgID,
      "test@example.com"
    );
    userDetail = userData[0];
    await updateUser({ AuthProviderID: config.azureadData._id, GenerationTimestamp: Date.now() }, userDetail._id);
  }
);

When("the user logs in using Azuread SSO", async function () {
  this.req = {
    query: {
      code: "valid-token",
      state: "valid-state",
      authId: config.azureadData._id.toString(),
      orgId: orgID,
      tier: "standard",
    },
    cookies: {
      authstate: "valid-state",
      relaySate: relayStateCookie,
    },
    headers: { cookie: `relaySate=${relayStateCookie}` },
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.privateDecryptStub.returns(Buffer.from("decrypted-mocked-data"))

  config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me`).reply(200, {
    id: "12345",
    displayName: "Test User",
    mail: "test@example.com",
  });

  config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me/memberOf`).reply(200, {
    value: [
      {
        id: "group-1",
        displayName: "Admin Group",
      },
      {
        id: "group-2",
        displayName: "User Group",
      },
    ],
  });

  await deleteUser("test@example.com", orgID);

  await redirectCallback(this.req, this.res);
});

Then("it should create new user with Azuread provider", async function () {
  let user = null;
  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ AuthProviderID: config.azureadData._id });
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  expect(user).to.not.be.null;
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  expect(redirectUrl).to.include("hashId=");
  const hashId = redirectUrl.split("hashId=")[1];
  const userData = await findUserQuery({ HashID: hashId });
  expect(userData.AuthProviderID.toString()).to.be.equal(
    config.azureadData._id.toString()
  );
});

When("the user log in using Azuread SSO", async function () {
  const relayStateData = JSON.stringify({
    orgId: config.azureadData.OrgID,
    tier: "standard",
    feRedirectURI: "https://frontend.example.com",
  });
  this.req = {
    query: {
      code: "valid-token",
      state: "valid-state",
      authId: config.azureadData._id.toString(),
      orgId: config.azureadData.OrgID,
      tier: "standard",
    },
    cookies: {
      authstate: "valid-state",
      relaySate: relayStateData,
    },
    headers: { cookie: `relaySate=${relayStateData}` },
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.privateDecryptStub.returns(Buffer.from("decrypted-mocked-data"))

  config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me`).reply(200, {
    displayName: "Test User",
    mail: "test@example.com",
  });

  config.mockAxiosInstance.onGet(`${AZURE_AD_GRAPH_BASE_URL}/me/memberOf`).reply(200, {
    value: [
      {
        id: "group-1",
        displayName: "Admin Group",
      },
      {
        id: "group-2",
        displayName: "User Group",
      },
    ],
  });

  await redirectCallback(this.req, this.res);
});

Then("the system should update the Azuread user information",async function () {
  let user = null;
  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ FirstName: "Test" });
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  expect(user.FirstName.toString()).to.be.equal("Test");
  }
);