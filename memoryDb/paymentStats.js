const { getDb } = require("../publicAuth/config/db");
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");

const collectionName = "PaymentStats";

module.exports = {
  addPaymentStats: async (customerId, refId, userId, paymentMethod) => {
    const db = await getDb();
    const now = moment().toDate();

    const paymentStatsData = {
      CustomerID: ObjectId.createFromHexString(customerId),
      RefId: refId,
      TransactionStartTime: now,
      Status: "initiated",
      PaymentMethod: paymentMethod,
      UserID: ObjectId.createFromHexString(userId),
      Amount: "100",
      MerchantCode: "M14820",
      Currency: "USD",
      PaymentId: "6",
    };

    const result = await db
      .collection(collectionName)
      .insertOne(paymentStatsData);
    paymentStatsData._id = result.insertedId;

    return { insertedId: result.insertedId, device: paymentStatsData };
  },
};
