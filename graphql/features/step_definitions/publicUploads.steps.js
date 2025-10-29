const request = require('supertest');
const { Given, When, Then, setDefaultTimeout, BeforeAll} = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {getPublicUploads} = require('../queries/publicUploads')

let server
let globalResponse = {}
setDefaultTimeout(100000)

server = request(config.url);


// Scenario: It should send correct graphql query getPublicUploads

Given(/^a valid graphql query for getPublicUploads$/,  async () => {
    return getPublicUploads.query
});

When('user provide a valid input for getPublicUploads', () => {
    return getPublicUploads.variables
})

When(/^User has provided valid pagination input for getPublicUploads$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain',  config.domainName)
      .send(getPublicUploads)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('The response status should be 200 for getPublicUploads', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('The response will contain the data', () => {
    const response = JSON.parse(globalResponse.response.text).data.getPublicUploads
    expect(response).to.be.exist;
});
