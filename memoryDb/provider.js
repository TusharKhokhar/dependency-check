const { getDb, getTestSecretsDb } = require("../publicAuth/config/db");
const collectionName = "AuthProviders";
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");
const {
  performEncryption,
  performDecryption
} = require("../graphql/services/authProviders/edService");
const dot = require("../graphql/node_modules/dot-object");
const { formObjectIds } = require("../graphql/helpers/util");

const internalTestConfig = {
  UsernameLabel: "Username",
  PasswordLabel: "Password",
};

module.exports = {
  addProvider: async (customerId, authProvider, orgID, defaultGroupId, providerName) => {
    const db = await getDb();
    let internalConfig = null;
    let ldapConfig = null;
    let innovativeConfig = null;
    let sirsiConfig = null;
    let samlConfig = null;
    let polarisConfig = null;
    let openIdConfig = null;
    let aadConfig = null;
    let gSuiteConfig = null;
    let sip2Config = null;
    let wkpConfig = null;
    let mappings = {
      Username: "",
      PrimaryEmail: "",
      FirstName: "",
      LastName: "",
      CardNumber: "",
      Mobile: "",
      GroupName: "",
    };
    const testSecretDB = await getTestSecretsDb();
    const configData = await testSecretDB
      .collection("AuthProvidersConfig")
      .findOne({ AuthProvider: authProvider });
    if (authProvider === "internal") {
      internalConfig = internalTestConfig;
    } else if (authProvider === "polaris") {
      polarisConfig = configData.Config;
    } else if (authProvider === "sirsi") {
      sirsiConfig = configData.Config;
    } else if (authProvider === "innovative") {
      innovativeConfig = configData.Config;
    } else if (authProvider === "saml") {
      samlConfig = configData.Config;
    } else if (authProvider === "oidc") {
      openIdConfig = configData.Config;
    } else if (authProvider === "ldap") {
      ldapConfig = configData.Config;
    } else if (authProvider === "azuread") {
      aadConfig = configData.Config;
    } else if (authProvider === "gsuite") {
      gSuiteConfig = configData.Config;
    } else if (authProvider === "sip2") {
      sip2Config = configData.Config;
    }else if (authProvider === "wkp") {
      wkpConfig = configData.Config;
    }
    mappings = authProvider === "internal" ? mappings : configData.Mappings;

    let providerData = {
      CustomerID: customerId,
      ProviderName: providerName || faker.lorem.sentence(2),
      OrgID: orgID,
      AuthProvider: authProvider,
      SamlConfig: samlConfig,
      OpenIdConfig: openIdConfig,
      LdapConfig: ldapConfig,
      AadConfig: aadConfig,
      GSuiteConfig: gSuiteConfig,
      SirsiConfig: sirsiConfig,
      InnovativeConfig: innovativeConfig,
      PolarisConfig: polarisConfig,
      InternalLoginConfig: internalConfig,
      Sip2Config: sip2Config,
      WkpConfig: wkpConfig,
      Mappings: mappings,
      GroupId: null,
      CustomerData: null,
      DefaultGroupID: defaultGroupId,
      LabelText: faker.lorem.sentence(4),
      DefaultGroupName: null,
      IsDeleted: false,
      IsActive: true,
      TokenExpiry: 24,
      CreatedBy: ObjectId.createFromHexString(),
      DisplayOnPortal: true,
    };
    if (
      authProvider === "sip2" ||
      authProvider === "polaris" ||
      authProvider === "innovative" ||
      authProvider === "sirsi" ||
      authProvider === "ldap"
    ) {
      providerData.AllowUserCreation = true;
    }
    providerData = await performEncryption(providerData);
    const { insertedId } = await db
      .collection(collectionName)
      .insertOne(providerData);
      let authData = await db.collection(collectionName).findOne({ _id: insertedId });
      authData = await performDecryption(authData)
    return authData
  },
  getAuthProviderLoginCredentials: async (authProvider) => {
    const db = await getTestSecretsDb();
    return db
      .collection("AuthCredentials")
      .findOne({ AuthProvider: authProvider });
  },
  getAuthProviderById: async (authId) => {
    const db = await getDb();
    return await db
      .collection("AuthProviders")
      .findOne({ _id : ObjectId.createFromHexString(authId) });

  },
  updateAuthProvider: async (updateAuthProviderInput, authId) => {
    const db = await getDb();
    updateAuthProviderInput = await performEncryption(updateAuthProviderInput);
    let updateObject = {};
    for (let key in updateAuthProviderInput) {
      if (Array.isArray(updateAuthProviderInput[key])) {
        updateObject[key] = updateAuthProviderInput[key];
      } else {
        const flattenedField = dot.dot({ [key]: updateAuthProviderInput[key] });
        updateObject = { ...updateObject, ...flattenedField };
      }
    }
    updateObject = formObjectIds(updateObject, true);
    return await db.collection(collectionName).updateOne(
      { _id: ObjectId.createFromHexString(authId) },
      {
        $set: updateObject,
      }
    );
  },

  //without encryption
  updateAuthProviderV2: async (updateAuthProviderInput, authId) => {
    const db = await getDb();
    return await db.collection(collectionName).updateOne(
      { _id: ObjectId.createFromHexString(authId) },
      {
        $set: updateAuthProviderInput,
      }
    )
  },
};
