const { Given, And, When, Then, Before, After } = require("@cucumber/cucumber");
const chai = require("chai");
const { config } = require("../configs/config");
const { handler } = require("../../graphql");
const { getBalance, sendTransaction, GetPay88 } = require("../queries/payment");
const { getEvent } = require("../mocks/event");
const { addThingData } = require("../../../memoryDb/things");
const { addDevice } = require("../../../memoryDb/device");
const sinon = require("sinon");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const atriumModule = require("../../services/payments/atrium");
const { mockGetSecretManagerKey } = require("../mocks/mocks");
const { addPaymentConfiguration } = require("../mutations/payment.mutation");
const { getDb } = require("../../config/dbHandler");
const { faker } = require("@faker-js/faker");

const expect = chai.expect;
let axiosStub;
let thingID;
let globalResponse = {};
const context = {};
let authTokenStub, tokenStub, mockBalance;
let transactionID = faker.string.alphanumeric(20).toUpperCase();

Before('@Payment',async function () {
  response = null;
  await mockGetSecretManagerKey("atrium");
  axiosStub = sinon.stub(axios, "post");
  authTokenStub = sinon.stub(atriumModule, "atriumAuthToken");
  tokenStub = sinon.stub(atriumModule, "atriumGetToken");
  const customerId = config.customerId;
  const thingTagId = uuidv4();
  const { insertedId: deviceId } = await addDevice(customerId);
  const { insertedId: thingId } = await addThingData(
    customerId,
    deviceId,
    thingTagId
  );
  thingID = thingId;
});

After(() => {
  sinon.restore();
});

// Scenario: Successful balance retrieval by CBORD
Given(
  "a valid input for CBORD PaymentType, ThingID, CustomerId, and CardNumber",
  function () {
    getBalance.variables.getBalanceInput.CardNumber = "1234";
    getBalance.variables.getBalanceInput.PaymentType = "CBORD";
    getBalance.variables.getBalanceInput.ThingID = thingID;
  }
);

When(
  "the getBalance function is called for CBORD PaymentType",
  async function () {
    const event = getEvent(getBalance);
    const mockXmlResponse = `<Message><CSGoldMessages><Class>0210</Class><Code>319999</Code><SysTraceAuditNumber>000064</SysTraceAuditNumber><ResponseCode>00</ResponseCode><Location>3802</Location><PaymentMedia>02</PaymentMedia><Plan>1</Plan><ActualSVCbalance>USDC000000100000</ActualSVCbalance><AmountDue>USDC000000000000</AmountDue><EndSVCbalance>USDC000000100000</EndSVCbalance><TaxPercent1>USDC000000000000</TaxPercent1><ApprovedAmount>USDC000000000000</ApprovedAmount><PatronID>119505</PatronID><Patron>EPRINTIT, EPRINTIT04</Patron><HostReceipt>EPRINTIT04\n</HostReceipt><HostMessage>|Approved - Balance for plan 1 is $1,000.00</HostMessage><TransID>44470106</TransID></CSGoldMessages></Message>\n`;

    axiosStub.resolves({ data: mockXmlResponse });
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then(
  "a successful response with balance details should be returned for CBORD PaymentType",
  function () {
    const result = globalResponse.response.body.data.getBalance;
    expect(result).to.not.be.empty;
    expect(result).to.have.property("Message").that.includes("Approved");
    expect(result).to.have.property("StatusCode").that.equals(200);
  }
);

// Scenario: Successful balance retrieval by Atrium
Given(
  "a valid input for Atrium PaymentType, ThingID, CustomerId, and CardNumber",
  function () {
    getBalance.variables.getBalanceInput.CardNumber = "1234";
    getBalance.variables.getBalanceInput.PaymentType = "Atrium";
    getBalance.variables.getBalanceInput.ThingID = thingID;
  }
);

When(
  "the getBalance function is called for Atrium PaymentType",
  async function () {
    authTokenStub.resolves("mockAuthData");
    tokenStub.resolves("mockAccessToken");

    const event = getEvent(getBalance);

    const mockBalance = {
      txid: 2855864,
      approved: 1,
      code: "APPR001",
      message: "Approved",
      amount: {
        remaining: 96053,
        currency: "USD",
        total: null,
      },
    };

    axiosStub.resolves({ data: mockBalance });

    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then(
  "a successful response with balance details should be returned for Atrium PaymentType",
  function () {
    const result = globalResponse.response.body.data.getBalance;
    expect(result).to.not.be.empty;
    expect(result).to.have.property("Message").that.includes("Approved");
    expect(result).to.have.property("StatusCode").that.equals(200);
  }
);

// Scenario: Successful sendTransaction by CBORD
Given(
  "a valid input for CBORD PaymentType, ThingID, CustomerId, CardNumber, Amount, Device and Currency",
  function () {
    sendTransaction.variables.sendTransactionInput.CardNumber = "1234";
    sendTransaction.variables.sendTransactionInput.PaymentType = "CBORD";
    sendTransaction.variables.sendTransactionInput.ThingID = thingID;
  }
);

When(
  "the sendTransaction function is called for CBORD PaymentType",
  async function () {
    const event = getEvent(sendTransaction);
    const mockXmlFirstResponse = `<Message><CSGoldMessages><Class>0210</Class><Code>009090</Code><SysTraceAuditNumber>000064</SysTraceAuditNumber><ResponseCode>00</ResponseCode><Location>3802</Location><PaymentMedia>01</PaymentMedia><Plan>1000</Plan><AmountDue>USDC000000000000</AmountDue><MealsCounterBalance>USDC000000000000</MealsCounterBalance><MealsRemain>USDC000000000999</MealsRemain><NumberMealsSmallBucket>USDC000000000001</NumberMealsSmallBucket><TaxPercent1>USDC000000000000</TaxPercent1><ApprovedAmount>USDC000000000100</ApprovedAmount><PatronID>119505</PatronID><Patron>EPRINTIT, EPRINTIT04</Patron><HostMessage>Approved - 999 meals left for meal plan 1000 at 20250402 071036</HostMessage><TransID>${transactionID}</TransID></CSGoldMessages></Message>\n`;
    const mockXmlSecondResponse = `<Message><CSGoldMessages><Class>0210</Class><Code>009090</Code><SysTraceAuditNumber>000064</SysTraceAuditNumber><ResponseCode>00</ResponseCode><Location>3802</Location><PaymentMedia>01</PaymentMedia><Plan>1000</Plan><AmountDue>USDC000000000000</AmountDue><MealsCounterBalance>USDC000000000000</MealsCounterBalance><MealsRemain>USDC000000000999</MealsRemain><NumberMealsSmallBucket>USDC000000000001</NumberMealsSmallBucket><TaxPercent1>USDC000000000000</TaxPercent1><ApprovedAmount>USDC000000000100</ApprovedAmount><PatronID>119505</PatronID><Patron>EPRINTIT, EPRINTIT04</Patron><HostMessage>Success - 999 meals left for meal plan 1000 at 20250402 071036</HostMessage><TransID>${transactionID}</TransID></CSGoldMessages></Message>\n`;

    axiosStub.onFirstCall().resolves({ data: mockXmlFirstResponse });
    axiosStub.onSecondCall().resolves({ data: mockXmlSecondResponse });

    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
      sinon.assert.calledTwice(axiosStub);
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    } finally {
      axiosStub.restore();
    }
  }
);

Then(
  "a successful response with transaction details should be returned for CBORD PaymentType",
  function () {
    const result = globalResponse.response.body.data.sendTransaction;
    expect(result).to.not.be.empty;
    expect(result).to.have.property("message").that.includes("Approved");
    expect(result).to.have.property("statusCode").that.equals(200);
  }
);

// Scenario: Successful sendTransaction by Atrium
Given(
  "a valid input for Atrium PaymentType, ThingID, CustomerId, CardNumber, Amount, Device and Currency",
  function () {
    sendTransaction.variables.sendTransactionInput.CardNumber = "1234";
    sendTransaction.variables.sendTransactionInput.PaymentType = "Atrium";
    sendTransaction.variables.sendTransactionInput.ThingID = thingID;
  }
);

When(
  "the sendTransaction function is called for Atrium PaymentType",
  async function () {
    authTokenStub.resolves("mockAuthData");
    tokenStub.resolves("mockAccessToken");

    const event = getEvent(sendTransaction);

    mockBalance = {
      txid: transactionID,
      approved: 1,
      code: "APPR001",
      message: "Approved",
      amount: {
        remaining: 96052,
        currency: "USD",
        applied: 1,
        discount: 0,
        total: 1,
      },
    };

    axiosStub.resolves({ data: mockBalance });
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then(
  "a successful response with transaction details should be returned for Atrium PaymentType",
  function () {
    const result = globalResponse.response.body.data.sendTransaction;
    expect(result).to.not.be.empty;
    expect(result).to.have.property("message").that.includes("Approved");
    expect(result).to.have.property("statusCode").that.equals(200);
  }
);

Then("the PaymentStats record in MongoDB should have status {string}",
  async function(expectedStatus) {
  const db = await getDb();
    const paymentRecord = await db
      .collection("PaymentStats")
      .findOne({ TransactionID: transactionID });

    expect(paymentRecord).to.not.be.null;
    expect(paymentRecord.Status).to.equal(expectedStatus);
  }
)

// Scenario: Failed getBalance retrieval with wrong CardNumber
Given(
  "a valid input for getBalance PaymentType, ThingID, and CustomerId",
  function () {
    getBalance.variables.getBalanceInput.PaymentType = "CBORD";
    getBalance.variables.getBalanceInput.ThingID = thingID;
  }
);

Given("an invalid or non-existent CardNumber for getBalance", function () {
  getBalance.variables.getBalanceInput.CardNumber = "000000000";
});

When(
  "the getBalance function is called with the wrong CardNumber for CBORD PaymentType",
  async function () {
    const event = getEvent(getBalance);
    const mockXmlResponse = `<Message><CSGoldMessages><Class>0210</Class><Code>319999</Code><SysTraceAuditNumber>000064</SysTraceAuditNumber><ResponseCode>05</ResponseCode><Location>3802</Location><PaymentMedia>02</PaymentMedia><Plan>-1</Plan><ActualSVCbalance>USDC000000000000</ActualSVCbalance><AmountDue>USDC000000000000</AmountDue><EndSVCbalance>USDC000000000000</EndSVCbalance><TaxPercent1>USDC000000000000</TaxPercent1><ApprovedAmount>USDC000000000000</ApprovedAmount><PatronID>-1</PatronID><Patron>$(Last_Name), $(First_Name)</Patron><HostMessage>Patron Data Not Found</HostMessage><TransID>44472176</TransID></CSGoldMessages></Message>\n`;

    axiosStub.resolves({ data: mockXmlResponse });
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then(
  "an error response should be returned indicating failure to retrieve the balance",
  function () {
    const result = globalResponse.response.body.data.getBalance;
    expect(result).to.not.be.empty;
    expect(result)
      .to.have.property("Message")
      .that.includes("Patron Data Not Found");
    expect(result).to.have.property("StatusCode").that.equals(400);
  }
);

// Scenario: Failed sendTransaction with wrong CardNumber
Given(
  "a valid input for sendTransaction PaymentType, ThingID, and CustomerId",
  function () {
    sendTransaction.variables.sendTransactionInput.PaymentType = "CBORD";
    sendTransaction.variables.sendTransactionInput.ThingID = thingID;
  }
);

Given("an invalid or non-existent CardNumber for sendTransaction", function () {
  sendTransaction.variables.sendTransactionInput.CardNumber = "000000000";
});

When(
  "the sendTransaction function is called with the wrong CardNumber for CBORD PaymentType",
  async function () {
    const event = getEvent(sendTransaction);
    const mockXmlResponse = `<Message><CSGoldMessages><Class>0210</Class><Code>319999</Code><SysTraceAuditNumber>000064</SysTraceAuditNumber><ResponseCode>05</ResponseCode><Location>3802</Location><PaymentMedia>02</PaymentMedia><Plan>-1</Plan><ActualSVCbalance>USDC000000000000</ActualSVCbalance><AmountDue>USDC000000000000</AmountDue><EndSVCbalance>USDC000000000000</EndSVCbalance><TaxPercent1>USDC000000000000</TaxPercent1><ApprovedAmount>USDC000000000000</ApprovedAmount><PatronID>-1</PatronID><Patron>$(Last_Name), $(First_Name)</Patron><HostMessage>Patron Data Not Found</HostMessage><TransID>44472175</TransID></CSGoldMessages></Message>\n`;

    axiosStub.resolves({ data: mockXmlResponse });
    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then(
  "an error response should be returned indicating failure to send the transaction",
  function () {
    const result = globalResponse.response.body.data.sendTransaction;
    expect(result)
      .to.have.property("message")
      .that.includes("Patron Data Not Found");
    expect(result).to.have.property("statusCode").that.equals(400);
  }
);

// Scenario: Successfully add a new payment configuration
Given(
  "I have a valid payment input with isActive set to true",
  function () {
    addPaymentConfiguration.variables.addPaymentInput.IsActive = true
  }
);

When("I send a request to add payment configuration", async function () {
  const event = getEvent(addPaymentConfiguration);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response of payment configuration should have status code {int}",function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
}
);

Then("the response of payment configuration should have isActive set to true", function () {
  const paymentConfiguration = globalResponse.response.body.data.addPaymentConfiguration;
  expect(paymentConfiguration)
    .to.have.property("IsActive")
    .that.is.a("boolean")
    .and.is.true;
});

Given(
  "I have a valid payment input for iPay88",
  function () {
    GetPay88.variables.pay88SignatureInput.Amount = "15.555"
    GetPay88.variables.pay88SignatureInput.Currency = "usd"
  }
);

When("I send a request to add payment configuration for iPay88", async function () {
  const event = getEvent(GetPay88);

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
  'the response should return {string} with status code {int} and required payment fields',
  function (expectedMessage, expectedStatusCode) {
    const responseData = globalResponse?.response?.body?.data?.getPay88Signature;

    expect(responseData.Message).to.equal(expectedMessage);
    expect(responseData.StatusCode).to.equal(expectedStatusCode);

    const requiredFields = [
      'RefNo',
      'Amount',
      'Currency',
      'MerchantCode',
      'ResponseURL',
      'Signature',
      'ApprovalURL',
      'UnApprovalURL',
      'PaymentId',
      'BackendURL'
    ];

    requiredFields.forEach(field => {
      expect(responseData[field], `Missing or invalid field: ${field}`).to.exist;
    });
  }
);

// Scenario: Successfully add a new payment PortOne
Given(
  "I have a valid payment input for PortOne",
  function () {
    return addPaymentConfiguration.variables.addPaymentInput;
  }
);

When("I send a request to add payment configuration for PortOne", async function () {
  const event = getEvent(addPaymentConfiguration);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);    
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should have status code {int} and response should have PortOne details", function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
  const paymentConfiguration = globalResponse.response.body.data.addPaymentConfiguration;
  expect(paymentConfiguration).to.have.property("_id");
  expect(paymentConfiguration).to.have.property("PortOne").that.is.an("object");
});
