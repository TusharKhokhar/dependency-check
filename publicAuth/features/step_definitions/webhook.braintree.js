const { Given, When, Then, Before } = require("@cucumber/cucumber");
const { expect } = require("chai");
const { config } = require("../configs/config");
const { faker } = require("@faker-js/faker");
const { getUserByCustomerId } = require("../../../memoryDb/users");
const { braintreeTransaction } = require("../../controllers/braintree.controller");
let response = {};
const res = {
  status(code) {
    response.statusCode = code;
    return this;
  },
  send(data) {
    response.data = data;
    return this;
  },
  json(data) {
    response.data = data;
    return this;
  },
  redirect(url) {
    response.redirectedTo = url;
    response.statusCode = 200;
    return this;
  }
};

let route = {
  braintree: '/braintree/transaction',
};

let customerId, userData;
const transactionId = faker.string.alphanumeric(20).toUpperCase();

Before(async () => {
  customerId = config.customerId.toString();
  userData = await getUserByCustomerId(customerId);
});

Given("a request body with action submitted_for_settlement", () => {
  expect(`/braintree/transaction`).to.be.equals(route.braintree);
});

When(
  /^We send a request with valid TransactionID, Currency, Status for braintree$/,
  async () => {
    const req = {
      body: {
        response: {
          CustomerID: customerId,
          UserID: userData._id,
          TransactionID: transactionId,
          Username: userData?.Username,
          Email: userData?.PrimaryEmail,
          Amount: 10,
          Currency: "USD",
          Status: "succeeded",
          PaymentMethod: "Xendit",
          ValueAddedMethod: "Credit Card",
          TransactionStartTime: "2025-09-18 10:45:16.966576 +0000 UTC",
          TransactionEndTime: "2025-09-18 10:45:16.966576 +0000 UTC",
          failureURL: 'https://test.eprintitsaas.org/sucess',
          successURL: 'https://test.eprintitsaas.org/fail',
        },
      },
      headers: {
        subdomain: config.domainName,
        apikey: config.apiTestKey,
        tier: "standard",
      },
    };

    await braintreeTransaction(req, res);
  }
);

Then("the braintree request should give status code 200", () => {
  expect(response.statusCode).to.equal(200);
});
