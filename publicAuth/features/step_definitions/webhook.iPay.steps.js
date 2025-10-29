const { Given, When, Then, Before } = require("@cucumber/cucumber");
const { expect } = require("chai");
const { config } = require("../configs/config");
const { faker } = require("@faker-js/faker");
const { iPay88Response } = require("../../controllers/ipay88.controller");
const { addPaymentStats } = require("../../../memoryDb/paymentStats");
const { getUserByCustomerId } = require("../../../memoryDb/users");
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
};

let route = {
  iPay88: "/ipay88/response",
};
let customerId, mobileRefId, userData;
const refId = faker.string.alphanumeric(20).toUpperCase();

Before(async () => {
  customerId = config.customerId.toString();
  userData = await getUserByCustomerId(customerId);
  await addPaymentStats(customerId, refId, userData._id, "Pay88");
});

Given("a request body with action ipay88_success", () => {
  expect("/ipay88/response").to.be.equals(route.iPay88);
});

When(
  /^We send a request with valid MerchantCode, PaymentId, RefNo$/,
  async () => {
    const req = {
      body: {
        response: {
          MerchantCode: "111111",
          PaymentId: "1",
          Currency: "USD",
          Remark: "",
          TransactionID: "T0058006300",
          CustomerID: customerId,
          AuthCode: "637096",
          Status: "1",
          ErrDesc: "",
          Signature:
            "d54e9eb0b2bf598aba6023b5fd8453ffe7d8429b0f19bfeecfa119477e016a17",
          PaymentDate: "25-07-2025 16:22",
          Source: "web"
        },
        SessionID: refId,
      },
      headers: {
        subdomain: config.domainName,
        apikey: config.apiTestKey,
        tier: "standard",
      },
    };

    await iPay88Response(req, res);
  }
);

Then("the ipay88 request should give status code 200", () => {
  expect(response.statusCode).to.equal(200);
});

Then(
  "the ipay88 response should contain message {string}",
  async (expectedMessage) => {
    expect(response.data.data.message).to.equal(expectedMessage);
  }
);

/* mobile redirect */
Given("a request body with action ipay88_success for mobile", async () => {
  mobileRefId = faker.string.alphanumeric(20).toUpperCase();
  await addPaymentStats(customerId, mobileRefId, userData._id, "Pay88", "mobile");
  expect("/ipay88/response").to.be.equals(route.iPay88);
});

When("We send a request with valid MerchantCode, PaymentId, RefNo for mobile",
  async () => {
    const req = {
      body: {
        response: {
          MerchantCode: "111111",
          PaymentId: "1",
          Currency: "USD",
          Remark: "",
          TransactionID: "T0058006300",
          CustomerID: customerId,
          AuthCode: "637096",
          Status: "1",
          ErrDesc: "",
          Signature:
            "d54e9eb0b2bf598aba6023b5fd8453ffe7d8429b0f19bfeecfa119477e016a17",
          PaymentDate: "25-07-2025 16:22",
          Source: "mobile"
        },
        SessionID: mobileRefId,
      },
      headers: {
        subdomain: config.domainName,
        apikey: config.apiTestKey,
        tier: "standard",
      },
    };

    await iPay88Response(req, res);
  }
);