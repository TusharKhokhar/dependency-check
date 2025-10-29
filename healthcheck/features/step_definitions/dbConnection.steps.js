const { Given, When, Then, After, Before } = require("@cucumber/cucumber");
const sinon = require("sinon");
const { expect } = require("chai");
const { STSClient } = require("@aws-sdk/client-sts");
const { MongoClient } = require("mongodb");
const { getDb } = require("../../db");

let dbStub, assumeRoleStub, sandbox;
let credentialsExpiration;

Before("@DBConnection", async () => {
  sandbox = sinon.createSandbox();

  // Stub MongoDB connection
  dbStub = sandbox.stub(MongoClient.prototype, "connect").resolves({
    db: sandbox.stub().returns({ collection: sinon.stub() }),
  });
});

After("@DBConnection", () => {
  sandbox.restore();
});

Given("the DB is already connected", async function () {
  credentialsExpiration = new Date(Date.now() - 60000);

  assumeRoleStub = sandbox.stub(STSClient.prototype, "send").resolves({
    Credentials: {
      AccessKeyId: "newKey",
      SecretAccessKey: "newSecret",
      SessionToken: "newToken",
      Expiration: credentialsExpiration,
    },
  });

  await getDb();
});

When("the getDb method is called after credentials expired", async function () {
  await getDb();
});

Then("the connectToServer method should be called", function () {
  expect(dbStub.callCount).to.equal(2);
});
