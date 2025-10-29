const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { config } = require("../configs/config");
const server = request(config.url);
const sinon = require("sinon");
const { redirectLogin, redirectCallback } = require("../../controllers/common.controller");
const {
  addUser,
  findUserQuery,
  updateUser,
  deleteAllUsers,
} = require("../../../memoryDb/users");
const { getAuditLogsByType } = require("../../../memoryDb/auditLogs");
const { updateCustomer } = require("../../../memoryDb/customer");
const { updateAuthProvider, updateAuthProviderV2, getAuthProviderById } = require("../../../memoryDb/provider");

let req;

let response;
let relayStateCookie;
let orgID;
let oidcUser;
let userDetail;

let state;

Before(() => {
  if (config.privateDecryptStub && config.privateDecryptStub.reset) {
    config.privateDecryptStub.reset();
  }
});

Given(
  "a user with OrgID {string} and Tier {string} for Oidc login",
  async (orgId, tier) => {
    orgID = orgId;
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ tier });
    state = {
      authId: config.oidcData._id?.toString(),
      orgId: orgID,
      tier: "standard",
    };
    state = JSON.stringify(state);
  }
);

When("the user navigates to the Oidc login endpoint", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.oidcData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then("the application should generate the Oidc authorization URL", () => {
  expect(response.headers).to.have.property("location");
  expect(response.status).to.equal(302);
});

Given(
  "the user is redirected to the Oidc callback endpoint with a valid authorization code",
  async function () {
    config.mockAxiosInstance
      .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
      .reply(200, {
        jwks_uri: "https://jwks_uri",
        token_endpoint: "https://token_endpoint",
      });

    config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
      keys: [
        {
          kid: "test",
        },
      ],
    });

    config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
      id_token: "test_idToken",
    });

    state = {
      authId: config.oidcData._id?.toString(),
      orgId: orgID,
      tier: "standard",
    };
    state = JSON.stringify(state);

    this.req = {
      query: {
        code: "valid-token",
        state,
      },
      cookies: {
        relaySate: relayStateCookie,
        pkceToken: "pkc-token",
      },
      headers: { cookie: `pkceToken="pkc-token"` },
      path: "/callback",
    };

    this.res = {
      redirect: sinon.spy(),
    };

    config.jwtStubDecode.returns({
      header: { alg: "RS256", kid: "test" },
      payload: { sub: "mocked-user-id", email: "oidc@example.com" },
    });

    config.privateDecryptStub
      .onCall(0)
      .returns(Buffer.from(state))
      .onCall(1)
      .returns(Buffer.from("decrypted-mocked-data"));
  }
);

When(
  "the Oidc callback endpoint exchanges the code for tokens",
  async function () {
    await redirectCallback(this.req, this.res);
  }
);

Then(
  "the Oidc user is redirected to a URL that includes hashId",
  async function () {
    sinon.assert.calledOnce(this.res.redirect);
    const redirectUrl = this.res.redirect.getCall(0).args[0];
    expect(redirectUrl).to.include("hashId=");
  }
);

Given(
  "one internal user already exists in the system - OidcLogin",
  async function () {
    await deleteAllUsers();
    await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      orgID,
      "oidc@example.com"
    );
  }
);

Given("A request with invalid cookies", function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });

  state = {
    authId: config.oidcData._id?.toString(),
    orgId: orgID,
    tier: "standard",
  };
  state = JSON.stringify(state);

  this.req = {
    query: {
      code: "valid-token",
      state,
    },
    cookies: {
      relaySate: relayStateCookie,
      pkceToken: "pkc-token",
    },
    headers: {
      cookie: `pkceToken=invalid; fe_redirectURI=https://${orgID}.eprintitsaas.org`,
    },
    path: "/callback",
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: { sub: "mocked-user-id", email: "oidc@example.com" },
  });

  config.privateDecryptStub
    .onCall(0)
    .returns(Buffer.from(state))
    .onCall(1)
    .returns(Buffer.from("decrypted-mocked-data"));
});

Then(
  "The error should stored in AuditLogs collection for oidc login",
  async function () {
    const oidcLoginAuditLogs = await getAuditLogsByType("OidcLogin");
    expect(oidcLoginAuditLogs.length).to.be.greaterThan(0);
  }
);

Given("A request with invalid redirect url in common controller", function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });
  state = {
    authId: config.oidcData._id?.toString(),
    orgId: orgID,
    tier: "standard",
  };
  state = JSON.stringify(state);

  this.req = {
    query: {
      code: "valid-token",
      state,
    },
    headers: {
      cookie: `pkceToken=invalid; fe_redirectURI=https://example.com`,
    },
    path: "/auth/callback",
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: { sub: "mocked-user-id", email: "oidc@example.com" },
  });

  config.privateDecryptStub
    .onCall(0)
    .returns(Buffer.from(state))
    .onCall(1)
    .returns(Buffer.from("decrypted-mocked-data"));
});

When("The redirectCallback function is invoked", async function () {
  await redirectCallback(this.req, this.res);
});

Then('Redirect to the error URL with "Unauthorized"', function () {
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  expect(redirectUrl).to.contain(
    `https://${orgID}.eprintitsaas.org/user/sign-in?error=unauthorized`
  );
});

Given("A request without redirect url in common controller", function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });
  state = {
    authId: config.oidcData._id?.toString(),
    orgId: orgID,
    tier: "standard",
  };
  state = JSON.stringify(state);

  this.req = {
    query: {
      code: "valid-token",
      state,
    },
    headers: { cookie: `pkceToken=invalid;` },
    path: "/auth/callback",
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: { sub: "mocked-user-id", email: "oidc@example.com" },
  });

  config.privateDecryptStub.onCall(0).returns(Buffer.from(state));
});

Then(
  'Redirect to the error user-sign-in URL with "Request failed"',
  function () {
    const redirectUrl = this.res.redirect.getCall(0).args[0];
    expect(redirectUrl).to.contain(
      `https://${orgID}.eprintitsaas.org/user/sign-in?error=Request failed`
    );
  }
);

When("the user logs in using Oidc SSO", async function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });

  this.req = {
    query: {
      code: "valid-token",
      state,
    },
    cookies: {
      relaySate: relayStateCookie,
      pkceToken: "pkc-token",
    },
    headers: { cookie: `pkceToken="pkc-token"` },
    path: "/callback",
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: { sub: "mocked-user-id", email: "oidc@example.com" },
  });

  config.privateDecryptStub
    .onCall(0)
    .returns(Buffer.from(state))
    .onCall(1)
    .returns(Buffer.from("decrypted-mocked-data"));

  await redirectCallback(this.req, this.res);
});

Then("it should create new user with Oidc provider", async function () {
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  const hashId = redirectUrl.split("hashId=")[1];
  const userData = await findUserQuery({ HashID: hashId });
  expect(userData.AuthProviderID.toString()).to.be.equal(
    config.oidcData._id.toString()
  );
});

Given("one Oidc user already exists in the system", async function () {
  await deleteAllUsers();
  const { ops: userData } = await addUser(
    [config.groupPermissionId],
    [],
    config.customerId,
    "standard",
    orgID,
    "oidc@example.com"
  );
  await updateUser({ AuthProviderID: config.oidcData._id }, userData[0]._id);
  oidcUser = await findUserQuery({ Username: "oidc@example.com" });
});

Then("it should not create new Oidc user", async function () {
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  const hashId = redirectUrl.split("hashId=")[1];
  const newOidcUser = await findUserQuery({ HashID: hashId });

  expect(oidcUser.Username).to.be.equal(newOidcUser.Username);

  expect(oidcUser.AuthProviderID.toString()).to.be.equal(
    newOidcUser.AuthProviderID.toString()
  );
});

Given("A request with redirect error url in common controller", function () {});

When(
  "The redirectCallback function is invoked with redirect url",
  async function () {
    config.mockAxiosInstance
      .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
      .reply(200, {
        jwks_uri: "https://jwks_uri",
        token_endpoint: "https://token_endpoint",
      });

    config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
      keys: [
        {
          kid: "test",
        },
      ],
    });

    config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
      id_token: "test_idToken",
    });
    state = {
      authId: config.oidcData._id?.toString(),
      orgId: orgID,
      tier: "standard",
    };
    state = JSON.stringify(state);

    this.req = {
      query: {
        code: "valid-token",
        state,
      },
      headers: {
        cookie: `pkceToken=invalid; fe_redirectURI=https://${orgID}.eprintitsaas.org`,
      },
      path: "/auth/callback",
    };

    this.res = {
      redirect: sinon.spy(),
    };

    config.jwtStubDecode.returns({
      header: { alg: "RS256", kid: "test" },
      payload: { sub: "mocked-user-id", email: "oidc@example.com" },
    });

    config.privateDecryptStub.onCall(0).returns(Buffer.from(state));

    await redirectCallback(this.req, this.res);
  }
);

Then('Redirect to the error URL with "Request failed"', function () {
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  expect(redirectUrl).to.include("?error=Request failed");
});

// Scenario: OIDC Login with Valid Additional scope
Given(
  "a user with OrgID {string} and Tier {string} for Oidc login with additional scope",
  async (orgId, tier) => {
    orgID = orgId;
    let updateObj = {
      OpenIdConfig: {
        ...config.oidcData.OpenIdConfig,
        AdditionalScope: "offline_access",
      },
      AuthProvider: "oidc",
    };

    await updateAuthProvider(updateObj, config.oidcData._id);
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ orgId, tier });
  }
);

When("The OIDC configuration with valid additional scope", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.oidcData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then(
  "The final scope should be 'openid profile email offline_access'",
  async () => {
    const redirectUri = response.header.location;

    // Parse the query parameters from the redirect URI
    const url = new URL(redirectUri);
    const queryParams = new URLSearchParams(url.search);

    const expectedScope = ["openid", "profile", "email", "offline_access"]
      .sort()
      .join(" ");

    expect(queryParams.get("scope").split(" ").sort().join(" ")).to.equal(
      expectedScope
    );
  }
);

/*
Scenario: OIDC login with a valid additional scope, using one identical key and one different key
*/
Given(
  "a user with OrgID {string} and Tier {string} for Oidc login with identical key",
  async (orgId, tier) => {
    orgID = orgId;
    let updateObj = {
      OpenIdConfig: {
        ...config.oidcData.OpenIdConfig,
        AdditionalScope: "email offline_access",
      },
      AuthProvider: "oidc",
    };

    await updateAuthProvider(updateObj, config.oidcData._id);
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ tier });
  }
);

/*
Scenario: OIDC login with a null additional scope
*/
Given(
  "a user with OrgID {string} and Tier {string} for Oidc login null additional scope",
  async (orgId, tier) => {
    orgID = orgId;
    let updateObj = {
      OpenIdConfig: { ...config.oidcData.OpenIdConfig, AdditionalScope: "" },
      AuthProvider: "oidc",
    };

    await updateAuthProvider(updateObj, config.oidcData._id);
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ tier });
  }
);

When("The OIDC configuration with null additional scope", async () => {
  response = await server
    .get(
      `/auth/login?authId=${config.oidcData._id}&orgId=${orgID}&redirectURI=${config.redirectURI}`
    )
    .set("Cookie", `relaySate=${relayStateCookie}`);
});

Then("The final scope should be 'openid profile email'", async () => {
  const redirectUri = response.header.location;

  const url = new URL(redirectUri);
  const queryParams = new URLSearchParams(url.search);

  const expectedScope = ["openid", "profile", "email"].sort().join(" ");

  expect(queryParams.get("scope").split(" ").sort().join(" ")).to.equal(
    expectedScope
  );
});

// Scenario: OIDC SSO login with an existing OIDC user
Given(
  "an OIDC user already exists in the system and is logged in",
  async function () {
    await deleteAllUsers();
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.oidcData.OrgID,
      "oidc@example.com",
      "1234"
    );
    userDetail = userData[0];
    await updateUser(
      { AuthProviderID: config.oidcData._id, GenerationTimestamp: Date.now() },
      userDetail._id
    );
  }
);

When("the user logs in with a valid OIDC SSO", async function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });

  this.req = {
    query: {
      code: "valid-token",
      state,
    },
    cookies: {
      relaySate: relayStateCookie,
      pkceToken: "pkc-token",
    },
    headers: { cookie: `pkceToken="pkc-token"` },
    path: "/callback",
  };

  this.res = {
    redirect: sinon.spy(),
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: {
      sub: "mocked-user-id",
      email: "oidc@example.com",
      name: userDetail.Username,
      nickname: "johnd",
      preferred_username: "johndoe",
      given_name: "John",
      family_name: "Doe",
    },
  });

  config.privateDecryptStub
    .onCall(0)
    .returns(Buffer.from(state))
    .onCall(1)
    .returns(Buffer.from("decrypted-mocked-data"));

  await redirectCallback(this.req, this.res);
});

Then("the system should update the OIDC user information", async function () {
  sinon.assert.calledOnce(this.res.redirect);
  const userData = await findUserQuery({ PrimaryEmail: "oidc@example.com" });
  expect(userData.FirstName.toString()).to.be.equal("John");
  expect(userData.LastName.toString()).to.be.equal("Doe");
});

Given(
  "a user with OrgID {string} and Tier {string} for Oidc login for additional request parameters",
  async function (orgId, tier) {
    orgID = orgId;
    let authData = await getAuthProviderById(config.oidcData._id);

      authData.OpenIdConfig = { ...config.oidcData.OpenIdConfig, AdditionalScope: "",
        MaxAge : 3600,
        AcrValues : "urn:okta:loa:1fa:pwd",
        Prompt : ["none"],
        Display : "popup",
        NonceEnabled: true
      },

    await updateAuthProviderV2(authData, config.oidcData._id);
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ tier });
  
    await deleteAllUsers();
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.oidcData.OrgID,
      "oidc@example.com",
      "1234"
    );
    userDetail = userData[0];
    await updateUser(
      { AuthProviderID: config.oidcData._id, GenerationTimestamp: Date.now() },
      userDetail._id
    );
  }
);

When("user initiates Oidc SSO login", async function () {
  config.mockAxiosInstance
    .onGet(config.oidcData.OpenIdConfig.DiscoveryDocument)
    .reply(200, {
      jwks_uri: "https://jwks_uri",
      token_endpoint: "https://token_endpoint",
    });

  config.mockAxiosInstance.onGet(`https://jwks_uri`).reply(200, {
    keys: [
      {
        kid: "test",
      },
    ],
  });

  config.mockAxiosInstance.onPost(`https://token_endpoint`).reply(200, {
    id_token: "test_idToken",
  });

  this.req = {
    query: {
      code: "valid-token",
        authId: config.oidcData._id?.toString(), 
        orgId: orgID, 
        redirectURI: config.redirectURI
    },
    cookies: {
      relaySate: relayStateCookie,
      pkceToken: "pkc-token",
    },
    headers: { cookie: `pkceToken="pkc-token"` },
    path: "/callback",
  };

  this.res = {
    redirect: sinon.spy(),
    setHeader: sinon.stub()
  };

  config.jwtStubDecode.returns({
    header: { alg: "RS256", kid: "test" },
    payload: {
      sub: "mocked-user-id",
      email: "oidc@example.com",
      name: userDetail.Username,
      nickname: "johnd",
      preferred_username: "johndoe",
      given_name: "John",
      family_name: "Doe",
    },
  });

  config.privateDecryptStub
    .onCall(0)
    .returns(Buffer.from("decrypted-mocked-data"));

  await redirectLogin(this.req, this.res);
});

Then("the application should generate the Oidc authorization URL with additional request parameters", async function () {
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  expect(redirectUrl).to.include("max_age");
  expect(redirectUrl).to.include("nonce");
  expect(redirectUrl).to.include("acr_values");
  expect(redirectUrl).to.include("display");
  expect(redirectUrl).to.include("prompt");
});

Given(`a user with OrgID {string} and Tier {string} for Oidc login with Custom parameters`, async function (orgId, tier) {
    orgID = orgId;
    let authData = await getAuthProviderById(config.oidcData._id);
      authData["CustomFieldsEnabled"] = true;
      authData["CustomFields"] = [
        {
          FieldName: "tenantId",
          FieldValue: "12345",
          FieldType: "static",
        },
        {
          FieldName: "fui",
          FieldValue: "123",
          FieldType: "static",
        }
      ];

    await updateAuthProviderV2(authData, config.oidcData._id);
    await updateCustomer({ DomainName: orgId }, config.customerId);
    relayStateCookie = JSON.stringify({ tier });
  
    await deleteAllUsers();
    const { ops: userData } = await addUser(
      [config.groupPermissionId],
      [],
      config.customerId,
      "standard",
      config.oidcData.OrgID,
      "oidc@example.com",
      "1234"
    );
    userDetail = userData[0];
    await updateUser(
      { AuthProviderID: config.oidcData._id, GenerationTimestamp: Date.now() },
      userDetail._id
    );
  }
);

Then("the application should generate the Oidc authorization URL with Custom Parameter", async function () {
  sinon.assert.calledOnce(this.res.redirect);
  const redirectUrl = this.res.redirect.getCall(0).args[0];
  
  expect(redirectUrl).to.include("tenantId");
  expect(redirectUrl).to.include("fui");
});
