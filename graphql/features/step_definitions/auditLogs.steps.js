const { Given, When, Then, BeforeAll } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const { getAuditLogsWithMessageFilter } = require("../queries/auditLogs");
const { getEvent } = require("../mocks/event");
const { config } = require("../configs/config");
const { addAuditLog } = require("../../../memoryDb/auditLogs");
const expect = chai.expect;

globalResponse = {};
const context = {};

Given(
  "I have valid request parameters including a message filter for auditLogs",
  async function () {
    await addAuditLog("PolarisLogin", "ENOTFOUND", config.customerId);
    return (getAuditLogsWithMessageFilter.variables.message = "ENOTFOUND");
  }
);

When("I send a request to fetch the auditLogs", async function () {
  const event = getEvent(getAuditLogsWithMessageFilter);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should have a status code of {int}", function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
});

Then(
  "the response should contain a list of auditLogs matching the filter",
  function () {
    const result = globalResponse.response.body.data.getAuditLogs.audit;
    expect(result).to.not.be.empty;

    const isPresent = result.every((obj) =>
      Object.values(obj).some(
        (val) => typeof val === "string" && val.includes("ENOTFOUND")
      )
    );
    expect(isPresent).to.be.true;
  }
);
