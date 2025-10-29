const { addCustomer } = require("../../../memoryDb/customer");
const { addDropdowns } = require("../../../memoryDb/dropdowns");
const { addPermissionGroup } = require("../../../memoryDb/group");
const {
  getAuthProviderLoginCredentials,
  addProvider,
} = require("../../../memoryDb/provider");
const { addRole } = require("../../../memoryDb/roles");
const { config } = require("../configs/config");
const sinon = require("sinon");
const JsonWebToken = require("jsonwebtoken");
const crypto = require('crypto')
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

async function setupTestData() {
  const { insertedId: customerId, ops: customerData } = await addCustomer();
  const orgID = customerData[0].DomainName;
  const { insertedId: roleId } = await addRole(customerId);
  const { insertedId: groupPermissionId } = await addPermissionGroup(
    customerId,
    roleId
  );

  /** Adding sip2 auth provider */
  const sip2Data = await addProvider(
    customerId,
    "sip2",
    orgID,
    groupPermissionId
  );
  const sip2LoginCreds = await getAuthProviderLoginCredentials("sip2");

  const wkpData = await addProvider(
    customerId,
    "wkp",
    orgID,
    groupPermissionId
  );
  const wkpLoginCreds = await getAuthProviderLoginCredentials("wkp");

  /** Adding sirsi auth provider */
  const sirsiData = await addProvider(
    customerId,
    "sirsi",
    orgID,
    groupPermissionId
  );
  const sirsiLoginCreds = await getAuthProviderLoginCredentials("sirsi");

  /** Adding ldap auth provider */
  const ldapData = await addProvider(
    customerId,
    "ldap",
    orgID,
    groupPermissionId
  );
  const ldapLoginCreds = await getAuthProviderLoginCredentials("ldap");

  /** Adding innovative auth provider */
  const innovativeData = await addProvider(
    customerId,
    "innovative",
    orgID,
    groupPermissionId
  );
  const innovativeLoginCreds = await getAuthProviderLoginCredentials(
    "innovative"
  );

  /** Adding polaris auth provider */
  const polarisData = await addProvider(
    customerId,
    "polaris",
    orgID,
    groupPermissionId
  );
  const polarisLoginCreds = await getAuthProviderLoginCredentials("polaris");

  /** Adding gsuite auth provider */
  const gsuiteData = await addProvider(
    customerId,
    "gsuite",
    orgID,
    groupPermissionId
  );

  /** Adding azuread auth provider */
  const azureadData = await addProvider(
    customerId,
    "azuread",
    orgID,
    groupPermissionId
  );

  /** Adding saml auth provider */
  const samlData = await addProvider(
    customerId,
    "saml",
    orgID,
    groupPermissionId
  );

  /** Adding oidc auth provider */
  const oidcData = await addProvider(
    customerId,
    "oidc",
    orgID,
    groupPermissionId
  );

  const oidcLoginCreds = await getAuthProviderLoginCredentials("oidc");

  await addDropdowns();

  const samlLoginCred = await getAuthProviderLoginCredentials("saml");

  config.customerId = customerId;
  config.customerData = customerData;
  config.orgID = orgID;
  config.sip2Data = sip2Data;
  config.sip2LoginCreds = sip2LoginCreds;
  config.wkpData = wkpData;
  config.wkpLoginCreds = wkpLoginCreds;
  config.sirsiData = sirsiData;
  config.sirsiLoginCreds = sirsiLoginCreds;
  config.ldapData = ldapData;
  config.ldapLoginCreds = ldapLoginCreds;
  config.innovativeData = innovativeData;
  config.innovativeLoginCreds = innovativeLoginCreds;
  config.polarisData = polarisData;
  config.polarisLoginCreds = polarisLoginCreds;
  config.gsuiteData = gsuiteData;
  config.roleId = roleId;
  config.groupPermissionId = groupPermissionId;
  config.azureadData = azureadData;
  config.samlData = samlData;
  config.oidcData = oidcData;

  config.sandbox = sinon.createSandbox();
  config.jwtStubDecode = config.sandbox.stub(JsonWebToken, "decode");
  config.privateDecryptStub = config.sandbox.stub(crypto, "privateDecrypt");
  config.mockAxiosInstance = new MockAdapter(axios);
  config.redirectURI = `https://demo.eprintitsaas.org`
  
  config.oidcLoginCreds = oidcLoginCreds;
  config.samlLoginCred = samlLoginCred;
  config.DomainName = "eprintitsaas.org"
}

module.exports = {
  setupTestData,
};
