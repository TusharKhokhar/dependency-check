const { Given, When, Then, Before} = require('@cucumber/cucumber');
const request = require('supertest');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const server = request(config.url);
const { v4: uuidv4 } = require('uuid');
const {addCustomer} = require("../../../memoryDb/customer");
const {addThingData} = require("../../../memoryDb/things")
const {addDropdowns} = require("../../../memoryDb/dropdowns")
const {addDevice} = require("../../../memoryDb/device")
const {addGroup} = require("../../../memoryDb/group");
const {addCustomizationText} = require("../../../memoryDb/customizationText");
let response
let thing;

Before('@global', async function () {
    response = null
    await addDropdowns()
    const {insertedId: customerId, ops: customerData} = await addCustomer()
    const {insertedId: deviceId, ops: deviceData} = await addDevice(customerId)
    const {insertedId: groupId, ops: groupData} = await addGroup(customerId)
    await addCustomizationText(groupId, customerId)
    const thingTagId = uuidv4()
    const {insertedId: thingId, ops: thingData} = await addThingData(customerId, deviceId, thingTagId)
    thing = thingData;
})

Given(/^the thingTagId with the version number$/,  () => {

});

Given(/^the valid thingTagId with the version number$/,  () => {

});

When(/^I request to get all config data with invalid thingTagId$/, (callback) => {
    server.get('/public/configData')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .query({ thingTagId: '1234', versionNumber: '7.0' })
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          response = res.res;
          callback();
      });
});

When(/^I request to get all config data with valid thingTagId$/, (callback) => {
    server.get('/public/configData')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .query({ thingTagId: thing[0].ThingTagID, versionNumber: '7.0' })
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          response = res.res;
          callback();
      });
});

Then('I should receive a 200 response and thind has a DefaultDevice Data', () => {
    expect(response.statusCode).to.equal(200);
    const responseData = JSON.parse(response.text)
    const thingData = responseData.data.configData.thingData;
    expect(thingData).to.have.any.keys('DefaultDevice');
	expect(thingData.DefaultDevice).to.be.a('object');
    
});

Then('I should receive a 401 error', () => {
    expect(response.statusCode).to.equal(401);
    expect(JSON.parse(response.text)).to.be.deep.equal({ error: { code: 401, message: 'Not a valid token' }, status: 0 });
});

// Scenario : Scenario: Get Sts Credentails

Given(/^the thingName and CustomerId$/,  () => {

});

When(/^I request the getStsCredentials api$/, (callback) => {
    server.post('/public/iot/sts')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .query({ thingName: '633c50eb1625258c4470b2ac-1664897259434', customerId: '633c4f831d56a2724c9b58d2' })
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          response = res.res;
          callback();
      });
});

Then('I should receive accessparams in response', () => {
    expect(response.statusCode).to.equal(200);
    console.log("response",response.text)
    const thing = JSON.parse(response.text)
    expect(thing.data.message.accessKeyId).to.exist
    expect(thing.data.message.secretAccessKey).to.exist
    expect(thing.data.message.sessionToken).to.exist
    expect(thing.data.message.GlobalEndpoint).to.exist
    expect(thing.data.message.region).to.exist
});
