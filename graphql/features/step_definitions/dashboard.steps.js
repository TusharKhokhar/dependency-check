const sinon = require("sinon");
const { expect } = require("chai");
const util = require("../../helpers/util");
const { BeforeAll, After, Given, When, Then, Before } = require("@cucumber/cucumber");
const log = require("../../helpers/logger"); // Ensure you mock this if it’s a logging utility

let globalResponse;
let dbMock;
let aggregatedCollectionMock;
let dashboardQuery;

BeforeAll(() => {
  aggregatedCollectionMock = {
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([]),
    }),
  };

  usageCollectionMock = {
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([]),
    }),
  };

  dbMock = {
    collection: sinon.stub().callsFake((collectionName) => {
      if (collectionName === "Usage") return usageCollectionMock;
      if (collectionName === "AggregatedDashboardUsage")
        return aggregatedCollectionMock;
    }),
  };

  // Mock `getDatabaseCurrentLogin` to return the mocked database
  getDatabaseCurrentLoginMock = sinon
    .stub(util, "getDatabaseCurrentLogin")
    .resolves(dbMock);
});

Before(() => {
  // Reset mock call histories before each scenario
  usageCollectionMock.find().toArray.resetHistory();
  aggregatedCollectionMock.find().toArray.resetHistory();
  globalResponse = null
});

After(() => {
  sinon.restore();
});

Given("a valid graphql query for dashboard", function () {
  aggregatedCollectionMock.find().toArray.resolves([
    {
      CustomerID: "customer1",
      OrgID: "org1",
      Usage: [
        {
          TransactionDate: "01-02-2024",
          JobDeliveryMethod: "web",
          TotalPages: 1,
        },
        {
          TransactionDate: "01-13-2025",
          JobDeliveryMethod: "mobile",
          TotalPages: 6,
        },
        {
          TransactionDate: "01-20-2025",
          JobDeliveryMethod: "web",
          TotalPages: 1,
        },
      ],
    },
    {
      CustomerID: "customer2",
      OrgID: "org2",
      Usage: [
        {
          TransactionDate: "01-02-2024",
          JobDeliveryMethod: "web",
          TotalPages: 1,
        }, 
      ],
    },
  ]);

  usageCollectionMock.find().toArray.resolves([
    {
      TransactionDate: "01-02-2024",
      "Print.JobDeliveryMethod": "web",
      "Print.TotalPages": 1,
    },
    {
      TransactionDate: "01-13-2025",
      "Print.JobDeliveryMethod": "mobile",
      "Print.TotalPages": 6,
    },
    {
      TransactionDate: "01-20-2025",
      "Print.JobDeliveryMethod": "web",
      "Print.TotalPages": 1,
    },
  ]);

  let query = require("../../src/resolvers/usages");
  dashboardQuery = query.Query.dashboard;
});

When("user provide a valid timeZone for dashboard api", async function () {
  const context = {
    headers: {
      subdomain: "test-subdomain",
      tier: "standard",
    },
  };

  const args = {
    timeZone: "Asia/Kolkata",
  };
  globalResponse = await dashboardQuery(null, args, context, null);
});

When(
  "user provides a valid CustomerID and timeZone for dashboard API",
  async function () {
    const context = {
      headers: {
        subdomain: "test-subdomain",
        tier: "standard",
      },
      data: {
        CustomerID: "customer1",
        customerIdsFilter: ["customer1"], // Pass the specific CustomerID here
        customerIdsStrings: ["customer1"],
        isKiosk: false,
        user: {
          Permissions: ["Analytics"],
        },
      },
      operationName: "Dashboard",
    };

    const args = {
      timeZone: "Asia/Kolkata",
    };

    globalResponse = await dashboardQuery(null, args, context, null);
  }
);

When("an error occurs in the dashboard resolver", async function () {
  // Mock `collection` to throw an error
  dbMock.collection = sinon
    .stub()
    .throws(new Error("Database connection error"));

  const context = {
    headers: {
      subdomain: "test-subdomain",
      tier: "standard",
    },
    data: {
      CustomerID: "test-customer-id",
      customerIdsFilter: ["test-customer-id"],
      customerIdsStrings: ["test-customer-id"],
      isKiosk: false,
      user: {
        Permissions: ["Analytics"],
      },
    },
    operationName: "Dashboard",
  };

  const args = {
    timeZone: "Asia/Kolkata",
  };

  // Mock log.error
  sinon.stub(log, "error");

  // Catch the thrown error
  try {
    await dashboardQuery(null, args, context, null);
  } catch (error) {
    globalResponse = error;
  }
});

Then("user should get the dashboard reports", function () {
  expect(globalResponse).to.have.property("DayWiseData");
  expect(globalResponse).to.have.property("DeliveryWiseData");
  expect(globalResponse).to.have.property("DeliveryByDateWiseData");
});

Then("structure of the response should be correct", function () {
  expect(globalResponse).to.have.property("DayWiseData").that.is.an("array");
  expect(globalResponse)
    .to.have.property("DeliveryWiseData")
    .that.is.an("object");
  expect(globalResponse)
    .to.have.property("DeliveryByDateWiseData")
    .that.is.an("object");
});

Then("DayWiseData should only contain date and count fields", function () {
  const result = globalResponse?.DayWiseData;

  result.forEach((item) => {
    expect(item).to.have.all.keys("date", "count");
  });
});

Then(
  "DeliveryWiseData should contain only expected keys with count field",
  function () {
    const result = globalResponse.DeliveryWiseData;
    const expectedKeys = [
      "web",
      "mobile",
      "driver",
      "desktop",
      "kiosk",
      "email",
    ];

    // Check that only expected keys are present
    Object.keys(result).forEach((key) => {
      expect(expectedKeys).to.include(key);
    });

    // Check that each expected key contains an array with count field
    expectedKeys.forEach((key) => {
      if (result.hasOwnProperty(key)) {
        expect(result[key]).to.be.an("array");
        result[key].forEach((item) => {
          expect(item).to.have.all.keys("count");
        });
      }
    });
  }
);

Then(
  "DeliveryByDateWiseData should contain only expected keys with date and count fields",
  function () {
    const result = globalResponse.DeliveryByDateWiseData;
    const expectedKeys = [
      "web",
      "mobile",
      "driver",
      "desktop",
      "kiosk",
      "email",
    ];

    // Check that only expected keys are present
    Object.keys(result).forEach((key) => {
      expect(expectedKeys).to.include(key);
    });

    // Check that each expected key contains an array with date and count fields
    expectedKeys.forEach((key) => {
      if (result.hasOwnProperty(key)) {
        expect(result[key]).to.be.an("array");
        result[key].forEach((item) => {
          expect(item).to.have.all.keys("date", "count");
        });
      }
    });
  }
);

Then("the error should be logged and an error should be thrown", function () {
  expect(globalResponse.message).to.equal("Error: Database connection error");
});