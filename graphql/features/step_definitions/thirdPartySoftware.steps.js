const {
  Given,
  When,
  Then,
  setDefaultTimeout,
  Before,
} = require("@cucumber/cucumber");
const expect = require("chai").expect;
const { config } = require("../configs/config");
const { handler } = require("../../graphql");
const { getCustomer } = require("../../../memoryDb/customer");
const {
  addAccountSync,
  addProton,
  addEmail,
  addSmartphone,
  addNetwork
} = require("../../../memoryDb/thirdPartySoftware");
const { thirdPartySoftware } = require("../queries/thirdPartySoftware");
const { add } = require("lodash");

let globalResponse = {};
let customerID;

setDefaultTimeout(100000);

Before("thirdPartySoftware", async () => {
  const customerData = await getCustomer();
  customerID = customerData._id;
});

Given("I have valid input to retrieve third-party software", async () => {
  await addAccountSync(customerID, "AccountSyncIntegration");
  await addProton(customerID, "ProtonIntegration");
  await addEmail(customerID, "EmailIntegration");
  await addSmartphone(customerID, "SmartphoneIntegration");
  await addNetwork(customerID, "NetworkIntegration");
  return thirdPartySoftware.query;
});

When("I send a request to get the third-party software", async function () {
  const event = {
    version: "2.0",
    routeKey: "POST /graphql",
    rawPath: "/graphql",
    rawQueryString: "",
    headers: {
      apikey: config.apiTestKey,
      tier: config.tier,
      authorization: config.token,
      subdomain: config.domainName,
      "content-type": "application/json",
    },
    requestContext: {
      http: {
        method: "POST",
        path: "/graphql",
      },
    },
    body: JSON.stringify(thirdPartySoftware),
    isBase64Encoded: false,
  };

  const context = { data: { customerIdsStrings: [customerID] } };

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the getThirdPartySoftware API response should be successful", () => {
  expect(globalResponse.response.body.data.getThirdPartySoftware).to.not.be
    .null;
});

Given("I have valid input to retrieve third-party software with a pattern", () => {
  thirdPartySoftware.variables.paginationInput["pattern"] =
    "AccountSyncIntegration";
  return thirdPartySoftware.query;
});

Then(
  "the getThirdPartySoftware API response should return only data matching the pattern",
  () => {
    const thirdPartySoftware =
      globalResponse.response.body.data.getThirdPartySoftware
        .thirdPartySoftware;

    const isPresent = thirdPartySoftware.every((obj) =>
      Object.values(obj).some((val) =>
        typeof val === "string" && val.includes("AccountSyncIntegration")
      )
    );

    expect(isPresent).to.be.true;
  }
);

Given(
  "I request third-party software with pagination input for page 1 and a limit of 2",
  async () => {
    await addAccountSync(customerID, "FAX");
    await addProton(customerID, "Email");
    await addEmail(customerID, "Smartphone");
    await addSmartphone(customerID, "SmartphoneIntegration");
    await addNetwork(customerID, "NetworkIntegration");
    thirdPartySoftware.variables.paginationInput["pageNumber"] = 1;
    thirdPartySoftware.variables.paginationInput["limit"] = 2;
    delete thirdPartySoftware.variables.paginationInput.pattern;
    return thirdPartySoftware.query;
  }
);

Then("I should receive at most 2 third-party software entries", () => {
  const thirdPartySoftwareData =
    globalResponse.response.body.data.getThirdPartySoftware.thirdPartySoftware;
  expect(thirdPartySoftwareData.length).to.lessThanOrEqual(2);
});

Given(
  "a valid GraphQL query with pagination to retrieve third-party software sorted in descending order",
  async () => {
    thirdPartySoftware.variables.paginationInput["sortKey"] =
      "ThirdPartySoftwareName";
    thirdPartySoftware.variables.paginationInput["sort"] = "dsc";
    delete thirdPartySoftware.variables.paginationInput.pageNumber;
    delete thirdPartySoftware.variables.paginationInput.limit;
    return thirdPartySoftware.query;
  }
);

Then(
  "the response should contain third-party software names sorted in descending order",
  () => {
    const thirdPartySoftwareData =
      globalResponse.response.body.data.getThirdPartySoftware
        .thirdPartySoftware;

    const isSortedDescending = thirdPartySoftwareData.every(
      (item, index, arr) => {
        return (
          index === 0 ||
          item.ThirdPartySoftwareName <= arr[index - 1].ThirdPartySoftwareName
        );
      }
    );

    expect(isSortedDescending).to.be.true;
  }
);

Given(
  "a valid GraphQL query with pagination to retrieve third-party software sorted in ascending order",
  async () => {
    thirdPartySoftware.variables.paginationInput["sortKey"] =
      "ThirdPartySoftwareName";
    thirdPartySoftware.variables.paginationInput["sort"] = "asc";
    delete thirdPartySoftware.variables.paginationInput.pageNumber;
    delete thirdPartySoftware.variables.paginationInput.limit;
    return thirdPartySoftware.query;
  }
);

Then(
  "the response should contain third-party software names sorted in ascending order",
  () => {
    const thirdPartySoftwareData =
      globalResponse.response.body.data.getThirdPartySoftware
        .thirdPartySoftware;
    const isSortedAscending = thirdPartySoftwareData.every(
      (item, index, arr) => {
        return (
          index === 0 ||
          item.ThirdPartySoftwareName >= arr[index - 1].ThirdPartySoftwareName
        );
      }
    );

    expect(isSortedAscending).to.be.true;
  }
);
