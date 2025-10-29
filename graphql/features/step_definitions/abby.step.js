const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addAbby,
  updateAbby,
  deleteAbby,
  updateAbbyStatus,
} = require("../mutations/abby.mutation");
const { getEvent } = require("../mocks/event");
const { getAbby } = require("../queries/abby");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid abby input", function () {
  return addAbby.variables.addAbbyInput;
});

Given("I have a valid abby update input", function () {
  return updateAbby.variables.updateAbbyInput;
});

Given("I have a valid abby delete input", function () {
  return deleteAbby.variables;
});

Given("I have a valid abby status input", function () {
  return updateAbbyStatus.variables;
});

Given("I have a valid abby ID", function () {
  return getAbby.variables;
});

When("I send a request to add the abby", async function () {
  const event = getEvent(addAbby);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When(
  "I send a request to update the abby",
  async function () {
    const event = getEvent(updateAbby);

    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When(
  "I send a request to delete the abby",
  async function () {
    const event = getEvent(deleteAbby);
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When(
  "I send a request to change the abby status",
  async function () {
    const event = getEvent(updateAbbyStatus);
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When("I send a request to get the abby", async function () {
  const event = getEvent(getAbby);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then(
  "the response of abby should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of abby should contain abby details",
  function () {
    const handWriteData = globalResponse.response.body.data.addAbby;
    expect(handWriteData).to.exist;
    expect(handWriteData).to.have.property("_id");
    expect(handWriteData).to.have.property("ThirdPartySoftwareName");
    expect(handWriteData).to.have.property("IsActive").that.is.a("boolean");
    expect(handWriteData).to.have.property("CreatedBy");
    expect(handWriteData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of abby should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateAbby ||
      globalResponse.response.body.data.updateAbbyStatus ||
      globalResponse.response.body.data.deleteAbby;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);