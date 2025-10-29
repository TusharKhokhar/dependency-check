const { Given, When, Then, After } = require('@cucumber/cucumber');
const expect = require('chai').expect;
const sinon = require('sinon');
const chai = require('chai');
const { getThingByAttributes } = require('../../controllers/thing.controller');
const dbHandler = require('../../config/db');
const CustomLogger = require("../../helpers/customLogger");
const ErrorCode = require("../../helpers/error-codes");
const ErrorConstant = require("../../helpers/error-messages");
chai.should();

let req;
let res;
let dbStub;
let logStub;
let error;
let status;
let json;
let send;

Given('a request with serial number {string} and mac address {string}', (serialNumber, macAddress) => {
  req = {
    query: {
      serialNumber,
      macAddress
    }
  };

  status = sinon.stub()
  json = sinon.spy()
  send = sinon.spy()
  res = { json, status, send }
  status.returns(res)
  if (!dbStub) {
    dbStub = sinon.stub(dbHandler, 'getDb').resolves({
      collection: sinon.stub().returns({
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
});

When('the request is made to get thing by attributes', async () => {
  try {
    await getThingByAttributes(req, res);
  } catch (err) {
    error = err;
  }
});

Then('the response should be:', (dataTable) => {
  const expectedResponse = dataTable.rowsHash();
  send.calledWith({
    error: null,
    data: {
      ThingTagID: expectedResponse.ThingTagID,
      Tier: expectedResponse.Tier
    },
    status: 1
  }).should.be.ok
});

Then('an error should be thrown with message {string}', (errorMessage) => {
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