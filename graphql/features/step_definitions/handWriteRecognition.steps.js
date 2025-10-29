const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addHandWriteRecognition,
  updateHandWriteRecognition,
  deleteHandWriteRecognition,
  updateHandWriteRecognitionStatus,
} = require("../mutations/handWriteRecognition.mutation");
const { getEvent } = require("../mocks/event");
const { getHandWriteRecognition } = require("../queries/handWriteRecognition");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid handwriting recognition input", function () {
  return addHandWriteRecognition.variables.addHandWriteRecognitionInput;
});

Given("I have a valid handwriting recognition update input", function () {
  return updateHandWriteRecognition.variables.updateHandWriteRecognitionInput;
});

Given("I have a valid handwriting recognition delete input", function () {
  return deleteHandWriteRecognition.variables;
});

Given("I have a valid handwriting recognition status input", function () {
  return updateHandWriteRecognitionStatus.variables;
});

Given("I have a valid handwriting recognition ID", function () {
  return getHandWriteRecognition.variables;
});

When("I send a request to add the handwriting recognition", async function () {
  const event = getEvent(addHandWriteRecognition);

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
  "I send a request to update the handwriting recognition",
  async function () {
    const event = getEvent(updateHandWriteRecognition);

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
  "I send a request to delete the handwriting recognition",
  async function () {
    const event = getEvent(deleteHandWriteRecognition);
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
  "I send a request to change the handwriting recognition status",
  async function () {
    const event = getEvent(updateHandWriteRecognitionStatus);
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

When("I send a request to get the handwriting recognition", async function () {
  const event = getEvent(getHandWriteRecognition);
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
  "the response of handwriting recognition should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of handwriting recognition should contain handwriting recognition details",
  function () {
    const handWriteData = globalResponse.response.body.data.addHandWriteRecognition;
    expect(handWriteData).to.exist;
    expect(handWriteData).to.have.property("_id");
    expect(handWriteData).to.have.property("ThirdPartySoftwareName");
    expect(handWriteData).to.have.property("IsActive").that.is.a("boolean");
    expect(handWriteData).to.have.property("CreatedBy");
    expect(handWriteData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of handwriting recognition should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateHandWriteRecognition ||
      globalResponse.response.body.data.deleteHandWriteRecognition ||
      globalResponse.response.body.data.updateHandWriteRecognitionStatus;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
