const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const config = require("../config/config");
const sinon = require("sinon");
const { expect } = require("chai");
const uploadJsonToS3 = require("../../uploadToS3");
const { LambdaClient } = require("@aws-sdk/client-lambda");
const { mockGetStsCredentials } = require("../mocks/mocks");

let event, handler, sandbox, capturedUploadData;

Before("@PrinterUsageSummary", async () => {
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

After("@PrinterUsageSummary", () => {
  sandbox.restore();
});

Given(
  "A generateReportData event with reportsData {string} for Printer Usage Summary Reports",
  async function (reportType) {
    event = {
      customerId: config.customerId,
      templateData: {
        name: "printer_usage_html",
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
        locationIds: [],
        timeZone: "Asia/Calcutta",
        submissionType: [],
        printType: [],
        colorType: [],
        primaryColor: "#25d366",
        orientation: [],
        duplex: null,
        staple: null,
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
  "a calling handler with generateReportData for Printer Usage Summary Reports with a valid payload",
  async function () {
    await handler(event);
  }
);

Then(
  "the Printer Usage Summary Reports data should be sorted by Device",
  function () {
    expect(capturedUploadData).to.have.property("Customers").that.is.an("array")
      .that.is.not.empty;

    capturedUploadData.Customers.forEach((customer) => {
      expect(customer).to.have.property("PrinterData").that.is.an("array");

      const devices = customer.PrinterData.map((pd) => {
        expect(pd).to.have.nested.property("_id.Device");
        return pd._id.Device;
      });

      const sortedDevices = [...devices].sort((a, b) => a.localeCompare(b));
      expect(devices).to.deep.equal(sortedDevices);
    });
  }
);

Then(
  "the Printer Usage Summary Reports response should be sent successfully",
  function () {
    const callArgs = LambdaClient.prototype.send.getCall(0).args[0].input;

    expect(callArgs.InvocationType).to.equal("Event");
    expect(callArgs.Payload).to.be.a("string");

    const payload = JSON.parse(callArgs.Payload);
    expect(String(payload.data.customerId)).to.equal(String(config.customerId));
  }
);
