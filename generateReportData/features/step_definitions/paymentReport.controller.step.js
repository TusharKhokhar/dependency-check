const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const config = require("../config/config");
const sinon = require("sinon");
const { expect } = require("chai");
const uploadJsonToS3 = require("../../uploadToS3");
const { LambdaClient } = require("@aws-sdk/client-lambda");
const { mockGetStsCredentials } = require("../mocks/mocks");

let event, handler, sandbox, capturedUploadData;

Before("@PaymentReportTransaction", async () => {
  sandbox = sinon.createSandbox();
  sandbox
    .stub(uploadJsonToS3, "uploadJsonToS3")
    .callsFake(async (data, customerId) => {
      capturedUploadData = data.Transactions;
      return {
        dataUrlPath: "mocked/url/path.json",
      };
    });

  sandbox.stub(LambdaClient.prototype, "send").resolves({
    StatusCode: 200,
    Payload: Buffer.from("Mocked Lambda Invocation"),
  });

  ({ handler } = require("../../index"));
});

After("@PaymentReportTransaction", () => {
  sandbox.restore();
});

Given(
  "A generateReportData event with reportsData {string} for Payment Transaction Reports",
  async function (reportType) {
    event = {
      customerId: config.customerId,
      templateData: {
        name: "transaction_html",
        engine: "handlebars",
        recipe: "html",
        shortid: "oa__jWgo5",
      },
      filters: {
        customerIds: [],
        dateFrom:
          new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0] +
          "T00:00:00.000Z",
        dateTo: new Date().toISOString().split("T")[0] + "T23:59:00.000Z",
        timeZone: "Asia/Calcutta",
        transactionType: [],
        decimalPlaces: "2",
        currency: "$",
        decimalSeparator: ".",
        transactionType: ["Print", "Scan", "Copy"]
      },
      reportType: reportType,
      connectionId: "abc123-connection-id",
      isProcessed: false,
      dataUrl: "",
      tier: "standard",
      domainName: "wss.test.org",
      logo: "",
      decoded: {
        user: {
          TenantDomain: config.customerData.DomainName,
        },
      },
    };
    await mockGetStsCredentials();
  }
);

When(
  "a calling handler with generateReportData for Payment Transaction Reports with a valid payload",
  async function () {
    await handler(event);
  }
);

Then("the Payment Transaction Reports data should be sorted by PaymentType", function () {
  expect(capturedUploadData).to.be.an("array").that.is.not.empty;

  const paymentTypes = [];

  capturedUploadData.forEach((item) => {
    expect(item).to.have.property("TransactionTypes").that.is.an("array");

    item.TransactionTypes.forEach((txType) => {
      expect(txType).to.have.nested.property("_id.PaymentType");
      const pt = txType._id.PaymentType;
      expect(pt).to.be.a("string");
      paymentTypes.push(pt);
    });
  });

  const sortedPaymentTypes = [...paymentTypes].sort((a, b) => a.localeCompare(b));
  expect(paymentTypes).to.deep.equal(sortedPaymentTypes);
});



Then("the Payment Transaction Reports response should be sent successfully", function () {
  const callArgs = LambdaClient.prototype.send.getCall(0).args[0].input;

  expect(callArgs.InvocationType).to.equal("Event");
  expect(callArgs.Payload).to.be.a("string");

  const payload = JSON.parse(callArgs.Payload);
  expect(String(payload.data.customerId)).to.equal(String(config.customerId));
});
