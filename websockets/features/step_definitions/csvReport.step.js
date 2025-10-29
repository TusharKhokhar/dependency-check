const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const sinon = require("sinon");
const { expect } = require("chai");
const validateToken = require("../../services/validateToken");
const { mockGetStsCredentials } = require("../mocks/mocks");
const { Lambda } = require("@aws-sdk/client-lambda");
const { GENERATE_REPORT_LAMBDA } = require("../../constants/constants");
const config = require("../../config/config");

let event, lambdaInvokeStub, handlerModule, sandbox;

Before("@CSVReport", async () => {
  sandbox = sinon.createSandbox();

  sandbox.stub(validateToken, "validateToken").returns({
    error: null,
    decoded: {
      _id: "mockUserId",
      user: {
        _id: "mockUserId",
        CustomerID: "mockCustomerID",
        IsActive: true,
        IsDeleted: false,
      },
      customerIdsFilter: ["mockCustomerID"],
      customerIdsStrings: ["mockCustomerID"],
    },
  });

  lambdaInvokeStub = sandbox.stub().resolves({ StatusCode: 200 });
  sandbox.stub(Lambda.prototype, "invoke").value(lambdaInvokeStub);

  handlerModule = require("../../app");
});

Given(
  "A WebSocket event with routeKey {string} and actionItem {string} for csvReport",
  async function (routeKey, actionItem) {
    event = {
      requestContext: { connectionId: "test-connection", routeKey },
      body: JSON.stringify({
        body: {
          actionItem,
          tier: "standard",
          domain: "admin",
          customerId: "cust-001",
          templateData: {},
          filters: { customerIds: ["cust-001"] },
          reportType: "csv",
          token: "validToken",
          apiKey: config.apiKey,
          isProcessed: false,
          dataUrl: "",
          domainName: "admin",
          logo: "logo-url",
        },
      }),
    };
    await mockGetStsCredentials();
  }
);

When("a calling handler with valid payload", async function () {
  await handlerModule.handler(event);
});

Then("the report generation Lambda should be invoked", function () {
  expect(lambdaInvokeStub.calledOnce).to.be.true;
  const args = lambdaInvokeStub.getCall(0).args[0];
  expect(args.FunctionName).to.equal(GENERATE_REPORT_LAMBDA);

  const payload = JSON.parse(args.Payload);
  expect(payload.customerId).to.equal("cust-001");
});
