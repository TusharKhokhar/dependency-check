const request = require('supertest');
const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const {config} = require('../configs/config')
const { handler } = require("../../graphql");
const {
    addCustomizationText,
} = require("../mutations/customizationTexts");
const expect = chai.expect;
let server
globalResponse = {};
const context = {};
server = request(config.url);

/**
 * Scenario: Successfully add a new customizationTexts
 */

Given('I have a valid customizationTexts input', () => {
    return addCustomizationText.mutation
})

When('I send a request to add the customizationTexts', () => {
    return addCustomizationText.variables
})

Then('the response of customizationTexts should have status code 200', async () => {

    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(addCustomizationText),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
})

Then('the response of customizationTexts should contain customizationTexts details', () => {
        expect(globalResponse.response.body.errors).to.exist
})
