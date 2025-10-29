const { Given, When, Then, After, Before } = require("@cucumber/cucumber");
const sinon = require("sinon");
const { expect } = require("chai");
const { STS } = require("@aws-sdk/client-sts");

const db = require("../../config/db");
const { mockGetStsCredentials } = require("../mocks/mocks");
let handlerModule, event, consoleErrorSpy, dbMock, assumeRoleStub, sandbox;

Before("@WebSocketHandler", async () => {
  sandbox = sinon.createSandbox();
  assumeRoleStub = sandbox.stub(STS.prototype, "assumeRole");
  assumeRoleStub.returns({
    Credentials: {
      AccessKeyId: "newKey",
      SecretAccessKey: "newSecret",
      SessionToken: "newToken",
      Expiration: new Date(Date.now() + 60000),
    },
  });
  jobListCollectionMock = {
    findOne: sinon.stub().rejects(new Error("Invalid ObjectId")),
  };

  dbMock = {
    collection: sinon.stub().callsFake((collectionName) => {
      if (collectionName === "JobLists") return jobListCollectionMock;
    }),
  };

  sinon.stub(db, "getDb").returns(dbMock);
  handlerModule = require("../../app");
});

After(function () {
  sinon.restore();
});
Given(
  "A WebSocket event with routeKey {string} and actionItem {string}",
  async function (routeKey, actionItem) {
    event = {
      requestContext: { connectionId: "test-connection", routeKey },
      body: JSON.stringify({ body: { actionItem } }),
    };
    await mockGetStsCredentials();
  }
);

When("The lmsValidate method throws an error", async function () {
  consoleErrorSpy = sinon.spy(console, "error");

  await handlerModule.handler(event);
});

Then("The error should be logged", function () {
  expect(consoleErrorSpy.called).to.be.true;

  expect(consoleErrorSpy.args[0][0]).to.include("Error in websocket handler");
  expect(consoleErrorSpy.args[0][1].message).to.includes("Invalid ObjectId");
});
