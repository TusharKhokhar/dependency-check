const {Given, When, Then, After} = require('@cucumber/cucumber');
const {expect} = require('chai');
const sinon = require('sinon');
const {validateActivationCode} = require('../../controllers/thing.controller');
const dbHandler = require('../../config/db');
const CustomLogger = require("../../helpers/customLogger");
const model = require('../../models/index');
const uuid = require('../../helpers/uuidHelper');
const ErrorCode = require("../../helpers/error-codes");
const ErrorConstant = require("../../helpers/error-messages");

let req;
let res;
let dbStub;
let logStub;
let error;
let status;
let json;
let send;

Given('a request with activation code {string}, serial number {string}, and mac address {string}', (activationCode, serialNumber, macAddress) => {
    req = {
        query: {
            activationCode,
            serialNumber,
            macAddress
        }
    };

    status = sinon.stub()
    json = sinon.spy()
    send = sinon.spy()
    res = {json, status, send}
    status.returns(res)

    if (!dbStub) {
        dbStub = sinon.stub(dbHandler, 'getDb').resolves({
            collection: sinon.stub().returns({
                deleteMany: sinon.stub().resolves(),
                findOne: sinon.stub().resolves({
                    ThingTagID: 'testThingTagID',
                    _id: 'testId',
                    Thing: 'testThing'
                })
            })
        });
    }

    if (!logStub) {
        logStub = sinon.stub(CustomLogger.prototype, 'lambdaSetup');
    }
    sinon.stub(model.activationCodes, 'activationCodeSearch').callsFake((code) => {
        if (code === 'testActivationCode') {
            return Promise.resolve({
                Tier: 'standard',
                DomainName: 'testDomain',
                CustomerID: '633c4f831d56a2724c9b58d2',
                ThingID: '67c070c6fa1ac107e77cde2d'
            });
        } else {
            return Promise.reject(new Error('ACTIVATION_CODE_NOT_VALID'));
        }
    });

    sinon.stub(model.things, 'updateThingStatus').callsFake((id, thingTagId, db, attributes, callback) => {
        callback(null, {});
    });
    sinon.stub(uuid, 'generateUUID').returns('testThingTagID');
});

When('the request is made to validate the activation code', async () => {
    try {
        await validateActivationCode(req, res);
    } catch (err) {
        error = err;
    }
});

Then('the response for activationCode should be:', (dataTable) => {
    const expectedResponse = dataTable.rowsHash();
    send.calledWith({
        error: null,
        data: {
            thingTagId: expectedResponse.thingTagId,
            tier: expectedResponse.tier,
            domainName: expectedResponse.domainName,
            customerId: expectedResponse.customerId,
            thingId: expectedResponse.thingId
        },
        status: 1
    }).should.be.ok
});

Then('an error should be thrown with message for activationCode {string}', (errorMessage) => {
    status.calledWith(400).should.be.ok
    send.calledWith({
        error: {
            code: parseInt(ErrorCode[errorMessage]),
            message: ErrorConstant[errorMessage].toString()
        },
        status: 0
    }).should.be.ok
});

After(() => {
    sinon.restore();
    dbStub = null;
    logStub = null;
});