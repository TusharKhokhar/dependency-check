const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addRestorePictures,
  updateRestorePictures,
  deleteRestorePictures,
  updateRestorePicturesStatus,
} = require("../mutations/restorePictures.mutation");
const { getEvent } = require("../mocks/event");
const { getRestorePictures } = require("../queries/restorePictures");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid restore pictures input", function () {
  return addRestorePictures.variables.addRestorePicturesInput;
});

Given("I have a valid restore pictures update input", function () {
  return updateRestorePictures.variables.updateHandWriteRecognitionInput;
});

Given("I have a valid restore pictures delete input", function () {
  return deleteRestorePictures.variables;
});

Given("I have a valid restore pictures status input", function () {
  return updateRestorePicturesStatus.variables;
});

Given("I have a valid restore pictures ID", function () {
  return getRestorePictures.variables;
});

When("I send a request to add the restore pictures", async function () {
  const event = getEvent(addRestorePictures);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the restore pictures", async function () {
  const event = getEvent(updateRestorePictures);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the restore pictures", async function () {
  const event = getEvent(deleteRestorePictures);
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
  "I send a request to change the restore pictures status",
  async function () {
    const event = getEvent(updateRestorePicturesStatus);
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

When("I send a request to get the restore pictures", async function () {
  const event = getEvent(getRestorePictures);
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
  "the response of restore pictures should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of restore pictures should contain restore pictures details",
  function () {
    const handWriteData = globalResponse.response.body.data.addRestorePictures;
    expect(handWriteData).to.exist;
    expect(handWriteData).to.have.property("_id");
    expect(handWriteData).to.have.property("ThirdPartySoftwareName");
    expect(handWriteData).to.have.property("IsActive").that.is.a("boolean");
    expect(handWriteData).to.have.property("CreatedBy");
    expect(handWriteData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of restore pictures should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateRestorePictures ||
      globalResponse.response.body.data.deleteRestorePictures ||
      globalResponse.response.body.data.updateRestorePicturesStatus;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
