const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const { sendSuccessToConnectedClients } = require('../../controllers/socket.controller');
const { ApiGatewayManagementApiClient } = require('@aws-sdk/client-apigatewaymanagementapi');
const db = require('../../config/db');
const apiHandler = require('../../services/api-handler');

let req, res, apiStub, dbStub, successResponseStub, errorResponseStub;

Before('@socket', () => {
  req = {
    headers: {
      Authorization: ''
    },
    body: {
      releaseCode: null,
      sessionId: 'testSessionId',
      action: 'ippprint',
      status: 'success',
      message: 'Test message',
      dataUrl: 'http://example.com',
      accessFile: { region: 'us-east-1' },
      region: 'us-east-1',
      attributes: {},
      requestType: 'send-document',
      jobId: 'testJobId'
    }
  };
  res = {
    send: sinon.stub(),
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };
  apiStub = sinon.stub(ApiGatewayManagementApiClient.prototype, 'send').resolves();
  dbStub = sinon.stub(db, 'getDb').returns({
    collection: sinon.stub().returnsThis(
      {
        findOneAndUpdate: sinon.stub().resolves({ value: { ReleaseCode: 'testReleaseCode' } }),
        updateOne: sinon.stub().resolves(),
        findOne: sinon.stub().resolves({ Topic: 'testTopic' }),
        findOneAndDelete: sinon.stub().resolves()
      }
    )
  });
  successResponseStub = sinon.stub(apiHandler, 'setSuccessResponse').resolves();
  errorResponseStub = sinon.stub(apiHandler, 'setErrorResponse').resolves();
});

After(() => {
  sinon.restore();
});

Given('a request body with action {string}', function (action) {
  req.body.action = action;
});

When('I send a POST request to sendSuccessToConnectedClients', async function () {
  await sendSuccessToConnectedClients(req, res);
});

Then('the response should contain message {string}', function (expectedMessage) {
  const actualMessage = successResponseStub.getCall(0).args[0].message;
  expect(successResponseStub.calledWith({ message: expectedMessage }, res)).to.be.true;
});