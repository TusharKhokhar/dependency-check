const { getDb } = require("../publicAuth/config/db");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");

module.exports = {
  addAccountSync: async (customerId, thirdPartySoftwareType) => {
    const db = await getDb();
    const accountSyncData = {
      CustomerID: customerId,
      ThirdPartySoftwareName: faker.internet.displayName(),
      ThirdPartySoftwareType: thirdPartySoftwareType,
      Tags: [],
      APIEndpoint: "https://api.example.com",
      ClientId: "clientid",
      ClientSecret: "testsecret",
      Mappings: {
        AccountID: "12345",
        AccountName: "TestAccount",
        Description: "Test mapping",
      },
      Enabled: true,
      IsDeleted: false,
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };
    const data = await db.collection("AccountSync").insertOne(accountSyncData);
    accountSyncData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [accountSyncData] };
  },
  addProton: async (customerId, thirdPartySoftwareType) => {
    const db = await getDb();
    const protonData = {
      CustomerID: customerId,
      ThirdPartySoftwareName: faker.internet.displayName(),
      ThirdPartySoftwareType: thirdPartySoftwareType,
      OcpApimSubscriptionKey: "aa",
      Tags: [],
      TokenAPIEndpoint: "https://api.example.com",
      ClientId: "clientid",
      ClientSecret: "testsecret",
      TransactionServicesAPIEndpoint: "https://anc.com/auth",
      Enabled: true,
      IsDeleted: false,
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };
    const data = await db.collection("Protons").insertOne(protonData);
    protonData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [protonData] };
  },
  addEmail: async (customerId, thirdPartySoftwareType) => {
    const db = await getDb();
    const emailData = {
      CustomerID: customerId,
      ThirdPartySoftwareName: faker.internet.displayName(),
      ThirdPartySoftwareType: thirdPartySoftwareType,
      Tags: [ "test" ],
      SenderName: "Testuser",
      SenderEmail: "test@example.com",
      SMTP: "smtp.example.com",
      Port: "587",
      Username: "testuser",
      DefaultSubject: "Test Subject",
      DefaultCC: "testcc@example.com",
      DefaultAddress: "test@example.com",
      SSLType: "TLS",
      LoginName: "testlogin",
      Password: faker.lorem.word(),
      MessageBody: "This is a test email.",
      EmailConnection: {
          AfterSelectingMedia: "test",
          AfterScanning: "test",
          BeforeSending: "test"
      },
      EmailAuthentication: {
          Gmail: true,
          Microsoft: false,
          Facebook: false
      },
      CreatedBy: ObjectId.createFromHexString(createdBy),
      IsDeleted: false,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true,
    };
    const data = await db.collection("Emails").insertOne(emailData);
    emailData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [emailData] };
  },
  addSmartphone: async (customerId, thirdPartySoftwareType) => {
    const db = await getDb();
    const smartphoneData = {
      CustomerID: customerId,
      ThirdPartySoftwareName: faker.internet.displayName(),
      ThirdPartySoftwareType: thirdPartySoftwareType,
      Tags: [],
      Pin: "12345",
      IsDeleted: false,
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };
    const data = await db.collection("Smartphones").insertOne(smartphoneData);
    smartphoneData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [smartphoneData] };
  },
  addNetwork: async (customerId, thirdPartySoftwareType) => {
    const db = await getDb();
    const networkData = {
      CustomerID: customerId,
      ThirdPartySoftwareName: faker.internet.displayName(),
      ThirdPartySoftwareType: thirdPartySoftwareType,
      Tags: [],
      Server: "dev",
      path: "test.org",
      Password: "",
      Username: "Sppanya",
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      IsActive: true,
    };
    const data = await db.collection("Networks").insertOne(networkData);
    networkData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [networkData] };
  }
};
