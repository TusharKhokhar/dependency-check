const { getDb } = require('../publicAuth/config/db');
const collectionName = 'Smartphones';
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");

module.exports = {
    addSmartphone: async (customerId, createdBy) => {
        const db = await getDb();
        const smartphoneData = {
            "CustomerID": ObjectId.createFromHexString(customerId),
            "ThirdPartySoftwareType": "SmartphoneIntegration",
            "CustomerID": "640f3002990d30e56686bd77",
            "Pin": 12345,
            "Tags": "testbdd",
            "CreatedAt": moment().toISOString(),
            "UpdatedAt": moment().toISOString(),
            "CreatedBy": ObjectId.createFromHexString(createdBy),
            "IsActive": true,
        };
        const data = await db.collection(collectionName).insertOne(smartphoneData);
        smartphoneData._id = data.insertedId;
        return { insertedId: data.insertedId, ops: [smartphoneData] };
    }
};