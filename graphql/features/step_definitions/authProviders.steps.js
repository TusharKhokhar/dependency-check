const request = require("supertest");
const {
  Given,
  When,
  Then,
  setDefaultTimeout,
  Before,
} = require("@cucumber/cucumber");
const expect = require("chai").expect;
const { config } = require("../configs/config");
const { buildIdPMetadata, getAuthProviders, getAuthProviderWithIsDeletedTag, getAuthProvider } = require("../queries/authProviders");
const { addSAMLMetaData, getAttributeByString, getAttributeByTag } = require("../../../memoryDb/systemConfigs");
const { handler } = require("../../graphql");
const { getCustomer } = require("../../../memoryDb/customer");
const { addGroup, addQuotaGroup, addPermissionGroup } = require("../../../memoryDb/group");
const { addRole } = require("../../../memoryDb/roles");
const { addProvider, getAuthProviderById, updateAuthProvider } = require("../../../memoryDb/provider");
const {addAuthProvider, AddAuthProvider, UpdateAuthProvider, addAuthProviderWithAdditionalParameters, addAuthProviderWkp} = require("../mutations/authProvider.mutation");
const {getEvent} = require("../mocks/event");

let server;
let globalResponse = {};
let defaultGroup;
let customerID;
let associatedIdentityProviderId;
let authId;
let allowedProviders;
let customerDomain
let authProviderId;
let permissionId;
const context = {};


setDefaultTimeout(100000);

server = request(config.url);

Before("@authProviders", async () => {
  await addSAMLMetaData()
  customerID = config.customerId
  const customerData = await getCustomer(customerID)
  const { insertedId: groupId } = await addGroup(customerData._id);
  defaultGroup = groupId
  const { insertedId: roleId } = await addRole(customerData._id);
  const { insertedId: groupPermissionId } = await addPermissionGroup(
    customerData._id,
    roleId
  );
  customerDomain = customerData.DomainName;
  permissionId = groupPermissionId;
  const authData = await addProvider(
    customerData._id,
    "internal",
    customerData.DomainName,
    groupPermissionId
  );
  associatedIdentityProviderId = authData._id.toString()
})

Given("a valid graphql query for buildIdPMetadata", () => {
  buildIdPMetadata.variables.customerId = customerID;
  buildIdPMetadata.variables.authProviderId = associatedIdentityProviderId;
  return buildIdPMetadata.query;
});

When("user called the buildIdPMetadata query to check metaData",async () => {
  const event = {
    version: "2.0",
    routeKey: "POST /graphql",
    rawPath: "/graphql",
    rawQueryString: "",
    headers: {
      apikey: config.apiTestKey,
      tier: config.tier,
      authorization: config.token,
      subdomain: config.domainName,
      "content-type": "application/json",
    },
    requestContext: {
      http: {
        method: "POST",
        path: "/graphql",
      },
    },
    body: JSON.stringify(buildIdPMetadata),
    isBase64Encoded: false,
  };

  const context = {data : {customerIdsStrings : [customerID]}};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
    
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
})

Given("a valid graphql query for addAuthProvider", () => {
  return addAuthProvider.query;
})

When('user called the addAuthProvider mutation to add new authProvider', async function () {
  const event = getEvent(addAuthProvider)
  const context = {};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("response should contain valid attributes in metaData", () => {
  const responseData = globalResponse.response.body;
  const bufferdata = responseData.data.buildIdPMetadata.message;
  const data = Buffer.from(bufferdata, "base64").toString("utf-8");
  const entityID = getAttributeByString(data,`entityID="`)
  const nameIDFormat = getAttributeByTag(data,`<md:NameIDFormat>`,`</md:NameIDFormat>`)
  const authnRequestsSigned = getAttributeByString(data,`AuthnRequestsSigned="`)
  const wantAssertionsSigned = getAttributeByString(data,`WantAssertionsSigned="`)

  expect(entityID).to.equal(`https://api.eprintitsaas.org`);
  expect(nameIDFormat).to.equal(`urn:oasis:names:tc:SAML:2.0:nameid-format:email`);
  expect(authnRequestsSigned).to.equal("true");
  expect(wantAssertionsSigned).to.equal("true");
  expect(globalResponse.response.statusCode).to.equal(200);
});


Given("the externalCardValidation type AuthProvider with valid input", function () {
  AddAuthProvider.variables.addAuthProviderInput.DefaultGroupID = defaultGroup
  AddAuthProvider.variables.addAuthProviderInput.CustomerID = customerID
  AddAuthProvider.variables.addAuthProviderInput.ProviderName = "externalCardValidation - success"
  AddAuthProvider.variables.addAuthProviderInput.AssociatedIdentityProvider = associatedIdentityProviderId
  return
});

Given("the AuthProvider is externalCardValidation without AssociatedIdentityProvider input", function () {
  AddAuthProvider.variables.addAuthProviderInput.DefaultGroupID = defaultGroup
  AddAuthProvider.variables.addAuthProviderInput.CustomerID = customerID
  AddAuthProvider.variables.addAuthProviderInput.ProviderName = "externalCardValidation - test"
  AddAuthProvider.variables.addAuthProviderInput.AssociatedIdentityProvider = null
  return
});

Given("user adding externalCardValidation AuthProvider with AssociatedIdentityProvider as externalCardValidation authProvider", function () {
  
  AddAuthProvider.variables.addAuthProviderInput["AssociatedIdentityProvider"] = authId;
  return AddAuthProvider.variables.addAuthProviderInput
});

Given("get AuthProviders without pagination Input", function () {
  getAuthProviders.variables.customerIds = customerID;
});

Given("get AuthProviders with pagination Input with page 1 and limit 2", function () {
  getAuthProviders.variables.customerIds = customerID;
  getAuthProviders.variables.paginationInput["pageNumber"] = 1
  getAuthProviders.variables.paginationInput["limit"] = 2
});

Given("get AuthProviders with authProviderType", function () {
  allowedProviders = ["externalCardValidation","saml"]
  getAuthProviders.variables.customerIds = customerID;
  getAuthProviders.variables.paginationInput["authProviderType"] = allowedProviders
});


When("the request is sent to addAuthProvider API", async function () {
  const event = {
    version: "2.0",
    routeKey: "POST /graphql",
    rawPath: "/graphql",
    rawQueryString: "",
    headers: {
      apikey: config.apiTestKey,
      tier: config.tier,
      authorization: config.token,
      subdomain: config.domainName,
      "content-type": "application/json",
    },
    requestContext: {
      http: {
        method: "POST",
        path: "/graphql",
      },
    },
    body: JSON.stringify(AddAuthProvider),
    isBase64Encoded: false,
  };

  const context = {data : {customerIdsStrings : [customerID]}};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
    
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
    }
});

When("the request is sent to getAuthProviders API", async function () {
  const event = {
    version: "2.0",
    routeKey: "POST /graphql",
    rawPath: "/graphql",
    rawQueryString: "",
    headers: {
      apikey: config.apiTestKey,
      tier: config.tier,
      authorization: config.token,
      subdomain: config.domainName,
      "content-type": "application/json",
    },
    requestContext: {
      http: {
        method: "POST",
        path: "/graphql",
      },
    },
    body: JSON.stringify(getAuthProviders),
    isBase64Encoded: false,
  };

  const context = {data : {customerIdsStrings : [customerID]}};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
    
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
    }
});

Then("the response should be successful", function () {
  authId = globalResponse.response.body.data.addAuthProvider._id
  expect(globalResponse.response.body.data.addAuthProvider).to.not.be.null;
});

Then("the response should return a message {string}", function (errorMessage) {
  expect(errorMessage).to.equal(globalResponse.response.body.errors[0].message);
});

Then("I should receive all AuthProviders", function () {
  expect(globalResponse.response.body.data.getAuthProviders).to.not.be.null;
});

Then("I should receive 2 or less AuthProviders", function () {
  const authProviderData = globalResponse.response.body.data.getAuthProviders.authProvider
  expect(authProviderData.length).to.lessThanOrEqual(2);
});

Then("I should receive only authProviderData mentioned in authProviderType", function () {
  const authProviderData = globalResponse.response.body.data.getAuthProviders.authProvider
  authProviderData.forEach(provider => {
    expect(allowedProviders).to.include(provider.AuthProvider);
  });
});
Then("response should be status 200 for addAuthProvider", () => {
    expect(globalResponse.response.statusCode).to.equal(200);
})

Given("a valid GraphQL mutation to add an AuthProvider with additional OIDC-specific parameters", function () {
  addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput.DefaultGroupID = defaultGroup
  addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput.CustomerID = customerID
});

When('the user invokes the addAuthProvider mutation', async function () {
  const event = getEvent(addAuthProviderWithAdditionalParameters)
  const context = {data : {customerIdsStrings : [customerID]}};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Given("a valid GraphQL mutation to update an existing AuthProvider with  additional OIDC-specific parameters",async function () {
  const authData = await addProvider(
    customerID,
    "oidc",
    "test",
    permissionId
  );

  authProviderId = authData._id.toString()

  UpdateAuthProvider.variables.updateAuthProviderInput.DefaultGroupID = defaultGroup
  UpdateAuthProvider.variables.updateAuthProviderInput.CustomerID = customerID
  UpdateAuthProvider.variables.customerId = customerID
  UpdateAuthProvider.variables.authProviderId = authProviderId
  UpdateAuthProvider.variables.updateAuthProviderInput.OpenIdConfig.MaxAge = 4500
  UpdateAuthProvider.variables.updateAuthProviderInput.OpenIdConfig.AcrValues = "urn:okta:loa:1fa:pwd"
  UpdateAuthProvider.variables.updateAuthProviderInput.OpenIdConfig.Display = "popup"
  UpdateAuthProvider.variables.updateAuthProviderInput.OpenIdConfig.Prompt = "none"
});

When('the user invokes the updateAuthProvider mutation', async function () {
  const event = getEvent(UpdateAuthProvider)
  const context = {data : {customerIdsStrings : [customerID]}};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should include the updated AuthProvider data",async () => {
  const responseData = await getAuthProviderById(authProviderId);
  
  expect(responseData.OpenIdConfig.AcrValues).to.equal("urn:okta:loa:1fa:pwd");
  expect(responseData.OpenIdConfig.Display).to.equal("popup");
  expect(responseData.OpenIdConfig.Prompt[0]).to.equal("none");
  expect(responseData.OpenIdConfig.MaxAge).to.equal(4500);
})

Given("a request to fetch AuthProviders filtered by type oidc",async function () {
  const authData = await addProvider(
    customerID,
    "oidc",
    "test",
    permissionId
  );

  authProviderId = authData._id.toString()

  await updateAuthProvider({
    "OpenIdConfig.MaxAge" : 3600,
    "OpenIdConfig.AcrValues" : "urn:okta:loa:1fa:pwd",
    "OpenIdConfig.Prompt" : ["none"],
    "OpenIdConfig.Display" : "popup",
  }, authProviderId)
});

When('the getAuthProvider API is called', async function () {
  const event = getEvent(getAuthProvider)
  const context = {data : {customerIdsStrings : [customerID]}};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should only contain AuthProvider data relevant to the OIDC type",async () => {
  const responseData = await getAuthProviderById(authProviderId);

  expect(responseData.OpenIdConfig.AcrValues).to.equal("urn:okta:loa:1fa:pwd");
  expect(responseData.OpenIdConfig.Display).to.equal("popup");
  expect(responseData.OpenIdConfig.Prompt[0]).to.equal("none");
  expect(responseData.OpenIdConfig.MaxAge).to.equal(3600);
})
Given("the AuthProvider has been deleted",  async function () {
  let authData = await addProvider(
    customerID,
    "internal",
    customerDomain,
    permissionId
  );

  await updateAuthProvider( {
    IsDeleted : true
  }, authData._id)

  getAuthProviderWithIsDeletedTag.variables.customerId = customerID;
  getAuthProviderWithIsDeletedTag.variables.authProviderId = authData._id.toString();
});

When("a request is made to the getAuthProvider API", async function () {
  const event = getEvent(getAuthProviderWithIsDeletedTag)

  const context = {data : {customerIdsStrings : [customerID]}};

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
    
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
    }
});

Then("the response should return a message saying {string}", function (message) {  
  expect(globalResponse.response.body.errors[0].message).to.be.eql(message)
});

Given("I have a valid authProvider input with isActive set to true", () => {
  AddAuthProvider.variables.addAuthProviderInput.IsActive = true
  AddAuthProvider.variables.addAuthProviderInput.DefaultGroupID = defaultGroup
  AddAuthProvider.variables.addAuthProviderInput.CustomerID = customerID
  AddAuthProvider.variables.addAuthProviderInput.ProviderName = "OIDC"
  AddAuthProvider.variables.addAuthProviderInput.AssociatedIdentityProvider = associatedIdentityProviderId
});

When("I send a request to add authProvider", async function () {
  const event = getEvent(AddAuthProvider);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of authProvider should have status code {int}",function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
}
);

Then("the response of authProvider should have isActive set to true", function () {
  const authConfiguration = globalResponse.response.body.data.addAuthProvider;
  expect(authConfiguration)
    .to.have.property("IsActive")
    .that.is.a("boolean")
    .and.is.true;
});

Given(
  "a valid GraphQL mutation to add an AuthProvider with Custom parameters",
  function () {
    addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput.DefaultGroupID = defaultGroup;
    addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput.CustomerID = customerID;
    addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput["CustomFieldsEnabled"] = true;
    addAuthProviderWithAdditionalParameters.variables.addAuthProviderInput["CustomFields"] = [
      {
        "FieldName": "tenantid",
        "FieldType": "static",
        "FieldValue": "1234"
      },
      {
        "FieldName": "fui",
        "FieldType": "dynamic",
        "FieldValue": "fui"
      }
    ];
  }
);


Given("a valid GraphQL mutation to update an existing AuthProvider with Custom parameters",async function () {
  const authData = await addProvider(
    customerID,
    "oidc",
    "test 1",
    permissionId
  );

  authProviderId = authData._id.toString()

  UpdateAuthProvider.variables.updateAuthProviderInput.DefaultGroupID = defaultGroup
  UpdateAuthProvider.variables.updateAuthProviderInput.CustomerID = customerID
  UpdateAuthProvider.variables.customerId = customerID
  UpdateAuthProvider.variables.authProviderId = authProviderId
  UpdateAuthProvider.variables.updateAuthProviderInput["CustomFieldsEnabled"] = true;
  UpdateAuthProvider.variables.updateAuthProviderInput["CustomFields"] = [
      {
        "FieldName": "tenantid",
        "FieldType": "static",
        "FieldValue": "1234"
      },
      {
        "FieldName": "fui",
        "FieldType": "dynamic",
        "FieldValue": "fui"
      }
    ];
});

Then("the response should include the updated AuthProvider data with Custom parameters",async () => {
  const responseData = await getAuthProviderById(authProviderId);
  
  expect(responseData).to.have.property("CustomFields");
  expect(responseData).to.have.property("CustomFieldsEnabled");
  expect(responseData.CustomFieldsEnabled).to.equal(true);
})

// Scenario: add wkp type AuthProvider successfully

Given("the wkp type AuthProvider with valid input", function () {
  addAuthProviderWkp.variables.addAuthProviderInput.AuthProvider = "wkp";
  return;
});

When("the request is sent to wkp addAuthProvider API", async function () {
  const event = getEvent(addAuthProviderWkp)
  const context = {data : {customerIdsStrings : [customerID]}};
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
    console.log("Response: ",response.body);
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should be successful for wkp AuthProvider", function () {
  console.log("Response for wkp AuthProvider: ",globalResponse.response.body.data);
  expect(globalResponse.response.body.data.addAuthProviderWkp).to.not.be.null;
})
