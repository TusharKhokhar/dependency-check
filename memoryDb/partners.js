const { getDb } = require("../publicAuth/config/db");
const collectionName = "PartnersAccess";
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const bcrypt = require("../publicAuth/node_modules/bcryptjs");
const { v4: uuid } = require("../publicAuth/node_modules/uuid");

module.exports = {
  addPartner: async (customerId) => {
    const db = await getDb();
    const apiKey = uuid();
    const newSecret = uuid();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newSecret, salt);
    const partnerData = {
      ApiKey: apiKey,
      Secret: hash,
      CustomerID: customerId,
      IsActive: true,
      IsDeleted: false,
      Read: true,
      Write: true,
      CreatedBy: ObjectId.createFromHexString(),
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };
    await db.collection(collectionName).insertOne(partnerData);
    return { apiKey, secretKey: newSecret };
  },
};
