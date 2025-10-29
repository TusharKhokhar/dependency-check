const { getDb, getTestSecretsDb } = require("../publicAuth/config/db");
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");
const collectionName = "Things";

module.exports = {
  addThingData: async (customerId, deviceID, thingTagId) => {
    const db = await getDb();
    const thingData = {
      DisplayName: faker.company.name(),
      ThingType: "print delivery station",
      DeviceID: ObjectId.createFromHexString(deviceID),
      LocationName: "test",
      CustomerID: ObjectId.createFromHexString(customerId),
      AppVersion: null,
      OnlineStatus: null,
      Application: null,
      Enabled: null,
      IsActive: true,
      Thing: "Test Thing",
      Label: "Test Thing",
      DisplayQrCode: false,
      DefaultDevice: ObjectId.createFromHexString(deviceID),
      TimeOut: 999,
      ClearLogsAfter: 4,
      DebugLog: true,
      AutoSelectPrinter: true,
      LoginOptions: [
        {
          LoginOptionType: "Release_Code",
          LoginLabelText: "Release_Code",
          ExternalCardValidation: true,
          ExternalCardIdp: ObjectId.createFromHexString()
        },
      ],
      PaymentOptions: [
        {
          PaymentOptionType: "CBORD",
          URL: "https://test.csgold.com:8145/tran.php",
          Location: "38",
          Provider: "TEST",
          CodeAccountType: "51888",
          Class: "0500",
          Timer: 10,
          MessageBox: "This is for test.",
          MediaEntry: "010",
        },
        {
          PaymentOptionType: "Atrium",
          TerminalID: "TEST-1",
          AccountNumber: 2199,
          AccountMode: "tender",
          AtriumEndpoint: "https://test.atriumcampus.com",
        },
      ],
      AutomaticSoftwareUpdate: true,
      CreatedBy: ObjectId.createFromHexString(),
      Tags: ["TEST"],
      PJLPrint: null,
      PdfiumPrint: null,
      PrintUSBAsGuest: null,
      PrintUSBWithAccount: null,
      MultithreadPrint: null,
      ThingTagID: thingTagId,
      PromptForAccount: true,
      PrimaryRegion: {
        ThingName: "67c54aa05a63b6b6bb5883ae-1740982944272"
      },
      EmailAsReleaseCode: false,
      SerialNumber: "11",
      Firmware: "11",
      IpAddress: "0.0.0.0",
      MacAddress: "11",
      ComputerName: "11",
      IsDeleted: false
    };

    const data = await db.collection(collectionName).insertOne(thingData);
    thingData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [thingData] };
  },
};
