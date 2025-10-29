const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addSmartphone,
  updateSmartphone,
  smartphoneDeleted,
  smartphoneStatus,
} = require("../mutations/smartphone.mutation");
const { getSmartphone } = require("../queries/smartphone");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

let globalResponse = {};
const context = {};

//  Scenario: Successfully add a new smartphone

Given('I have a valid smartphone input', function () {
    return addSmartphone.variables.addSmartphoneInput;
});

When ('I send a request to add the smartphone', async function () {
    const event = getEvent(addSmartphone);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of smartphone should have status code {int} and response should have smartphone details', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const smartphone = globalResponse.response.body.data.addSmartphone;
    expect(smartphone).to.have.property("_id");
    expect(smartphone).to.have.property("Tags").that.is.an("array");
    expect(smartphone).to.have.property("IsActive").that.is.a("boolean");
    expect(smartphone).to.have.property("CreatedBy");
    expect(smartphone).to.have.property("IsDeleted").that.is.a("boolean");
    expect(smartphone).to.have.property("Pin")
});

// Scenario: Successfully update an smartphone

Given('I have a valid smartphone update input', function () {
    return updateSmartphone.variables.updateSmartphoneInput;
});

When ('I send a request to update the smartphone', async function () {
    const event = getEvent(updateSmartphone);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of smartphone should have status code {int} and the response should contain a success message', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const result = globalResponse.response.body.data.updateSmartphone;
    expect(result.message).to.exist;
});

// Scenario: Successfully change the status of an smartphone

Given('I have a valid smartphone status input', function () {
    return smartphoneStatus.variables.smartphoneStatusInput;
});

When ('I send a request to change the smartphone status', async function () {
    const event = getEvent(smartphoneStatus);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of smartphone should have status code {int}', function (statusCode) {
    expect(globalResponse.response.statusCode).to.equal(statusCode);
    // return smartphoneStatus.variables
});

// Scenario: Successfully get smartphone details

Given('I have a valid smartphone ID', function () {
    return getSmartphone.variables;
});

When('I send a request to get the smartphone', async function () {
    const event = getEvent(getSmartphone);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of smartphone should have list of smartphone', function () {
    const result = globalResponse.response.body.data.getSmartphone;
    expect(result).to.not.be.empty;

    expect(result).to.have.property("_id");
    expect(result).to.have.property("CustomerID");
    expect(result).to.have.property("Pin");
});

// Scenario: Successfully delete an smartphone

Given('I have a valid smartphone delete input', function () {
    return smartphoneDeleted.variables;
});

When('I send a request to delete the smartphone', async function () {
    const event = getEvent(smartphoneDeleted);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of smartphone deletion should have status code {int} and the response should contain a success message', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const result = globalResponse.response.body.data.smartphoneDeleted;
    expect(result.message).to.exist;
});
