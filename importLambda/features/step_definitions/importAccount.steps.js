const { Given, When, Then, Before, After} = require('@cucumber/cucumber');
const sinon = require('sinon');
const fs = require('fs');
const { processS3File} = require('../../index');
const { Readable } = require('stream');
const {addCustomer} = require("../../../memoryDb/customer");
const {addUser} = require("../../../memoryDb/users");
const emailHandler = require("../../services/emailHandler");
const chai = require("chai");
const expect = chai.expect;

let bucketName, key, data, type, customerId, fileName, userId, emailStub, response
Before(async () => {
    const {insertedId: customer, ops: customerData} = await addCustomer()
    customerId = customer
    const userData = await addUser([], [],
      customerId, customerData[0].Tier, customerData[0].DomainName)
    userId = userData.insertedId
});

After(() => {
    sinon.restore();
});

Given('the CSV file contains valid accounts data', async () => {
    emailStub = sinon.stub(emailHandler, 'sendEmailAttachments').resolves({});
    const readThingCsv = await fs.readFileSync('./testFiles/account.csv')
    const createStreamFromString = (data) => {
        const stream = new Readable();
        stream.push(data);
        stream.push(null);
        return stream;
    };
    data = createStreamFromString(readThingCsv.toString());
});

When('the Lambda function is triggered by the file upload event for accounts', async () => {
    type = 'accounts';
    fileName = `${userId.toString()}.csv`;
    bucketName = 'test-bucket';
    key = 'accounts.csv';
})

Then('the system should parse the file correctly for accounts', async () =>  {
    response = await processS3File(bucketName, key, data, type, customerId, fileName);
})

Then('the accounts should be added to the database for accounts', function () {
    expect(response).to.be.undefined;
})

Then('an email should be sent with the import status for accounts', function () {
    expect(emailStub.calledOnce).to.be.true;
})

