const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addAudio,
  updateAudio,
  deleteAudio,
  updateAudioStatus,
} = require("../mutations/audio.mutation");
const { getEvent } = require("../mocks/event");
const { getAudio } = require("../queries/audio");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid audio input", function () {
  return addAudio.variables.addAudioInput;
});

Given("I have a valid audio update input", function () {
  return updateAudio.variables.updateAudioInput;
});

Given("I have a valid audio delete input", function () {
  return deleteAudio.variables;
});

Given("I have a valid audio status input", function () {
  return updateAudioStatus.variables;
});

Given("I have a valid audio ID", function () {
  return getAudio.variables;
});

When("I send a request to add the audio", async function () {
  const event = getEvent(addAudio);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to update the audio", async function () {
  const event = getEvent(updateAudio);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

When("I send a request to delete the audio", async function () {
  const event = getEvent(deleteAudio);
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
  "I send a request to change the audio status",
  async function () {
    const event = getEvent(updateAudioStatus);
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

When("I send a request to get the audio", async function () {
  const event = getEvent(getAudio);
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
  "the response of audio should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of audio should contain audio details",
  function () {
    const AudioData = globalResponse.response.body.data.addAudio;
    expect(AudioData).to.exist;
    expect(AudioData).to.have.property("_id");
    expect(AudioData).to.have.property("ThirdPartySoftwareName");
    expect(AudioData).to.have.property("IsActive").that.is.a("boolean");
    expect(AudioData).to.have.property("CreatedBy");
    expect(AudioData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of audio should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateAudio ||
      globalResponse.response.body.data.deleteAudio ||
      globalResponse.response.body.data.updateAudioStatus;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
