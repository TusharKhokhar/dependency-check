const { getDb } = require("../publicAuth/config/db");
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");

const collectionName = "AuthProviders";

module.exports = {
  addAuthProvider: async (customerId, createdBy, defaultGroupId = null) => {
    const db = await getDb();
    const now = moment().toISOString();

    const authProviderData = {
      CustomerID: ObjectId.createFromHexString(customerId),
      ProviderName: "Internal User",
      OrgID: "sot",
      AuthProvider: "internal",
      SamlConfig: null,
      OpenIdConfig: null,
      DefaultGroupID: defaultGroupId
        ? ObjectId.createFromHexString(defaultGroupId)
        : faker.string.uuid(),
      LdapConfig: null,
      AadConfig: null,
      GSuiteConfig: null,
      SirsiConfig: null,
      InnovativeConfig: null,
      PolarisConfig: null,
      InternalLoginConfig: {
        UsernameLabel: "Username",
        PasswordLabel: "Password",
      },
      ExternalCardValidationConfig: null,
      AssociatedIdentityProvider: "",
      Mappings: {
        Username: "",
        PrimaryEmail: "",
        FirstName: "",
        LastName: "",
        CardNumber: "",
        Mobile: "",
        GroupName: "",
        Account: "",
      },
      GroupId: null,
      CustomerData: null,
      IsDeleted: false,
      Tags: ["Do not delete"],
      LabelText: "Internal User",
      DefaultGroupName: null,
      TokenExpiry: 10,
      CreatedBy: ObjectId.createFromHexString(createdBy),
      Sip2Config: null,
      DisplayOnPortal: true,
      CreatedAt: now,
      UpdatedAt: now,
      IsActive: true,
      UpdatedBy: ObjectId.createFromHexString(createdBy),
    };

    const result = await db
      .collection(collectionName)
      .insertOne(authProviderData);
    authProviderData._id = result.insertedId;
    return { insertedId: result.insertedId, ops: [authProviderData] };
  },
};
