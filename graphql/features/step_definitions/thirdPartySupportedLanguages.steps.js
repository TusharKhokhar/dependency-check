const { Given, When, Then, BeforeAll } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  getThirdPartySupportedLanguages,
} = require("../queries/thirdPartySupportedLanguages");
const {
  addThirdPartySupportedLanguages,
} = require("../../../memoryDb/thirdPartySupportedLanguages");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

globalResponse = {};
const context = {};

BeforeAll(async () => {
  await addThirdPartySupportedLanguages();
});

Given(
  "I have valid request parameters for ThirdPartySupportedLanguages",
  function () {
    return getThirdPartySupportedLanguages.variables;
  }
);

When(
  "I send a request to get the ThirdPartySupportedLanguages",
  async function () {
    const event = getEvent(getThirdPartySupportedLanguages);

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

Then(
  "the response of ThirdPartySupportedLanguages should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response should contain a list of ThirdPartySupportedLanguages",
  function () {
    const result =
      globalResponse.response.body.data.getThirdPartySupportedLanguages;
    expect(result).to.not.be.empty;

    expect(result).to.have.property("ThirdPartySoftwareType");
    expect(result).to.have.property("_id");
    expect(result).to.have.property("Languages");
  }
);
