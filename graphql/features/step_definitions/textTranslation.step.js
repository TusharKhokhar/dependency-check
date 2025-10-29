// filepath: /Users/work/Documents/development/cloud-saas-api/graphql/features/step_definitions/textTranslation.step.js
const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const chai = require("chai");
const sinon = require("sinon");
const { handler } = require("../../graphql");
const {
  addTextTranslation,
  updateTextTranslation,
  deleteTextTranslation,
  updateTextTranslationStatus,
} = require("../mutations/textTranslation.mutation");
const { getEvent } = require("../mocks/event");
const { getTextTranslation } = require("../queries/textTranslation");
const { mockTextTranslationResponse } = require("../mocks/textTranslationMock");
const expect = chai.expect;

let globalResponse = {};
const context = {};

// Create a stub for the handler function
const originalHandler = handler;
let handlerStub;

Before(function () {
  // Set up the stub before each scenario
  handlerStub = sinon
    .stub()
    .callsFake(async (event, context) => {
      const body = JSON.parse(event.body);
      let responseData;

      if (body.operationName === "AddTextTranslation") {
        responseData = {
          data: {
            addTextTranslation: mockTextTranslationResponse.addTextTranslation,
          },
        };
      } else if (body.operationName === "UpdateTextTranslation") {
        responseData = {
          data: {
            updateTextTranslation: mockTextTranslationResponse.updateTextTranslation,
          },
        };
      } else if (body.operationName === "DeleteTextTranslation") {
        responseData = {
          data: {
            deleteTextTranslation: mockTextTranslationResponse.deleteTextTranslation,
          },
        };
      } else if (body.operationName === "UpdateTextTranslationStatus") {
        responseData = {
          data: {
            updateTextTranslationStatus:
              mockTextTranslationResponse.updateTextTranslationStatus,
          },
        };
      } else if (body.operationName === "GetTextTranslation") {
        responseData = {
          data: {
            getTextTranslation: mockTextTranslationResponse.getTextTranslation,
          },
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(responseData),
      };
    });

  // Replace the original handler with our stub
  global.handler = handlerStub;
});

After(function () {
  // Restore the original handler after each scenario
  global.handler = originalHandler;
  sinon.restore();
});

Given("I have a valid text translation input", function () {
  return addTextTranslation.variables.addTextTranslationInput;
});

Given("I have a valid text translation update input", function () {
  return updateTextTranslation.variables.updateTextTranslationInput;
});

Given("I have a valid text translation delete input", function () {
  return deleteTextTranslation.variables;
});

Given("I have a valid text translation status input", function () {
  return updateTextTranslationStatus.variables;
});

Given("I have a valid text translation ID", function () {
  return getTextTranslation.variables;
});

When("I send a request to add the text translation", async function () {
  const event = getEvent(addTextTranslation);

  try {
    const response = await handlerStub(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When(
  "I send a request to update the text translation",
  async function () {
    const event = getEvent(updateTextTranslation);

    try {
      const response = await handlerStub(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When(
  "I send a request to delete the text translation",
  async function () {
    const event = getEvent(deleteTextTranslation);
    try {
      const response = await handlerStub(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When(
  "I send a request to change the text translation status",
  async function () {
    const event = getEvent(updateTextTranslationStatus);
    try {
      const response = await handlerStub(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

When("I send a request to get the text translation", async function () {
  const event = getEvent(getTextTranslation);
  try {
    const response = await handlerStub(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then(
  "the response of text translation should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of text translation should contain text translation details",
  function () {
    const textTranslationData = globalResponse.response.body.data.addTextTranslation;
    expect(textTranslationData).to.exist;
    expect(textTranslationData).to.have.property("CustomerID");
    expect(textTranslationData).to.have.property("ThirdPartySoftwareName");
    expect(textTranslationData).to.have.property("EnableMicrosoftTranslation").that.is.a("boolean");
    expect(textTranslationData).to.have.property("EnableGoogleTranslation").that.is.a("boolean");
    expect(textTranslationData).to.have.property("TranslationServices").that.is.an("array");
    expect(textTranslationData).to.have.property("IsCheckAll").that.is.a("boolean");
    expect(textTranslationData).to.have.property("IsActive").that.is.a("boolean");
    expect(textTranslationData).to.have.property("CreatedBy");
    expect(textTranslationData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of text translation should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateTextTranslation ||
      globalResponse.response.body.data.updateTextTranslationStatus ||
      globalResponse.response.body.data.deleteTextTranslation;

    expect(result).to.exist;
    expect(result.success).to.be.true;
    expect(result.message).to.exist;
  }
);

Then(
  "the retrieved text translation should match the expected text translation",
  function () {
    const textTranslationData = globalResponse.response.body.data.getTextTranslation;
    expect(textTranslationData).to.exist;
    expect(textTranslationData).to.have.property("CustomerID");
    expect(textTranslationData).to.have.property("CustomerName");
    expect(textTranslationData).to.have.property("ThirdPartySoftwareName");
    expect(textTranslationData).to.have.property("ThirdPartySoftwareType");
    expect(textTranslationData).to.have.property("EnableMicrosoftTranslation").that.is.a("boolean");
    expect(textTranslationData).to.have.property("EnableGoogleTranslation").that.is.a("boolean");
    expect(textTranslationData).to.have.property("TranslationServices").that.is.an("array");
    expect(textTranslationData).to.have.property("Languages").that.is.an("array");
    expect(textTranslationData).to.have.property("IsActive").that.is.a("boolean");
    expect(textTranslationData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);
