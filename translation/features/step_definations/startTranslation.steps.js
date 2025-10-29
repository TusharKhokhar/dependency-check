const config = require('../configs/config')
const {
    Given,
    When,
    Then,
    setDefaultTimeout,
    BeforeAll, Before, After,
} = require("@cucumber/cucumber");
const { expect } = require('chai');
const {handler} = require("../../index");
const sinon = require('sinon');
const {getDb} = require("../../config/dbHandler");
const {addCustomer} = require("../../../memoryDb/customer");
const {addTranslationRecord} = require("../../../memoryDb/publicUploads");
const awsService = require("../../awsService");
const azureService = require("../../azureServicie");
const translateService = require("../../translate");
const upload = require("../../upload");
let sandbox;

setDefaultTimeout(20000);
Before(() => {
    sandbox = sinon.createSandbox();
});

After(() => {
    sandbox.restore();
});

let translationRecord, customerData, getSignedUrlsStub,
  generateSasTokenStub, startTranslateStub, db, lambdaResult

const event = {
    data: {
        isTranslated: false,
        jobData: {
            _id: translationRecord,
            "IsProcessedFileName": [
                {
                    "FileName": "5f9761a7-d692-454a-b606-0e59dbe11392.pdf",
                    "IsProcessed": true
                }
            ],
            "CreatedAt": new Date("2024-08-01T14:43:11.000Z"),
            "CustomerID": '',
            "DeliveryMethod": {
                "EmailAddress": "manthan.sharma@tbsit360.com",
                "SessionID": "sess1234"
            },
            "ExpireJobRecord": null,
            "IsDelivered": false,
            "IsTranslated": true,
            "JobExpired": false,
            "JobList": [
                {
                    "JobExpired": false,
                    "OriginalFileNameWithExt": "hello.docx",
                    "NewFileNameWithExt": "5f9761a7-d692-454a-b606-0e59dbe11392.pdf",
                    "Platform": "graphql",
                    "UploadedFrom": "dev",
                    "IsTranslated": false
                }
            ],
            "SourceLanguage": "en",
            "TargetLanguage": "hi",
            "Username": "matthew"
        },
        customerData: {_id: '', CustomerName: 'Test Customer'}
    }
};

BeforeAll(async () => {
    lambdaResult = null;
    customerData = await addCustomer()
    config.customerData = customerData
    config.translationId = translationRecord
    translationRecord = await addTranslationRecord(customerData.insertedId)
    event.data.jobData._id = translationRecord
    event.data.customerData._id = customerData.insertedId
    event.data.jobData.CustomerID = customerData.insertedId
});

Given("the translation lambda is triggered have for the first time", async () => {
    db = await getDb()
    getSignedUrlsStub = sandbox.stub(awsService, 'getAzureSecrets').resolves({
        subscriptionKey: 'key',
        translateAccount: 'account'
    });
    getSignedUrlsStub = sandbox.stub(awsService, 'getSignedUrls').resolves([{
        fileName: 'test.txt',
        signedAccessLink: {signedUrl: 'https://example.com'}
    }]);
    sandbox.stub(upload, 'uploadFileToAzure').withArgs('us-east-1').resolves();
    generateSasTokenStub = sandbox.stub(azureService, 'generateSASToken').resolves('url');
    startTranslateStub = sandbox.stub(translateService, 'startTranslate').resolves({
        id: '1213224242',
        status: 'NotStarted'
    });
    await handler(event)
});

When("Source Language is english and target language is hindi", async () => {
    event.data.jobData.SourceLanguage = 'en';
    event.data.jobData.TargetLanguage = 'hi';
})

Then("After uploading file on on azure it successfully calls start translation API", async () => {
    expect(startTranslateStub.calledOnce).to.be.true;
})

Then("The Track Id is updated in the database against the job record", async () => {
    const record = await db.collection('TranslationUploads').findOne({_id: translationRecord});
    expect(record.TranslationTrackID === '1213224242').to.be.true;
})

Given("the translation lambda is triggered have isTranslated flag set as false", async () => {
    event.data.isTranslated = false
    expect( event.data.isTranslated === false).to.be.true;
});

When("The incoming event is for job which is already having TranslationTrackID", async () => {
    event.data.jobData = await db.collection('TranslationUploads').findOne({_id: translationRecord})
    sandbox.restore()
    startTranslateStub = sandbox.stub(translateService, 'startTranslate').resolves({
        id: '1213224242',
        status: 'NotStarted'
    });
    await handler(event)
})

Then("It should not call start translation API", async () => {
    expect(startTranslateStub.calledOnce).to.be.false;
})