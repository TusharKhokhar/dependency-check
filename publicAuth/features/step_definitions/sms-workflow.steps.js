const { Given, When, Then } = require('@cucumber/cucumber');
const sinon = require('sinon');

let context = {
  customerData: null,
  userInfo: {},
  files: [],
  phoneNumber: null,
  customMessage: null
};

Given('the SMS notification service is operational', () => {
  // Reset the mock and context before each scenario
  sinon.resetHistory();
  context = {
    customerData: null,
    userInfo: {},
    files: [],
    phoneNumber: null,
    customMessage: null
  };
});

Given('the customer name is {string}', (customerName) => {
  context.customerData = { CustomerName: customerName };
});

Given('I am logged in as a guest user {string}', (guestName) => {
  context.userInfo = {
    type: 'guest',
    guestName,
    userName: null,
    libraryCard: null,
    releaseCode: null
  };
});

Given('I am logged in with library card {string}', (libraryCard) => {
  context.userInfo = {
    type: 'library',
    guestName: null,
    userName: null,
    libraryCard,
    releaseCode: null
  };
});

Given('I have a release code {string}', (releaseCode) => {
  context.userInfo = {
    type: 'release',
    guestName: null,
    userName: null,
    libraryCard: null,
    releaseCode
  };
});

Given('there is a custom SMS message {string}', (message) => {
  context.customMessage = message;
});

Given('I am logged in as a {string} with identifier {string}', (userType, identifier) => {
  context.userInfo = {
    type: userType,
    guestName: userType === 'guest' ? identifier : null,
    libraryCard: userType === 'library card' ? identifier : null,
    releaseCode: userType === 'release code' ? identifier : null,
    userName: null
  };
});

When('I upload {int} files', (fileCount) => {
  context.files = Array(fileCount).fill().map((_, i) => ({
    OriginalFileNameWithExt: `test${i + 1}.pdf`
  }));
  context.phoneNumber = '+1234567890';
});

When('I upload {int} files named {string} and {string}', (fileCount, file1, file2) => {
  context.files = [
    { OriginalFileNameWithExt: file1 },
    { OriginalFileNameWithExt: file2 }
  ];
  context.phoneNumber = '+1234567890';
});

When('I upload {int} file named {string}', (fileCount, fileName) => {
  context.files = [{ OriginalFileNameWithExt: fileName }];
  context.phoneNumber = '+1234567890';
});

Then('I should receive an SMS at {string}', async (phoneNumber) => {
  context.sms = phoneNumber;
});

Then('the SMS should contain {string}', (identifier) => {
  context.identifier = identifier;
});

Then('the SMS should mention {string}', (text) => {
  context.text = text;
});

Then('the SMS should contain release code {string}', (releaseCode) => {
  context.releaseCode = releaseCode;
});

Then('the SMS should contain the customer name {string}', (customerName) => {
  context.customerName = customerName;
});
