const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addIlliad,
  updateIlliad,
  deleteIlliad,
  updateIlliadStatus,
} = require("../mutations/illiad.mutation");
const { getEvent } = require("../mocks/event");
const { getIlliad } = require("../queries/illiad");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid illiad input", function () {
  return addIlliad.variables.addIlliadInput;
});

Given("I have a valid illiad update input", function () {
  return updateIlliad.variables.updateIlliadInput;
});

Given("I have a valid illiad delete input", function () {
  return deleteIlliad.variables;
});

Given("I have a valid illiad status input", function () {
  return updateIlliadStatus.variables;
});

Given("I have a valid illiad ID", function () {
  return getIlliad.variables;
});

When("I send a request to add the illiad", async function () {
  const event = getEvent(addIlliad);

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
  "I send a request to update the illiad",
  async function () {
    const event = getEvent(updateIlliad);

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
  "I send a request to delete the illiad",
  async function () {
    const event = getEvent(deleteIlliad);
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
  "I send a request to change the illiad status",
  async function () {
    const event = getEvent(updateIlliadStatus);
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

When("I send a request to get the illiad", async function () {
  const event = getEvent(getIlliad);
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
  "the response of illiad should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of illiad should contain illiad details",
  function () {
    const handWriteData = globalResponse.response.body.data.addIlliad;
    expect(handWriteData).to.exist;
    expect(handWriteData).to.have.property("_id");
    expect(handWriteData).to.have.property("ThirdPartySoftwareName");
    expect(handWriteData).to.have.property("IsActive").that.is.a("boolean");
    expect(handWriteData).to.have.property("CreatedBy");
    expect(handWriteData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of illiad should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateIlliad ||
      globalResponse.response.body.data.deleteIlliad ||
      globalResponse.response.body.data.updateIlliadStatus;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
