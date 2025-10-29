const { Given, When, Then, BeforeAll } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const { getBillingServices } = require("../queries/billingServices");
const { addBillingService } = require("../../../memoryDb/billingServices");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

globalResponse = {};
const context = {};

BeforeAll(async () => {
  await addBillingService();
})

Given("I have valid request parameters for BillingServices", function () {
  return getBillingServices.variables.paginationInput;
});


When("I send a request to get the BillingServices", async function () {
  const event = getEvent(getBillingServices);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of BillingServices should have status code {int}",function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then("the response should contain a list of BillingServices", function () {
    const result = globalResponse.response.body.data.getBillingServices.services[0];
    expect(result).to.not.be.empty;
  
    expect(result).to.have.property("_id");
    expect(result).to.have.property("ServiceID");
    expect(result).to.have.property("ServiceName");
    expect(result).to.have.property("CreatedAt");
    expect(result).to.have.property("IsDeleted");
});
  
