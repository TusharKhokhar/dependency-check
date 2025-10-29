const { getDb } = require('../publicAuth/config/db');
const collectionName = 'Networks';
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");

module.exports = {
    addNetwork: async (customerId, createdBy) => {
        const db = await getDb();
        const networkData = {
            "CustomerID": ObjectId.createFromHexString(customerId),
            "ThirdPartySoftwareType": "NetworkIntegration",
            "CustomerID": "640f3002990d30e56686bd77",
            "Server": "dev",
            "path": "test.org",
            "Password": "",
            "Username": "Sppanya",
            "Tags": "testbdd",
            "CreatedAt": moment().toISOString(),
            "UpdatedAt": moment().toISOString(),
            "CreatedBy": ObjectId.createFromHexString(createdBy),
            "IsActive": true,
        };
        const data = await db.collection(collectionName).insertOne(networkData);
        networkData._id = data.insertedId;
        return { insertedId: data.insertedId, ops: [networkData] };
    }
};