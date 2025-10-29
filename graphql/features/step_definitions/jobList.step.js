const request = require('supertest');
const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const {config} = require('../configs/config')
const { handler } = require("../../graphql");
const {
    updateJobList,
} = require("../mutations/jobList.mutation");
const {getDb} = require("../../config/dbHandler");
const expect = chai.expect;
let server
globalResponse = {};
const context = {};
server = request(config.url);

/**
 * Scenario: Successfully update a new jobLists
 */

Given('I have a valid jobList input', () => {
    return updateJobList.mutation
})

When('I send a request to update the jobList', () => {
    return updateJobList.variables
})

Then('the response of jobList should have status code 200', async () => {

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
        body: JSON.stringify(updateJobList),
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


Then('the response of jobList should contain success message', async () => {
    console.log(globalResponse.response.body);
    expect(globalResponse.response.body.data.updateJobList.message).to.equal('Updated successfully');
    const db = await getDb()
    const data = await db.collection('JobLists').findOne({})
    console.log('data-----',data);
})

