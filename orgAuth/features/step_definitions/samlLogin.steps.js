const { Given, When, Then, BeforeAll, After } = require("@cucumber/cucumber");
const { updateCustomer } = require("../../../memoryDb/customer");
const { config } = require("../configs/config");
const request = require("supertest");
const { expect } = require("chai");
const { samlCallbackHandler } = require("../../controllers/common.controller");
const sinon = require("sinon");
const server = request(config.url);
const saml2 = require("saml2-js");
const {
  addUser,
  findUserQuery,
  deleteAllUsers,
  updateUser,
} = require("../../../memoryDb/users");
let response;
let relayStateCookie;
let orgID;
let authId;
let spMock;
let req, authCollectionMock, dbMock;
let userDetail;

const dbConfig = require("../../config/db");



BeforeAll(() => {

  // Define the mock saml_response
  const mockSamlResponse = {
    user: {
      name_id: "testSaml@example.com",
      attributes: {
        email: ["testSaml@example.com"],
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/username": [
          "testSaml@example.com",
        ],
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email": [
          "testSaml@example.com",
        ],
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/first": ["test"],
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/last": ["last"],
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groupname": [
          "testgroup",
        ],
      },
    },
  };

  spMock = {
    post_assert: config.sandbox.stub().callsFake((idp, options, callback) => {
      callback(null, mockSamlResponse);
    }),
  };

  config.sandbox
    .stub(saml2.ServiceProvider.prototype, "post_assert")
    .callsFake(spMock.post_assert);

  this.sp = spMock;

});


Given(
  "a user with OrgID {string} and Tier {string} for Saml login",
  async (orgId, tier) => {
    orgID = orgId;
    authId = config.samlData._id;
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ orgId, tier, authId });
  }
);

When("the user navigates to the Saml login endpoint", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.samlData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then("the application should generate the Saml authorization URL", () => {
  expect(response.headers).to.have.property("location");
  expect(response.status).to.equal(302);

  const [baseUrl, queryString] = response.headers.location.split("?");
  expect(baseUrl).to.equal(
    "https://dev-50332992.okta.com/app/dev-50332992_saastest_1/exkewjtaymCAb35Qm5d7/sso/saml"
  );
});

Given(
  "the user is redirected to the Saml callback endpoint with a valid authorization code",
  async function () {
    this.req = {
      query: {
        code: "valid-token",
        state: "valid-state",
        authId: config.samlData._id.toString(),
        orgId: orgID,
        tier: "standard",
      },
      cookies: {
        authstate: "valid-state",
        relaySate: relayStateCookie,
      },
      headers: { cookie: `relaySate=${relayStateCookie}` },
      body: {
        RelayState: relayStateCookie,
      },
    };

    this.res = {
      redirect: sinon.spy(),
    };
  }
);

When(
  "the Saml callback endpoint exchanges the code for tokens",
  async function () {
    await samlCallbackHandler(this.req, this.res);
  }
);

Then(
  "the Saml user is redirected to a URL that includes hashId",
  async function () {
    let user = null;
    const maxRetries = 5; // Number of times to check
    for (let i = 0; i < maxRetries; i++) {
      user = await findUserQuery({ AuthProviderID: config.samlData._id });
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
  "one internal user already exists in the system - SamlLogin",
  async function () {
    await deleteAllUsers();
    await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      orgID,
      "testSaml@example.com"
    );
  }
);

When("the user logs in using Saml SSO", async function () {
  const relayStateData = JSON.stringify({
    orgId: config.samlData.OrgID,
    tier: "standard",
    feRedirectURI: "https://frontend.example.com",
    authId: config.samlData._id.toString(),
  });
  this.req = {
    query: {
      code: "valid-token",
      state: "valid-state",
      authId: config.samlData._id.toString(),
      orgId: orgID,
      tier: "standard",
    },
    cookies: {
      authstate: "valid-state",
      relaySate: relayStateData,
    },
    headers: { cookie: `relaySate=${relayStateData}` },
    body: {
      RelayState: relayStateData,
    },
  };

  this.res = {
    redirect: sinon.spy(),
  };

  await samlCallbackHandler(this.req, this.res);
});

Then("it should create new user with Saml provider", async function () {
  let user = null;
  const maxRetries = 5; // Number of times to check
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ AuthProviderID: config.samlData._id });
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  expect(user).to.not.be.null;
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  const hashId = redirectUrl.split("hashId=")[1];
  const userData = await findUserQuery({ HashID: hashId });
  expect(userData.AuthProviderID.toString()).to.be.equal(
    config.samlData._id.toString()
  );
});


Given("A request with redirect error url in saml callback", function () {
  req = {
    body: {
      RelayState: JSON.stringify({
        authId: config.samlData._id?.toString(),
        orgId: config.orgID,
        tier: "standard",
        redirectURI: `https://${config.orgID}.eprintitsaas.org`,
      }),
    },
  };

  authCollectionMock = {
    findOne: config.sandbox.stub().rejects("error"),
  };

  dbMock = {
    collection: config.sandbox.stub().callsFake((collectionName) => {
      if (collectionName === "AuthProviders") return authCollectionMock;
    }),
  };

  sinon.stub(dbConfig, "getDb").returns(dbMock);

});

When("The samlCallbackHandler function is invoked", async function () {
  response = {
    redirect: sinon.spy(),
    headersSent: false,
    res: {
      headers: {
        location: `https://${config.orgID}.eprintitsaas.org/user/sign-in?error=internal_server_error&authType=saml`,
      },
    },
  };

  await samlCallbackHandler(req, response);
});

Then(
  'Redirect request to the user-sign-in error URL with "internal_server_error"',
  function () {
    expect(response.redirect.calledOnce).to.be.true;
    expect(response.res.headers.location).to.contain(
      `https://${config.orgID}.eprintitsaas.org/user/sign-in?error=internal_server_error&authType=saml`
    );
  }
);

Given(
  "one Saml user already exists in the system",
  async function () {
    await deleteAllUsers();
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.samlData.OrgID,
      "testSaml@example.com"
    )
    userDetail = userData[0];
    await updateUser({ AuthProviderID: config.samlData._id, GenerationTimestamp: Date.now() }, userDetail._id);
  }
);

Then("the system should update the Saml user information",async function () {
  let user = null;
  const maxRetries = 5; // Number of times to check
  for (let i = 0; i < maxRetries; i++) {
    user = await findUserQuery({ PrimaryEmail: "testSaml@example.com" });
    if (user) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  sinon.assert.calledOnce(this.res.redirect);
  expect(user.FirstName.toString()).to.be.equal("test");
  expect(user.LastName.toString()).to.be.equal("last");
  }
);