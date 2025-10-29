const { Given, When, Then, Before } = require("@cucumber/cucumber");
const { expect } = require("chai");
const { config } = require("../configs/config");
const { faker } = require("@faker-js/faker");
const { addPaymentStats } = require("../../../memoryDb/paymentStats");
const { getUserByCustomerId } = require("../../../memoryDb/users");
const { xenditResponse } = require("../../controllers/xendit.controller");
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
  sendStatus(code) {
    response.statusCode = code;
    response.data = { message: `OK` };
    return this;
  },
};

let route = {
  xendit: '',
};

let customerId, userData;
Before(async () => {
  customerId = config.customerId.toString();
  userData = await getUserByCustomerId(customerId);
  route.xendit = `/xendit/response/${customerId}`
});

Given("a request body with action PAID", () => {
  expect(`/xendit/response/${customerId}`).to.be.equals(route.xendit);
});

When(
  /^We send a request with valid TransactionID, Currency, Status$/,
  async () => {
    const req = {
      body: {
        response: {
          CustomerID: customerId,
          UserID: userData._id,
          TransactionID: faker.string.alphanumeric(20).toUpperCase(),
          Username: userData?.Username,
          Email: userData?.PrimaryEmail,
          Amount: 10,
          Currency: "USD",
          Status: "succeeded",
          PaymentMethod: "Xendit",
          ValueAddedMethod: "Credit Card",
          TransactionStartTime: "2025-09-18 10:45:16.966576 +0000 UTC",
          TransactionEndTime: "2025-09-18 10:45:16.966576 +0000 UTC",
        },
      },
      headers: {
        subdomain: config.domainName,
        apikey: config.apiTestKey,
        tier: "standard",
      },
    };

    await xenditResponse(req, res);
  }
);

Then("the xendit request should give status code 200", () => {
  expect(response.statusCode).to.equal(200);
});

Then(
  "the xendit response should contain message {string}",
  async (expectedMessage) => {
    expect(response.data.message).to.equal(expectedMessage);
  }
);
