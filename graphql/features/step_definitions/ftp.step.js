const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addFTP,
  updateFTP,
  deleteFTP,
  updateFTPStatus,
} = require("../mutations/ftp.mutation");
const { getEvent } = require("../mocks/event");
const { getFTP } = require("../queries/ftp");
const expect = chai.expect;

let globalResponse = {};
const context = {};

Given("I have a valid FTP input", function () {
  return addFTP.variables.addFtpInput;
});

Given("I have a valid FTP update input", function () {
  return updateFTP.variables.updateFtpInput;
});

Given("I have a valid FTP delete input", function () {
  return deleteFTP.variables;
});

Given("I have a valid FTP status input", function () {
  return updateFTPStatus.variables;
});

Given("I have a valid FTP ID", function () {
  return getFTP.variables;
});

When("I send a request to add the FTP", async function () {
  const event = getEvent(addFTP);

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
  "I send a request to update the FTP",
  async function () {
    const event = getEvent(updateFTP);

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
  "I send a request to delete the FTP",
  async function () {
    const event = getEvent(deleteFTP);
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
  "I send a request to change the FTP status",
  async function () {
    const event = getEvent(updateFTPStatus);
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

When("I send a request to get the FTP", async function () {
  const event = getEvent(getFTP);
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
  "the response of FTP should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of FTP should contain FTP details",
  function () {
    const handWriteData = globalResponse.response.body.data.addFTP;
    expect(handWriteData).to.exist;
    expect(handWriteData).to.have.property("_id");
    expect(handWriteData).to.have.property("ThirdPartySoftwareName");
    expect(handWriteData).to.have.property("IsActive").that.is.a("boolean");
    expect(handWriteData).to.have.property("CreatedBy");
    expect(handWriteData).to.have.property("IsDeleted").that.is.a("boolean");
  }
);

Then(
  "the response of FTP should contain a success message",
  function () {
    const result =
      globalResponse.response.body.data.updateFTP ||
      globalResponse.response.body.data.deleteFTP ||
      globalResponse.response.body.data.updateFTPStatus;

    expect(result).to.exist;
    expect(result.message).to.exist;
  }
);
