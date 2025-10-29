const request = require('supertest');
const { Given, When, Then, setDefaultTimeout, Before, After } = require('@cucumber/cucumber');
const expect = require('chai').expect;
const sinon = require('sinon');
const forge = require('node-forge');
const {handler} =require("../../graphql")
const {config} = require('../configs/config')

const {importThing, getThings, getThing} = require('../queries/things');
const { addLocation } = require('../../../memoryDb/locations');
const { getCustomer } = require('../../../memoryDb/customer');
const { addDevice } = require('../../../memoryDb/device');
const { addDropdowns } = require('../../../memoryDb/dropdowns');
const { addLicense } = require('../../../memoryDb/license');
const { addThing, updateThing } = require('../mutations/thing.mutation');
const { addThingData } = require('../../../memoryDb/things');
const { getEvent } = require("../mocks/event");


const { mockGetStsCredentials, mockCreateThingCommand, mockListCACertificate, mockGetSecretManagerKey, mockCreatePolicy, mockAttachPrincipalPolicy, mockAttachCertificateWithThing, mockRegisterDeviceCert, mockThingDetails } = require('../mocks/mocks');
const { v4: uuidv4 } = require('uuid');

let server
let globalResponse = {}
setDefaultTimeout(100000)
let customerData
let DeviceID
let thingId
const context = {};

const fakeCert = { serialNumber: '123456789',subject:{attributes:"123"} };
const fakeKey = { privateKey: 'fake-private-key' };
server = request(config.url);

Before('@Things', async () => { 
   await mockGetStsCredentials()
   await mockCreateThingCommand()
   await mockListCACertificate()
   await mockGetSecretManagerKey()


   sinon.stub(forge.pki, 'certificateFromPem').returns(fakeCert);
   sinon.stub(forge.pki, 'privateKeyFromPem').returns(fakeKey);
   sinon.stub(forge.pki, 'createCertificate').returns({ sign: sinon.stub(),validity:{notBefore:new Date(),notAfter:""},setSubject:sinon.stub(),setIssuer:sinon.stub(),setExtensions:sinon.stub()} );
   sinon.stub(forge.pki, 'certificateToPem').returns({} );
   sinon.stub(forge.pki, 'privateKeyToPem').returns("-----BEGIN PRIVATE KEY-----\nMockPrivateKeyData\n-----END PRIVATE KEY-----");

   await mockRegisterDeviceCert()
   await mockCreatePolicy()
   await mockAttachPrincipalPolicy()
   await mockAttachCertificateWithThing()
   await mockThingDetails()

    await addDropdowns()
    customerData = await getCustomer()
    const { insertedId } = await addDevice(customerData._id)
    DeviceID = insertedId; 
    const { insertedId: LocationID } = await addLocation(customerData._id)
    await addLicense(customerData._id)
    addThing.variables.addThingInput.LocationID = LocationID
    addThing.variables.addThingInput.CustomerID = customerData._id
    addThing.variables.addThingInput.DeviceID = [DeviceID]
    //update thing
    updateThing.variables.updateThingInput.LocationID = LocationID
    updateThing.variables.updateThingInput.CustomerID = customerData._id
    updateThing.variables.updateThingInput.DeviceID = [DeviceID]
    //getThings thing
    getThings.variables.customerIds = [customerData._id]
    //getThings thing
    getThing.variables.customerId = customerData._id.toString()
    getThing.variables.thingId = thingId
})

After(() => {
    sinon.restore();
});

/**
 * Scenario: calling importThing api for csv template
 */

Given('a valid graphql query for importThing', () => {
    return importThing.query
})

When('user provide a valid input for importThing',  () => {
    return importThing.variables
});

When('user called the importThing query',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(importThing)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for importThing api', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the base64 as the response for importThing api', () => {
    const importThingResponse = JSON.parse(globalResponse.response.text).data.importThing
    expect(importThingResponse.message).to.exist
});

/**
 * Scenario: calling the addThing API to add a new thing
 */
Given('a valid GraphQL query for addThing', () => {
    return addThing.query
})

When('the user provides a valid input for addThing',  async() => {
    return addThing.variables
});

When('the user calls the addThing query', async () => {
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
        body: JSON.stringify(addThing),
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
});

Then('the response should have a status of 200 for the addThing API', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('the response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName', () => {
    const importThingResponse = globalResponse.response.body.data.addThing
    expect(importThingResponse).to.have.property('PromptForAccount').that.is.a('boolean');
    expect(importThingResponse).to.have.property('EmailAsReleaseCode').that.is.a('boolean');
    expect(importThingResponse).to.have.property('SerialNumber').that.is.a('string');
    expect(importThingResponse).to.have.property('Firmware').that.is.a('string');
    expect(importThingResponse).to.have.property('IpAddress').that.is.a('string');
    expect(importThingResponse).to.have.property('MacAddress').that.is.a('string');
    expect(importThingResponse).to.have.property('ComputerName').that.is.a('string');
    
});

/**
 * Scenario: calling the updateThing API to update a thing
 */

Given('a valid GraphQL query for updateThing', async() => {
    const thingTagId = uuidv4()
    const thingData = await addThingData(customerData._id, DeviceID, thingTagId)
    thingId = thingData.insertedId.toString()
    updateThing.variables.thingId = thingId
    return updateThing.query
})

When('the user provides a valid input for updateThing',  async() => {
    return updateThing.variables
});

When('the user calls the updateThing query', async () => {
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
        body: JSON.stringify(updateThing),
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
});

Then('the response should have a status of 200 for the updateThing API', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('the response should include the following updateThing fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName', () => {
    const importThingResponse = globalResponse.response.body.data.updateThing
    expect(importThingResponse).to.have.property('message', 'Updated successfully');
});

/**
 * Scenario: calling the getThings API to get a thing list
 */

Given('a valid GraphQL query for getThings', async() => {
    return getThings.query
})

When('the user provides a valid input for getThings',  async() => {
    return getThings.variables
});

When('the user calls the getThings query', async () => {
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
        body: JSON.stringify(getThings),
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
});

Then('the response should have a status of 200 for the getThings API', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('the getThings response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName', () => {
    const importThingResponse = globalResponse.response.body.data.getThings
    expect(importThingResponse).to.have.property('thing').that.is.an('array').with.length.above(0);
    
    const firstThing = importThingResponse.thing[0];

    expect(firstThing).to.have.property('PromptForAccount').that.is.a('boolean');
    expect(firstThing).to.have.property('EmailAsReleaseCode').that.is.a('boolean');
    expect(firstThing).to.have.property('SerialNumber').that.is.a('string');
    expect(firstThing).to.have.property('Firmware').that.is.a('string');
    expect(firstThing).to.have.property('IpAddress').that.is.a('string');
    expect(firstThing).to.have.property('MacAddress').that.is.a('string');
    expect(firstThing).to.have.property('ComputerName').that.is.a('string');
});


/**
 * Scenario: calling the getThing API to get a thing data
 */

Given('a valid GraphQL query for getThing', async() => {
    return getThing.query
})

When('the user provides a valid input for getThing',  async() => {
    return getThing.variables
});

When('the user calls the getThing query', async () => {
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
        body: JSON.stringify(getThing),
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
});

Then('the response should have a status of 200 for the getThing API', () => {
    expect(globalResponse.response.statusCode).to.equal(200);    
});

Then('the getThing response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName', () => {
    const importThingResponse = globalResponse.response.body.data.getThing
    expect(importThingResponse).to.have.property('PromptForAccount').that.is.a('boolean');
    expect(importThingResponse).to.have.property('EmailAsReleaseCode').that.is.a('boolean');
    expect(importThingResponse).to.have.property('SerialNumber').that.is.a('string');
    expect(importThingResponse).to.have.property('Firmware').that.is.a('string');
    expect(importThingResponse).to.have.property('IpAddress').that.is.a('string');
    expect(importThingResponse).to.have.property('MacAddress').that.is.a('string');
    expect(importThingResponse).to.have.property('ComputerName').that.is.a('string');
});

Then('the getThing response should include the following fields in LoginOptions: ExternalCardValidation, ExternalCardIdp', () => {
    const importThingResponse = globalResponse.response.body.data.getThing?.LoginOptions;

    expect(importThingResponse).to.be.an('array').that.is.not.empty;

    const firstItem = importThingResponse[0];

    expect(firstItem).to.have.property('ExternalCardValidation').that.is.a('boolean');
    expect(firstItem).to.have.property('ExternalCardIdp').that.is.an('array');
});


Given("I have a valid addThing input with isActive set to true", () => {
    addThing.variables.addThingInput.IsActive = true
});

When("I send a request to add Thing", async function () {
  const event = getEvent(addThing);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then(
  "the response of Thing should have status code {int}",
  function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
  }
);

Then(
  "the response of Thing should have isActive set to true",
  function () {
    const authConfiguration = globalResponse.response.body.data.addThing;
    expect(authConfiguration).to.have.property("IsActive").that.is.a("boolean")
      .and.is.true;
  }
);

When('the user provides a valid getThings input with search pattern for display name {string}', async function (thingName) {
  getThings.variables.paginationInput.pattern = thingName;
  return getThing.variables
});


Then(
  "the response should include at least one Thing with Label equal to {string}",
  function (thingName) {
    const things = globalResponse.response.body.data.getThings.thing;

    const found = things.some((thing) => thing.Label === thingName);

    expect(found).to.be.true;
  }
);