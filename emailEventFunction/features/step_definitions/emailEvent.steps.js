const {
  Given,
  When,
  Then,
  setDefaultTimeout,
  Before,
  After,
} = require("@cucumber/cucumber");
const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const {
  mockS3GetObject,
  mockJobFailRequest,
  mockCreateSignedUrlRequest,
  mockUploadAttchmentRequest,
  mockGetUserEmailAddressRequest,
  mockConfirmFileUploadRequest,
  getRawData,
  setupAxiosInstance,
  restoreAxiosInstance,
  mockAttachmentUploadWithRetry,
} = require("../mocks/mocks");
const { getCustomer, updateCustomer } = require("../../../memoryDb/customer");
const simpleParser = require("mailparser").simpleParser;
setDefaultTimeout(20000);
const log = require("../../helper/customLogger");

let event = {
  Records: [
    {
      s3: {
        bucket: { name: "test-bucket" },
        object: { key: "test-key" },
      },
    },
  ],
};
let lambdaResult;
let consoleSpy;
let loggerSpy;
let customerData;
let errorLogSpy;
let axiosStub;

Before(async () => {
  customerData = await getCustomer()
  lambdaResult = null;
  axiosStub = setupAxiosInstance();
  loggerSpy = sinon.spy(log.prototype, "info");
  consoleSpy = sinon.spy(console, "log");
  errorLogSpy = sinon.spy(console, 'error');
});

After(() => {
  restoreAxiosInstance()
  sinon.restore();
});

Given("An email is sent to {string}.", async (email) => {
  await mockS3GetObject("../test-files/spam-test");
});

Given("An email with more than 25 attachments is sent", async () => {
  await mockS3GetObject("../test-files/attachment-limit-exceeded-test");
  await updateCustomer({ DomainName: "admin" }, customerData._id);
  mockJobFailRequest();
});

Given("An email with an unsupported file format is sent", async () => {
  await mockS3GetObject("../test-files/unsupported-file-format-test");
  mockJobFailRequest();
});

Given("An email without attachments but with a signature is sent", async () => {
  await mockS3GetObject("../test-files/without-attachment-with-signature");
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Given("An email without attachments and without a signature is sent", async () => {
  await mockS3GetObject("../test-files/without-attachment-without-signature");
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Given("An email with one attachment of valid size and with a signature is sent", async () => {
  await mockS3GetObject("../test-files/with-valid-size-with-email-signature");
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Given("An email with one valid and one invalid size attachment, along with a signature, is sent", async () => {
  await mockS3GetObject("../test-files/with-one-valid-one-invalid-size-with-email-signature");
});

Given("An email with all attachments being valid is sent", async () => {
  await mockS3GetObject("../test-files/all-valid-attachment");
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Given("An email with all attachments being invalid is sent", async () => {
  await mockS3GetObject("../test-files/all-invalid-attachment");
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Given('An email is sent with an invalid recipient address.', async () => {
  await mockS3GetObject("../test-files/all-valid-attachment");
});

Given('An email event with undefined to email.', async () => {
  await mockS3GetObject("../test-files/invalid-email");
});

When(/^The email is processed by the lambda function$/, async () => {
  const handler = require("../../index").handler;
  lambdaResult = await handler(event, {});
});

Then(
  "The simpleParser function correctly parses the email content, including attachments, headers, and HTML.",
  async () => {
    const parsedEmail = await simpleParser(getRawData());
    expect(parsedEmail).to.have.property("headers");
    expect(parsedEmail).to.have.property("from");
    expect(parsedEmail.from.text).to.be.a("string");
    expect(parsedEmail).to.have.property("to");
    expect(parsedEmail.to.text).to.be.a("string");
    expect(parsedEmail).to.have.property("html");
    expect(parsedEmail.html).to.be.a("string");
    expect(parsedEmail).to.have.property("attachments");
    expect(parsedEmail.attachments).to.be.an("array");
  }
);

Then("The email is flagged if it's detected as spam or contains a virus.", () => {
  expect(lambdaResult).to.be.undefined;
});

Then("A notification is sent about the attachment limit being exceeded", async () => {
  expect(lambdaResult).to.be.empty;
});

Then("A notification is sent about the unsupported file format", async () => {
  expect(lambdaResult).to.be.undefined;
});

Then("A notification is sent about the 'email.html' file being submitted", async () => {
  expect(lambdaResult).to.be.undefined;
});

Then("A notification is sent about the submitted file, including 'email.html' and the attachments", async () => {
  expect(lambdaResult).to.be.undefined;
});

Then(
  "Failed notification should sent and all attachments should not processed",
  async () => {
    const postCalls = axiosStub.history.post;    
    expect(postCalls.length).to.be.greaterThan(0);
    const expectedUrl = "http://localhost:4000/public/job/fail";
    const expectedData = {
      message:
        "We regret to inform you that some of your attached files were below our minimum size (7kb) requirement and couldn't be processed successfully.",
    };

    const matchingCall = postCalls.find(
      (call) =>
        call.url === expectedUrl &&
        JSON.parse(call.data).message === expectedData.message
    );

    expect(matchingCall).to.exist;
  }
);

Then("A notification is sent about the list of processed files", async () => {
  expect(lambdaResult).to.be.undefined;
});

Then("Two types of notifications are sent: The first includes 'email.html' and The second provides a list of attachments that were not processed", async () => {
  expect(lambdaResult).to.be.undefined;
});

Then('An error is caught, and error it should handle properly.', function () {
  expect(lambdaResult).to.be.undefined;
  expect(errorLogSpy.called).to.be.true;
  expect(errorLogSpy.calledWithMatch("An unexpected error occurred in email file upload=====>")).to.be.true;
});

Then('The function should process the event without throwing an exception.', function () {
  expect(lambdaResult).to.be.undefined;
  expect(loggerSpy.called).to.be.true;
  expect(loggerSpy.calledWithMatch("spam or not a valid to email")).to.be.true;
});

Given("an email from customer Alias with all attachments being valid is sent", async () => {
  await mockS3GetObject("../test-files/alias-valid-customer");
  await updateCustomer({ DomainName: "test" }, customerData._id);
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Then(
  "if customer Alias email address is valid, a notification is sent listing the processed files",
  async () => {
    const postCalls = axiosStub.history.post;    
    expect(postCalls.length).to.be.greaterThan(0);
    const expectedUrl = "http://localhost:4000/public/confirmFileUpload";

    const matchingCall = postCalls.find(
      (call) => 
        call.url === expectedUrl 
    );

    expect(matchingCall).to.exist;
  }
);

Given("an email from location Alias with all attachments being valid is sent", async () => {
  await mockS3GetObject("../test-files/alias-valid-location");
  await updateCustomer({ DomainName: "test" }, customerData._id);
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});


Then(
  "if location Alias email address is valid, a notification is sent listing the processed files",
  async () => {
    const postCalls = axiosStub.history.post;    
    expect(postCalls.length).to.be.greaterThan(0);
    const expectedUrl = "http://localhost:4000/public/confirmFileUpload";

    const matchingCall = postCalls.find(
      (call) => 
        call.url === expectedUrl 
    );

    expect(matchingCall).to.exist;
  }
);

Given('an email from default customer Alias with all attachments being valid is sent', async () => {
  await mockS3GetObject("../test-files/all-valid-customer-default-email-alias");
  await updateCustomer({ DomainName: "test" }, customerData._id);
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Then(
  "if default customer Alias email address is valid, a notification is sent listing the processed files",
  async () => {
    const postCalls = axiosStub.history.post;    
    expect(postCalls.length).to.be.greaterThan(0);
    const expectedUrl = "http://localhost:4000/public/confirmFileUpload";

    const matchingCall = postCalls.find(
      (call) => 
        call.url === expectedUrl 
    );

    expect(matchingCall).to.exist;
  }
);

Given('an email from default location Alias with all attachments being valid is sent', async () => {
  await mockS3GetObject("../test-files/all-valid-location-default-alias-email");
  await updateCustomer({ DomainName: "test" }, customerData._id);
  mockJobFailRequest();
  mockCreateSignedUrlRequest();
  mockUploadAttchmentRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
});

Then(
  "if default location Alias email address is valid, a notification is sent listing the processed files",
  async () => {
    const postCalls = axiosStub.history.post;    
    expect(postCalls.length).to.be.greaterThan(0);
    const expectedUrl = "http://localhost:4000/public/confirmFileUpload";

    const matchingCall = postCalls.find(
      (call) => 
        call.url === expectedUrl 
    );

    expect(matchingCall).to.exist;
  }
);

Given("an email with multiple file attachments is sent", async () => {
  await updateCustomer({ DomainName: "spt" }, customerData._id);
  await mockS3GetObject("../test-files/all-invalid-multi-attachment");
  mockCreateSignedUrlRequest();
  mockGetUserEmailAddressRequest();
  mockConfirmFileUploadRequest();
  mockAttachmentUploadWithRetry();
});

Then("the first upload attempt fails and the uploads are retried and succeed", () => {
  const allPutRequests = axiosStub.history.put;

  expect(allPutRequests.length).to.be.greaterThan(1);

  const retryMap = allPutRequests.reduce((acc, req) => {
    acc[req.url] = (acc[req.url] || 0) + 1;
    return acc;
  }, {});

  const retried = Object.values(retryMap).some(count => count === 2);
  expect(retried).to.be.true;
});