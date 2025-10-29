const request = require('supertest');
const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {importLocation, getLocations } = require('../queries/locations');
const { addLocation } = require('../mutations/location.mutation')
const {handler} = require("../../graphql");
const {getEvent} = require("../mocks/event");
let server
let globalResponse = {}
setDefaultTimeout(100000)

server = request(config.url);

/**
 * Scenario: calling importLocation api for csv template
 */

Given('a valid graphql query for importLocation', () => {
    return importLocation.query
})

When('user provide a valid input for importLocation',  () => {
    return importLocation.variables
});

When('user called the importLocation query',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(importLocation)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for importLocation api', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the base64 as the response for importLocation api', () => {
    const importLocationResponse = JSON.parse(globalResponse.response.text).data.importLocation
    expect(importLocationResponse.message).to.exist
});


/**
 * Scenario: Mutation to add a new location data
 */


Given('A valid graphql addLocation mutation', () => {
    return addLocation.mutation
})

When('User has provided valid locationInput', () => {
    return addLocation.variables
})


Then('The api should respond with status code 200 for addLocation', async () => {
    const event = getEvent(addLocation)
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

Then('The response contains location data', () => {
    const locationResponse = globalResponse.response.body
    expect(locationResponse.data.addLocation).to.be.equals(locationResponse.data.addLocation)
})


// Scenario: It should send correct graphql query getLocations

Given(/^a valid graphql query for getLocations$/,  async () => {
    return getLocations
});
When(/^User has provided valid pagination input for getLocations$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain',  config.domainName)
      .send(getLocations)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('The response status should be 200 for getLocations', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('The response will contain total number of locations and location object in an array', () => {
    expect(JSON.parse(globalResponse.response.text).data.getLocations.location?.length).to.be.equals(1);
    expect(JSON.parse(globalResponse.response.text).data.getLocations.total).to.be.a('number')
});
