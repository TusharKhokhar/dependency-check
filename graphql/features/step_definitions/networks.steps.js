const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const {
  addNetwork,
  updateNetwork,
  networkDeleted,
  networkStatus,
} = require("../mutations/network.mutation");
const { getNetwork } = require("../queries/network");
const { getEvent } = require("../mocks/event");
const expect = chai.expect;

let globalResponse = {};
const context = {};

//  Scenario: Successfully add a new network

Given('I have a valid network input', function () {
    return addNetwork.variables.addNetworkInput;
});

When ('I send a request to add the network', async function () {
    const event = getEvent(addNetwork);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);

        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of network should have status code {int} and response should have network details', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const network = globalResponse.response.body.data.addNetwork;
    expect(network).to.have.property("_id");
    expect(network).to.have.property("CustomerID");
});

// Scenario: Successfully update an network

Given('I have a valid network update input', function () {
    return updateNetwork.variables.updateNetworkInput;
});

When ('I send a request to update the network', async function () {
    const event = getEvent(updateNetwork);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of network should have status code {int} and the response should contain a success message', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const result = globalResponse.response.body.data.updateNetwork;
    expect(result.message).to.exist;
});

// Scenario: Successfully change the status of an network

Given('I have a valid network status input', function () {
    return networkStatus.variables.networkStatusInput;
});

When ('I send a request to change the network status', async function () {
    const event = getEvent(networkStatus);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of network should have status code {int}', function (statusCode) {
    expect(globalResponse.response.statusCode).to.equal(statusCode);
    // return networkStatus.variables
});

// Scenario: Successfully get network details

Given('I have a valid network ID', function () {
    return getNetwork.variables;
});

When('I send a request to get the network', async function () {
    const event = getEvent(getNetwork);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of network should have list of network', function () {
    const result = globalResponse.response.body.data.getNetwork;
    expect(result).to.not.be.empty;

    expect(result).to.have.property("_id");
    expect(result).to.have.property("CustomerID");
    expect(result).to.have.property("Path");
});

// Scenario: Successfully delete an network

Given('I have a valid network delete input', function () {
    return networkDeleted.variables;
});

When('I send a request to delete the network', async function () {
    const event = getEvent(networkDeleted);

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response of network deletion should have status code {int} and the response should contain a success message', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
    const result = globalResponse.response.body.data.deleteNetwork;
    expect(result.message).to.exist;
});
