const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const sinon = require("sinon");
const { expect } = require("chai");
const { STS } = require("@aws-sdk/client-sts");
const { MongoClient } = require("mongodb");
const proxyquire = require("proxyquire");
const path = require("path");


let dbStub, assumeRoleStub, sandbox, db;

Before("@DBConnection", async function () {
  sandbox = sinon.createSandbox();
  assumeRoleStub = sandbox.stub(STS.prototype, "assumeRole");

  dbStub = sandbox.stub(MongoClient.prototype, "connect").resolves({
    db: sandbox.stub().returns({}),
  });

  // Create config mock and inject it
  const configMock = {
    server: "dev",
  };

  // Use proxyquire to inject the mock config into db module
  db = proxyquire(path.resolve(__dirname, "../../config/db"), {
    [path.resolve(__dirname, "../../config/config")]: configMock,
  });
  
});


Given("the DB is already connected", async function () {
  assumeRoleStub.returns({
    Credentials: {
      AccessKeyId: "newKey",
      SecretAccessKey: "newSecret",
      SessionToken: "newToken",
      Expiration: new Date(Date.now() + 60000),
    },
  });
  await db.getDb();
});

When("the getDb method is called after credentials expired", async function () {
  assumeRoleStub.returns({
    Credentials: {
      AccessKeyId: "newKey",
      SecretAccessKey: "newSecret",
      SessionToken: "newToken",
      Expiration: new Date(Date.now() - 60000),
    },
  });
  await db.getDb();
});

Then("the connectToServer method should be called", function () {
  expect(dbStub.calledOnce).to.be.true;
});
