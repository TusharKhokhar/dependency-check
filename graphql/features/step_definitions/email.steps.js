const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addEmail,
  updateEmail,
  emailDeleted,
  emailStatus,
} = require("../mutations/email.mutation");
const { getEmail } = require("../queries/email");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid email input", function () {
  return addEmail.variables.addEmailInput;
});

Given("I have a valid email update input", function () {
  return updateEmail.variables.updateEmailInput;
});

Given("I have a valid email delete input", function () {
  return emailDeleted.variables;
});

Given("I have a valid email status input", function () {
  return emailStatus.variables;
});

Given("I have a valid email ID", function () {
  return getEmail.variables;
});

When("I send a request to add the email", async function () {
  const event = getEvent(addEmail);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the email", async function () {
  const event = getEvent(updateEmail);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the email", async function () {
  const event = getEvent(emailDeleted);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to change the email status", async function () {
  const event = getEvent(emailStatus);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to get the email", async function () {
  const event = getEvent(getEmail);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of email should have status code {int}", function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
});

Then(
  "the response of email should contain email details",
  function () {
    const email = globalResponse.response.body.data.addEmail;
    expect(email).to.exist;
    expect(email).to.have.property("_id");
    expect(email).to.have.property("SenderName");
    expect(email).to.have.property("IsActive").that.is.a("boolean");
    expect(email).to.have.property("CreatedBy");
    expect(email).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of email should contain a success message",
  function () {

    const result =
      globalResponse.response.body.data.updateEmail ||
        globalResponse.response.body.data.emailDeleted ||
      globalResponse.response.body.data.emailStatus;
    
    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
