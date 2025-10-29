const request = require('supertest');
const { Given, When, Then, setDefaultTimeout, BeforeAll} = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {getDevice} = require('../queries/devices')
const {importDevice} = require('../queries/devices')

let server
let globalResponse = {}
setDefaultTimeout(100000)

server = request(config.url);

/**
 * Scenario: calling getDevice api to fetch customerName
 */

Given(/^a valid graphql query for getDevice$/,  async () => {
    return getDevice.query
});

When(/^user provide a valid input for getDevice$/,  () => {
    return getDevice.variables
});

When(/^user called the getDevice query$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getDevice)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for getDevice api', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the customerName of that device details in getDevice api', () => {
    const device = JSON.parse(globalResponse.response.text).data.getDevice
    expect(device.CustomerName).to.exist
});

/**
 * Scenario: calling importDevice api to import device
 */

Given(/^a valid graphql query for importDevice$/,  async () => {
    return importDevice.query
});

When(/^user provide a valid input for importDevice$/,  () => {
    return importDevice.variables
});

When(/^user called the importDevice query$/,  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(importDevice)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for importDevice api', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the base64 as the response for importDevice api', () => {
    const device = JSON.parse(globalResponse.response.text).data.importDevice
    expect(device.message).to.exist
});