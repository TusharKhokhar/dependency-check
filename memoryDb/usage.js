const { getDb } = require("../publicAuth/config/db");
const collectionName = "Usage";
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");

module.exports = {
  addUsageData: async (type, customerId, userName, paperSize, paymentType = "Account", documentName = "dummy.pdf") => {
    const db = await getDb();
    const usageData = {
      Type: type,
      TransactionDate: new Date(),
      TransactionStartTime: new Date(),
      TransactionEndTime: new Date(),
      TransactionID: faker.string.uuid(),
      TimeZone: "Asia/Kolkata",
      Customer: faker.company.name(),
      CustomerID: customerId,
      Location: faker.location.city(),
      LocationID: ObjectId.createFromHexString(),
      CurrencyCode: faker.finance.currencyCode(),
      Thing: faker.word.sample(),
      ThingID: ObjectId.createFromHexString(),
      BarcodeNumber: faker.number.int(),
      FullName: faker.person.fullName(),
      EmailAddress: faker.internet.email(),
      Group: faker.word.sample(),
      GroupID: ObjectId.createFromHexString(),
      Print: {
        JobDeliveryMethod: "web",
        PrintJobSubmitted: new Date(),
        Device: "HP_2560_Adult_Area_updated",
        DeviceID: ObjectId.createFromHexString(),
        DocumentName: documentName,
        SystemFileName: "8bc57657-b459-47ba-a30b-c2f4627c7257.pdf",
        TotalCost: 0,
        GrayscaleCost: 0,
        ColorCost: 0,
        TotalPages: 1,
        GrayscalePages: 0,
        ColorPages: 1,
        Copies: 1,
        Orientation: "portrait",
        PaperSize: paperSize,
        Duplex: false,
        ColorType: "Color",
        JobPrinted: true,
        Staple: "none",
        JobPrintedBy: "56144515",
        JobPrintedFrom: "Ricoh Browser Test",
        PrintCancelled: false,
        JobType: "Print",
        PaymentType: paymentType,
        DocumentType: "pdf",
      },
      Username: userName ? userName : faker.internet.userName(),
      UserID: ObjectId.createFromHexString(),
      ReleaseCode: faker.number.int({ max: 99999999 }),
      BillingAccountId: faker.string.uuid(),
      BillingAccountName: faker.lorem.words(),
      IsDeleted: false
    };
    const { insertedId } = await db
      .collection(collectionName)
      .insertOne(usageData);
    const data = await db.collection(collectionName).findOne({ _id: insertedId });
    return { insertedId, data };
  },

  createAddValueUsageData: async (customerId, userName, ValueAddedMethod, valueAddedBy = "Self") => {
    const db = await getDb();
    const usageData = {
      Type: "add_value",
      TransactionDate: new Date(),
      TransactionStartTime: new Date(),
      TransactionEndTime: new Date(),
      TransactionID: faker.string.uuid(),
      TimeZone: "Asia/Calcutta",
      Customer: faker.company.name(),
      CustomerID: customerId,
      Location: faker.location.city(),
      LocationID: ObjectId.createFromHexString(),
      CurrencyCode: faker.finance.currencyCode(),
      Thing: faker.word.sample(),
      ThingID: ObjectId.createFromHexString(),
      BarcodeNumber: faker.number.int(),
      FullName: faker.person.fullName(),
      EmailAddress: faker.internet.email(),
      Group: faker.word.sample(),
      GroupID: ObjectId.createFromHexString(),
      Print: null,
      Username: userName ? userName : faker.internet.userName(),
      UserID: ObjectId.createFromHexString(),
      ReleaseCode: faker.number.int({ max: 99999999 }),
      BillingAccountId: faker.string.uuid(),
      BillingAccountName: faker.lorem.words(),
      IsDeleted: false,
      AddValue: {
        UpdatedBalance: 2,
        AddValueAmount: 1,
        SelfAdded: true,
        ThingID: null,
        ThingName: null,
        ValueAdded: true,
        ValueAddedBy: valueAddedBy,
        ValueAddedByID: customerId,
        StartingBalance: 1,
        PaymentMethod: "Stripe",
        ValueAddedMethod: ValueAddedMethod
      }
    };
    const { insertedId } = await db
      .collection(collectionName)
      .insertOne(usageData);
    const data = await db.collection(collectionName).findOne({ _id: insertedId });
    return { insertedId, data };
  },
  
  updateUsage: async (updateObject, usageId) => {
    const db = await getDb();
    await db.collection(collectionName).updateOne(
      { _id: ObjectId.createFromHexString(usageId) },
      {
        $set: updateObject,
      }
    );
  },
};
