const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addAccountSync,
  updateAccountSync,
  deleteAccountSync,
  accountSyncStatus,
} = require("../mutations/accountSync.mutation");
const { getAccountSync } = require("../queries/accountSync");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid accountSync input", function () {
  return addAccountSync.variables.addAccountSyncInput;
});

Given("I have a valid accountSync update input", function () {
  return updateAccountSync.variables.updateAccountSyncInput;
});

Given("I have a valid accountSync delete input", function () {
  return deleteAccountSync.variables;
});

Given("I have a valid accountSync status input", function () {
  return accountSyncStatus.variables;
});

Given("I have a valid accountSync ID", function () {
  return getAccountSync.variables;
});

When("I send a request to add the accountSync", async function () {
  const event = getEvent(addAccountSync);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the accountSync", async function () {
  const event = getEvent(updateAccountSync);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the accountSync", async function () {
  const event = getEvent(deleteAccountSync);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to change the accountSync status", async function () {
  const event = getEvent(accountSyncStatus);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to get the accountSync", async function () {
  const event = getEvent(getAccountSync);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of accountSync should have status code {int}", function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
});

Then(
  "the response of accountSync should contain accountSync details",
  function () {
    const accountSync = globalResponse.response.body.data.addAccountSync;

    expect(accountSync).to.have.property("_id");
    expect(accountSync).to.have.property("APIEndpoint");
    expect(accountSync).to.have.property("ClientId");
    expect(accountSync).to.have.property("ClientSecret");
    expect(accountSync).to.have.property("Mappings").that.is.an("object");
    expect(accountSync).to.have.property("IsActive").that.is.a("boolean");
    expect(accountSync).to.have.property("CreatedBy");
    expect(accountSync).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of accountSync should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateAccountSync ||
      globalResponse.response.body.data.deleteAccountSync ||
      globalResponse.response.body.data.accountSyncStatus;
    expect(result.message).to.exist;
  }
);
