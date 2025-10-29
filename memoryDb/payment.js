const { getDb } = require("../publicAuth/config/db");
const collectionName = "Payments";
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");
const config = require("../publicAuth/config/config");

module.exports = {
  addPayment: async (customerId, paymentType) => {
    const db = await getDb();
    const now = moment().toDate();

    const paymentData = {
      CustomerID: ObjectId.createFromHexString(customerId),
      PaymentType: paymentType,
      PaymentName: `${paymentType.toLowerCase()}-${faker.word.adjective()}-${faker.word.noun()}`,
      Description: null,
      Tags: ["Test"],
      Enabled: null,
      Braintree: null,
      Stripe: null,
      Pay88: {
        PaymentId: "1",
        MerchantCode: "111111",
        SecretKey: config.apiKey.web,
        Endpoint: "https://test.ipay88.com.my/epayment/entry.asp",
        ResponseUrlPrefix: "https://test.eprintitsaas.org",
      },
      Paytm: null,
      Heartland: null,
      eGHL: null,
      Moneris: null,
      Xendit: null,
      AuthorizeNet: null,
      IsDeleted: false,
      IsActive: true,
      CreatedAt: now,
      UpdatedAt: now,
    };

    const result = await db.collection(collectionName).insertOne(paymentData);
    paymentData._id = result.insertedId;

    return { insertedId: result.insertedId, device: paymentData };
  },
};
