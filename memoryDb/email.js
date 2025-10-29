const { getDb } = require('../publicAuth/config/db');
const collectionName = 'Emails';
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');

module.exports = {
    addEmail: async (customerId, createdBy) => {
        const db = await getDb();
        const emailData = {
            "CustomerID": ObjectId.createFromHexString(customerId),
            "ThirdPartySoftwareType": "EmailIntegration",
            "Tags": [ "test" ],
            "SenderName": "Testuser",
            "SenderEmail": "test@example.com",
            "SMTP": "smtp.example.com",
            "Port": "587",
            "Username": "testuser",
            "DefaultSubject": "Test Subject",
            "DefaultCC": "testcc@example.com",
            "DefaultAddress": "test@example.com",
            "SSLType": "TLS",
            "LoginName": "testlogin",
            "Password": faker.lorem.word(),
            "MessageBody": "This is a test email.",
            "EmailConnection": {
                "AfterSelectingMedia": "test",
                "AfterScanning": "test",
                "BeforeSending": "test"
            },
            "EmailAuthentication": {
                "Gmail": true,
                "Microsoft": false,
                "Facebook": false
            },
            "CreatedBy": ObjectId.createFromHexString(createdBy),
            "IsDeleted": false,
            "CreatedAt": moment().toISOString(),
            "UpdatedAt": moment().toISOString(),
            "IsActive": true,
            "ThirdPartySoftwareName": "Email"
        };
        const data = await db.collection(collectionName).insertOne(emailData);
        emailData._id = data.insertedId;
        return { insertedId: data.insertedId, ops: [emailData] };
    },
};
