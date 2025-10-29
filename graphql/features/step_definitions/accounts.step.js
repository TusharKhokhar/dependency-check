const request = require('supertest');
const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const {config} = require('../configs/config')
const { handler } = require("../../graphql");
const {
  addAccount,
  updateAccount,
  deleteAccount,
  accountStatus,
} = require("../mutations/account.mutation");
const { getAccounts, getAccount, importAccount } = require("../queries/account");
const { getEvent } = require("../mocks/event");
const { addAccounts } = require("../../../memoryDb/accounts");
const expect = chai.expect;
let server
globalResponse = {};
const context = {};
server = request(config.url);

Given("I have a valid account input", function () {
  return addAccount.variables.addAccountInput;
});

Given("I have a valid account update input", async function () {
  return updateAccount.variables.updateAccountInput;
});

Given("I have a valid account delete input", async function () {
  

  return deleteAccount.variables;
});

Given("I have a valid account status input", async function () {
  return accountStatus.variables;
});

Given("I have a valid account ID", async function () {
  return getAccounts.variables;
});

Given("I have valid request parameters for accounts", function () {
  return getAccount.variables;
});

When("I send a request to add the account", async function () {
  const event = getEvent(addAccount);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the account", async function () {
  const event = getEvent(updateAccount);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the account", async function () {
  const event = getEvent(deleteAccount);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to change the account status", async function () {
  const event = getEvent(accountStatus);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to get the account", async function () {
  const event = getEvent(getAccounts);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to get the accounts", async function () {
  const account = await addAccounts();
  getAccount.variables.accountId = account.insertedId;
  const event = getEvent(getAccount);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of account should have status code {int}",function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then("the response of account should contain account details", function () {
  const account = globalResponse.response.body.data.addAccount;

  expect(account).to.have.property("_id");
  expect(account).to.have.property("CustomerID");
  expect(account).to.have.property("AccountId");
  expect(account).to.have.property("AccountName");
  expect(account).to.have.property("CustomerName");
  expect(account).to.have.property("Description");
  expect(account).to.have.property("Tags").that.is.an("array");
  expect(account).to.have.property("IsActive").that.is.a("boolean");
  expect(account).to.have.property("CreatedBy");
  expect(account).to.have.property("IsDeleted").that.is.a("boolean");
});

Then("the response of account should contain a success message", function () {
  const result =
    globalResponse.response.body.data.updateAccount ||
    globalResponse.response.body.data.deleteAccount ||
    globalResponse.response.body.data.accountStatus;    
  expect(result.message).to.exist;
});

Then("the response should contain a list of accounts", function () {
  const result = globalResponse.response.body.data.getAccount;

  expect(result).to.not.be.empty;

  expect(result).to.have.property("_id");
  expect(result).to.have.property("CustomerID");
  expect(result).to.have.property("AccountId");
  expect(result).to.have.property("AccountName");
  expect(result).to.have.property("CustomerName");
  expect(result).to.have.property("Description");
  expect(result).to.have.property("Tags").that.is.an("array");
  expect(result).to.have.property("IsActive").that.is.a("boolean");
  expect(result).to.have.property("CreatedBy");
  expect(result).to.have.property("IsDeleted").that.is.a("boolean");
});
  
/**
 * Scenario: calling importAccount api for csv template
 */

Given('a valid graphql query for importAccount', () => {
    return importAccount.query
})

When('user provide a valid input for importAccount',  () => {
    return importAccount.variables
});

When('user called the importAccount query',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(importAccount)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for importAccount api', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the base64 as the response for importAccount api', () => {
    const importAccountResponse = JSON.parse(globalResponse.response.text).data.importAccount
    console.log('importAccountResponse', importAccountResponse)
    expect(importAccountResponse.message).to.exist
});
