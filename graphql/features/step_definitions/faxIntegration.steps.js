const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addFaxIntegration,
  deleteFaxIntegration,
  updateFaxIntegration,
  updateFaxIntegrationStatus
} = require("../mutations/faxIntegration.mutation");
const { getEvent } = require("../mocks/event");
const { getFaxIntegration } = require("../queries/faxIntegration");
const { config } = require("../configs/config");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid fax integration input", function () {
   addFaxIntegration.variables.addFaxIntegrationInput.CustomerID = config.customerId;
  return addFaxIntegration.variables;
});

Given("I have a valid fax integration update input", function () {
  updateFaxIntegration.variables.customerId = config.customerId;
  updateFaxIntegration.variables.updateFaxIntegrationInput.CustomerID = config.customerId;
  return updateFaxIntegration.variables.updateFaxIntegrationInput;
});

Given("I have a valid fax integration delete input", function () {
   deleteFaxIntegration.variables.customerId = config.customerId;
   deleteFaxIntegration.variables.IsDeleted  = true;
  return deleteFaxIntegration.variables;
});

Given("I have a valid fax integration status input", function () {
  updateFaxIntegrationStatus.variables.customerId = config.customerId;
  updateFaxIntegrationStatus.variables.isActive = true;
  return updateFaxIntegrationStatus.variables;
});

Given("I have a valid fax integration ID", function () {
  getFaxIntegration.variables.customerId = config.customerId;
  return getFaxIntegration.variables;
});

When("I send a request to add the fax integration", async function () {
  const event = getEvent(addFaxIntegration);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
    
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the fax integration", async function () {
  const event = getEvent(updateFaxIntegration);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the fax integration", async function () {
  const event = getEvent(deleteFaxIntegration);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to change the fax integration status", async function () {
  const event = getEvent(updateFaxIntegrationStatus);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to get the fax integration", async function () {
  const event = getEvent(getFaxIntegration);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of fax integration should have status code {int}", function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
});

Then("the response of fax integration should contain fax integration details", function () {
  const faxData = globalResponse.response.body.data.addFaxIntegration;
  expect(faxData).to.exist;
  expect(faxData).to.have.property("_id");
  expect(faxData).to.have.property("CustomerID");
  expect(faxData).to.have.property("ThirdPartySoftwareName");
  expect(faxData).to.have.property("ThirdPartySoftwareType");
  expect(faxData).to.have.property("IsActive").that.is.a("boolean");
  expect(faxData).to.have.property("ConfirmationOptions").that.is.an("array");
});

Then("the response of fax integration should contain a success message", function () {
  const result =
    globalResponse.response.body.data.updateFaxIntegration ||
    globalResponse.response.body.data.deleteFaxIntegration ||
    globalResponse.response.body.data.updateFaxIntegrationStatus;

  expect(result).to.exist;
  expect(result.statusCode).to.equal(200);
  expect(result.message).to.exist;
});
