const { Given, When, Then, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
const config = require("../config/config");
const sinon = require("sinon");
const { expect } = require("chai");
const uploadJsonToS3 = require("../../uploadToS3");
const { LambdaClient } = require("@aws-sdk/client-lambda");
const { mockGetStsCredentials } = require("../mocks/mocks");

let event, handler, sandbox, capturedUploadData;

setDefaultTimeout(100000);
Before("@KioskTransaction", async () => {
  sandbox = sinon.createSandbox();
  sandbox
    .stub(uploadJsonToS3, "uploadJsonToS3")
    .callsFake(async (data, customerId) => {
      capturedUploadData = data;
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

After("@KioskTransaction", () => {
  sandbox.restore();
});

Given(
  "A generateReportData event with reportsData {string} for Kiosk Transaction Reports",
  async function (reportType) {
    event = {
      customerId: config.customerId,
      templateData: {
        name: "value_added_html",
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
        paymentType: [],
        transactionType: [],
        timeZone: "Asia/Calcutta",
        submissionType: [],
        printType: [],
        colorType: [],
        staple: null,
        orientation: [],
        duplex: null,
        paperSize: [],
        decimalPlaces: 2,
        currency: "$",
        decimalSeparator: ".",
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
  "a calling handler with generateReportData for Kiosk Transaction Reports with a valid payload",
  async function () {
    await handler(event);
  }
);

Then(
  "the Kiosk Transaction Reports data should be sorted by TransactionType",
  function () {
    const transactions = capturedUploadData.Transactions;
    const transactionTypes = [];

    transactions.forEach((customer) => {
      expect(customer).to.have.property("Things").that.is.an("array");

      customer.Things.forEach((thing) => {
        expect(thing).to.have.property("TransactionTypes").that.is.an("array");

        thing.TransactionTypes.forEach((txType) => {
          expect(txType).to.have.nested.property("_id.TransactionType");
          const type = txType._id.TransactionType;
          expect(type).to.be.a("string");
          transactionTypes.push(type);
        });
      });
    });

    const sortedTransactionTypes = [...transactionTypes].sort((a, b) =>
      a.localeCompare(b)
    );

    expect(transactionTypes).to.deep.equal(sortedTransactionTypes);
  }
);

Then(
  "the Kiosk Transaction Reports response should be sent successfully",
  function () {
    const callArgs = LambdaClient.prototype.send.getCall(0).args[0].input;

    expect(callArgs.InvocationType).to.equal("Event");
    expect(callArgs.Payload).to.be.a("string");

    const payload = JSON.parse(callArgs.Payload);
    expect(String(payload.data.customerId)).to.equal(String(config.customerId));
  }
);

Given(
  "a generateReportData event with {string} and PaymentType filter {string}",
  async function (reportType, paymentType) {
    event = {
      customerId: config.customerId,
      templateData: {
        name: "value_added_html",
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
        paymentType: [paymentType],
        transactionType: [],
        timeZone: "Asia/Calcutta",
        submissionType: [],
        printType: [],
        colorType: [],
        staple: null,
        orientation: [],
        duplex: null,
        paperSize: [],
        decimalPlaces: 2,
        currency: "$",
        decimalSeparator: ".",
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
  "the handler is called for Kiosk Transaction Reports",
  async function () {
    await handler(event);
  }
);

Then("it should return data filtered by PaymentType like {string} and {string}",
  function (value1, value2) {
    const allowedPaymentTypes = [value1,value2];
    const transactions = capturedUploadData.Transactions;    
    transactions.forEach((customer) => {
      expect(customer).to.have.property("Things").that.is.an("array");
      customer.Things.forEach((thing) => {
        expect(thing).to.have.property("TransactionTypes").that.is.an("array");
        thing.TransactionTypes.forEach((txType) => {
          expect(txType).to.have.property("data").that.is.an("array");
          txType.data.forEach((entry) => {
            expect(entry._id)
              .to.have.property("PaymentType")
              .that.is.a("string");
            expect(allowedPaymentTypes).to.include(entry._id.PaymentType);
          });
        });
      });
    });
  }
);
