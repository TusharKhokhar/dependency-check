const {expect} = require('chai');
const {
    Given,
    When,
    Then,
    setDefaultTimeout, Before, After,
} = require("@cucumber/cucumber");
const {handler} = require("../../index");
const sinon = require('sinon');
const awsService = require("../../awsService");
const config = require('../configs/config');
const emailService = require("../../services/emailService");
const translationService = require("../../translate");
const {addTranslationRecord} = require("../../../memoryDb/publicUploads");
setDefaultTimeout(20000);
let sandbox;

let getSignedUrlsStub
const event = {
    data: {
        isTranslated: true,
        jobData: {
            _id: '',
            "IsProcessedFileName": [
                {
                    "FileName": "5f9761a7-d692-454a-b606.pdf",
                    "IsProcessed": true
                }
            ],
            "CreatedAt": new Date("2024-08-01T14:43:11.000Z"),
            "CustomerID": '',
            "DeliveryMethod": {
                "EmailAddress": "manthan.sharma@tbsit360.com",
                "SessionID": "sess1234",
                "ThingID": '2322442424242'
            },
            "ExpireJobRecord": null,
            "IsDelivered": false,
            "IsTranslated": true,
            "JobExpired": false,
            "JobList": [
                {
                    "JobExpired": false,
                    "OriginalFileNameWithExt": "hello.docx",
                    "NewFileNameWithExt": "5f9761a7-d692-454a-b606.pdf",
                    "Platform": "graphql",
                    "UploadedFrom": "dev",
                    "IsTranslated": true
                }
            ],
            "SourceLanguage": "en",
            "TargetLanguage": "hi",
            "Username": "matthew"
        },
        customerData: {_id: '', CustomerName: 'Test Customer'}
    }
};

Before(() => {
    sandbox = sinon.createSandbox();
});

After(() => {
    sandbox.restore();
});

Given("the translated files are available", async () => {
    sandbox.restore()
    expect(event.data.isTranslated === true).to.be.true
    event.data.customerData._id = config.customerData.insertedId
    event.data.jobData.CustomerID = config.customerData.insertedId
    event.data.jobData._id = await addTranslationRecord(config.customerData.insertedId)
    sandbox.stub(awsService, 'uploadToS3').resolves()
    sandbox.stub(translationService, 'getTranslationStatus').resolves({status: 'Succeeded', summary: {totalCharacterCharged: 100}})
    sandbox.stub(awsService, 'getIamCredentials').resolves()
    sandbox.stub(awsService, 'getSignedUrls').resolves()
    sandbox.stub(emailService, 'sendEmailAttachments').resolves()
    sandbox.stub(awsService, 'sendMessageToIoTThing').resolves()
    getSignedUrlsStub = sandbox.stub(awsService, 'getAzureSecrets').resolves({
        subscriptionKey: 'key',
        translateAccount: 'account'
    });
});

When ("the translation lambda handler is invoked", async () => {
    await handler(event)
})

Then("the translated files are delivered to the user over email if the delivery method is email", async () => {
    expect(event.data.jobData.DeliveryMethod.EmailAddress).to.not.be.empty;
})

Then("the translated files are delivered to the IoT Thing if the delivery method was selected as Thing", async () => {
        expect(event.data.jobData.DeliveryMethod.ThingID).to.not.be.empty;
})

Then("the translated files are delivered to the IoT Thing", async () => {
    expect(awsService.sendMessageToIoTThing.calledOnce).to.be.true
})

Then("the translated files are delivered to the user over email", async () => {
    expect(emailService.sendEmailAttachments.calledOnce).to.be.true
})