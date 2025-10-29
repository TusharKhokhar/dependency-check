const { getDb } = require('../publicAuth/config/db');
const collectionName = 'Accounts';
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');

module.exports = {
    addAccounts: async (customerId, createdBy) => {
        const db = await getDb();
        const accountData = {
            "CustomerID": ObjectId.createFromHexString(customerId),
            "CustomerName": faker.lorem.sentence(),
            "AccountId": `ACC${faker.string.numeric(8)}`,
            "AccountName": faker.company.name(),
            "Description": faker.lorem.sentence(),
            "Tags": [faker.word.noun()],
            "CreatedBy": ObjectId.createFromHexString(createdBy),
            "IsDeleted": false,
            "IsActive": true,
            "CreatedAt": moment().toISOString(),
            "UpdatedAt": moment().toISOString(),
            "UpdatedBy": ObjectId.createFromHexString(createdBy)
        };
        const data = await db.collection(collectionName).insertOne(accountData);
        accountData._id = data.insertedId;
        return { insertedId: data.insertedId, ops: [accountData] };
    },
};
