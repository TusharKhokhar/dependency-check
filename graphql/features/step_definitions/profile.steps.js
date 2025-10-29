const request = require('supertest');
const { Given, When, Then, setDefaultTimeout, BeforeAll} = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {getProfiles, getProfile} = require('../queries/profile')
const {addProfile} = require('../mutations/profile.mutation')
const { handler } = require("../../graphql");
const { getEvent } = require("../mocks/event");

let server
let globalResponse = {}
setDefaultTimeout(100000)
const context = {};

server = request(config.url);

/**
 * Scenario: Mutation to add a new profile for profile type driver
 */

Given('A valid graphql addProfile mutation', () => {
    return addProfile.mutation
})

When('User has provided valid profileInputs', () => {
    addProfile.variables.addProfileInput.Profile = Date.now().toString()
    return addProfile.variables
})

Then('The api should respond with status code', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(addProfile)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.addProfileResponse = res.res;
          expect(globalResponse.addProfileResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('The response contains profile data', () => {
    const profileResponse = JSON.parse(globalResponse.addProfileResponse.text)
    expect(profileResponse.data.addProfile.Profile).to.be.equals(addProfile.variables.addProfileInput.Profile)
    getProfile.variables.profileId = profileResponse.data.addProfile._id
})

// Scenario: It should send correct graphql query getProfiles

Given(/^a valid graphql query$/,  async () => {
    return getProfiles
});
When(/^User has provided valid pagination input$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain',  config.domainName)
      .send(getProfiles)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('The response status should be 200', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('The response will contain total number of profiles and profile object in an array', () => {
    expect(JSON.parse(globalResponse.response.text).data.getProfiles.profile?.length).to.be.equals(1);
    expect(JSON.parse(globalResponse.response.text).data.getProfiles.total).to.be.a('number')
});

// Scenario: It should contain profile settings getProfile

Given(/^a valid graphql query getProfile$/,  async () => {
    return getProfile.query
});

When(/^I request to get profile by valid profile id$/,  () => {
    return getProfile.variables
});

When(/^I called the getProfile query$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getProfile)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response2 = res.res;
          callback()
      });
});

Then('The response status for getProfile should be 200', () => {
    expect(globalResponse.response2.statusCode).to.equal(200);
});

Then('I should receive profile with profile settings', () => {
    const profile = JSON.parse(globalResponse.response2.text).data.getProfile
    expect(profile.ProfileSetting).to.exist
    expect(profile.ProfileSetting.PrintConfigurationGroup).to.exist
    expect(profile.ProfileSetting.PrintConfigurationGroup.GroupType).to.be.equals('Print Configuration')
});

// Scenario: It should not contain profile getProfile when we provide invalid customer and profile id

When(/^Request to get profile by invalid profile id$/,  () => {
    return getProfile.variables = {
        "customerId": "6231ce19932e27000985ba61",
        "profileId": "664c9b3ed6006ce0157f7a31"
    }
});


When(/^GraphQL api request to getProfile with invalid ids$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getProfile)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});


Then('I should not receive profile', () => {
    const profile = JSON.parse(globalResponse.response.text).data.getProfile
    expect(profile).to.be.null
});

Given("I have a valid profile input with isActive set to true", () => {
    addProfile.variables.addProfileInput.IsActive = true
});
  
When("I send a request to add profile", async function () {
    const event = getEvent(addProfile);
  
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
});
  
Then("the response of profile should have status code {int}",function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);
  
Then("the response of profile should have isActive set to true", function () {
    const profile = globalResponse.response.body.data.addProfile;
    expect(profile)
      .to.have.property("IsActive")
      .that.is.a("boolean")
      .and.is.true;
});