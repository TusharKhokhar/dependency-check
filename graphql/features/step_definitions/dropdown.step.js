const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const { getEvent } = require("../mocks/event");
const { getDropdowns } = require("../queries/dropdown");
const { deleteCustomPermission } = require('../../../memoryDb/customerPermissions');
const expect = chai.expect;

globalResponse = {};
const context = {};
let response;

Given("the customer has only both permission", function () {
    return getDropdowns.variables;
});

When("I request the dropdown values", async function () {
    const event = getEvent(getDropdowns);
  
    try {
      response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
});

Then("the response should include only these two options in ThirdPartySoftwareType", function () {
    const responseBody = response.body;
    expect(responseBody.data.getDropdowns.ThirdPartySoftwareType).to.deep.equal(['Proton Integration', 'Account Sync']);
});


Given("the customer has only the {string} permission", function (permission) {
    return getDropdowns.variables;
});

When("I request the dropdown values with only one permission", async function () {
    await deleteCustomPermission("67cfd63b9de02f83f9f27816")
    const event = getEvent(getDropdowns);
  
    try {
      response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
});

Then("the response should include only {string} in ThirdPartySoftwareType", function (expected) {
    const responseBody = response.body;
    expect(responseBody.data.getDropdowns.ThirdPartySoftwareType).to.deep.equal([expected]);
});