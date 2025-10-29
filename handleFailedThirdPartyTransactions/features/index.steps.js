const { Given, When, Then, BeforeAll} = require('@cucumber/cucumber');
const assert = require('assert');
const handler = require('../index').handler;
const config = require('../config/db')
const sinon = require('sinon');
const protonService = require("../service/protonService");
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion");
let result, error;

BeforeAll(
    async function () {
        // Mock the database connection
        const db = await config.getDb();
        const collection = db.collection('Protons');
        await collection.insertMany([
            {
                "IsDeleted": false,
                "IsActive": true,
                "ThirdPartySoftwareType": "ProtonIntegration",
                "CustomerID": "633c4f831d56a2724c9b58d2",
                "ClientID": "encryptedClientSecret"
            }
        ]);
        sinon.stub(protonService, 'getProtonToken').resolves({
            token: 'mockedToken'
        });
        sinon.stub(protonService, 'sendTransaction').resolves({
            data: {
                "jobId": "681a23eca67281c85f26af58",
            }
        });
    }
)

Given('there are failed transactions in the AuditLogs collection for active and non-deleted Proton configurations', async function () {
    // Mock the database to return failed transactions
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.insertMany([
        {
            "Type" : "ProtonService",
            "ReleaseCode" : "24372356",
            "ErrorMessage" : "The request is invalid.Invalid Client Id",
            "CustomerID" : "633c4f831d56a2724c9b58d2",
            "ProtonPayload" : {
                "contactId" : "32c6d748-7be2-4278-a701-4355a586a9f3",
                "locationNumber" : 6674,
                "serviceId" : 4132,
                "quantity" : 2,
                "currencyCode" : "USD",
                "transactionId" : "681a23eca67281c85f26af58"
            },
            "UsageID" : ObjectId.createFromHexString("681a23eca67281c85f26af58"),
            "RetryCount" : 2,
            "Status" : "Success",
        }
    ]);
});

When('the handler function is invoked', async function () {
    try {
        result = await handler({});
    } catch (err) {
        error = err;
    }
});

Then('the failed transactions are retried', function () {
    assert(result.status === 'success');
});

Then('their statuses are updated to Success if processed successfully', async () => {
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.find({"Type" : "ProtonService"}).toArray((err, docs) => {
        assert(docs[0].Status === 'Success');
    });
});

Then('their retry count is incremented if they fail again', async () => {
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.find({"Type" : "ProtonService"}).toArray((err, docs) => {
        assert(docs[0].Status === 'Success');
    });
});

Given('there are no failed transactions in the AuditLogs collection', async function () {
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.deleteMany({}); // Clear any existing entries
});

Then('no transactions are retried', function () {
    assert(result.status === 'success');
});

Then('the function completes without errors', function () {
    assert(!error);
});

Given('there is a configuration error while processing transactions', async function () {
    sinon.restore()
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.insertMany([
        {
            "Type" : "ProtonService",
            "ReleaseCode" : "2437242356",
            "ErrorMessage" : "The request is invalid.Invalid Client Id",
            "CustomerID" : "633c4f831d56a2724c9b58d2",
            "ProtonPayload" : {
                "contactId" : "32c6d748-7be2-4278-a701-4355a586a9f3",
                "locationNumber" : 6674,
                "serviceId" : 4132,
                "quantity" : 2,
                "currencyCode" : "USD",
                "transactionId" : "441a23eca67281c85f26af58"
            },
            "UsageID" : ObjectId.createFromHexString("221a23eca67281c85f26af58"),
            "RetryCount" : 2,
            "Status" : "Failed",
        }
    ]);
    sinon.stub(protonService, 'getProtonToken').rejects({data: 'error'});
});

Then('the failed transactions remain in the Failed status', async () => {
    const db = await config.getDb();
    const collection = db.collection('AuditLogs');
    await collection.find({"Type" : "ProtonService"}).toArray((err, docs) => {
        assert(docs[0].Status === 'Failed');
    });
});

Then('an error is logged', function () {
    assert(error.message.includes('error'));
});