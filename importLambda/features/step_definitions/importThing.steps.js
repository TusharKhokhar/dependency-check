const { Given, When, Then, Before, After, setDefaultTimeout} = require('@cucumber/cucumber');
const sinon = require('sinon');
const fs = require('fs');
const { processS3File} = require('../../index');
const { Readable } = require('stream');
const {addCustomer} = require("../../../memoryDb/customer");
const {addLocation} = require("../../../memoryDb/locations");
const {addDevice} = require("../../../memoryDb/device");
const {addLicense} = require("../../../memoryDb/license");
const {addDropdowns} = require("../../../memoryDb/dropdowns");
const iotHandler = require("../../services/iotResourceHandler");
const {addUser} = require("../../../memoryDb/users");
const emailHandler = require("../../services/emailHandler");
const chai = require("chai");
const {addProvider} = require("../../../memoryDb/provider");
const expect = chai.expect;
setDefaultTimeout(60 * 1000);

let bucketName, key, data, type, customerId, fileName, locationName, userId, iotResourceStub, emailStub
Before(async () => {
    const {insertedId: customer, ops: customerData} = await addCustomer()
    customerId = customer
    const {ops: locationData} = await addLocation(customerId, 'Paras City')
    locationName = locationData?.Location
    await addDevice(customerId, 'canon')
    await addLicense(customerId)
    await addDropdowns(customerId)
    await addProvider(
      customerId,
      "saml",
      customerData[0].DomainName,
      null,
      'provider one'
    );
    const userData = await addUser([], [],
      customerId, customerData[0].Tier, customerData[0].DomainName)
    userId = userData.insertedId
    iotResourceStub = sinon.stub(iotHandler, 'createIoTResources').resolves({policyData: {
            policyName: 'policyName'
        }, iotData: {
            thingArn: 'thingArn',
            thingName: 'thingName',
            thingId: 'thingId'
        }, certificateData: {
            certificateId: 'certificateId'
        }, privateKey: 'privateKey'
    })
    sinon.stub(iotHandler, 'createIoTResourcesSecondaryRegion').resolves({});
});

After(() => {
    sinon.restore();
});

Given('the CSV file contains valid things data', async () => {
    emailStub = sinon.stub(emailHandler, 'sendEmailAttachments').resolves({});
    const readThingCsv = await fs.readFileSync('./testFiles/thing.csv')
    const createStreamFromString = (data) => {
        const stream = new Readable();
        stream.push(data);
        stream.push(null);
        return stream;
    };
    data = createStreamFromString(readThingCsv.toString());
});

When('the Lambda function is triggered by the file upload event for things', async () => {
    type = 'things';
    fileName = `${userId.toString()}.csv`;
    bucketName = 'test-bucket';
    key = 'things.csv';
})

Then('the system should parse the file correctly for things', async () =>  {
    await processS3File(bucketName, key, data, type, customerId, fileName);
})

Then('the things should be added to the database for things', function () {
    expect(iotResourceStub.calledOnce).to.be.true;
})

Then('an email should be sent with the import status for things', function () {
    expect(emailStub.calledOnce).to.be.true;
})

