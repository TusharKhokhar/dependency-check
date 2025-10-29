const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const sinon = require("sinon");
const { mockGetStsCredentials } = require("../mocks/mocks");
const uploadCSVToS3 = require("../../uploadToS3");
const wssHelpers = require("../../reports/helpers/wss");

let sandbox, event, handler, sendToWssStub;

Before("@csvReport", async () => {
  sandbox = sinon.createSandbox();
  sandbox.stub(uploadCSVToS3, "uploadCsvToS3").resolves({
    dataUrlPath: "mocked/url/path.csv",
  });
  sendToWssStub = sandbox.stub(wssHelpers, "sendToWss");
  ({ handler } = require("../../index"));
});

After("@csvReport", () => {
  sandbox.restore();
});

Given(
  "A generateReportData event with reportsData {string} for csvReport",
  async function (reportType) {
    event = {
      customerId: "660da8f4d3390988e5edce08",
      templateData: {
        name: "excutive_summary_table_html",
        engine: "handlebars",
        recipe: "html",
        shortid: "IyjmPZUgE",
      },
      filters: {
        submissionType: [],
        timezone: "Asia/Calcutta",
        colorType: [],
        transactionType: [],
        orientation: [],
        staple: null,
        paperSize: [],
        duplex: null,
        customerId: ["660da8f4d3390988e5edce08"],
        locationId: [],
        documentType: [],
        startDate: "2024-04-01T00:00:00.000Z",
        endDate: "2025-04-16T23:59:00.000Z",
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
          TenantDomain: "real",
        },
      },
    };
    await mockGetStsCredentials();
  }
);

When("a calling handler with valid payload", async function () {
  await handler(event);
});

Then("the report upload Successfully and send dataUrlPath", function () {
  sinon.assert.calledOnce(sendToWssStub);

  sinon.assert.calledWithExactly(
    sendToWssStub,
    "abc123-connection-id",
    "CSV Report generated successfully",
    "mocked/url/path.csv",
    true
  );
});
