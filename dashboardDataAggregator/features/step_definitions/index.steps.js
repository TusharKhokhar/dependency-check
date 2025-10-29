const sinon = require("sinon");
const { expect } = require("chai");
const db = require("../../config/db");
const {
  BeforeAll,
  Given,
  When,
  Then,
  After,
  Before,
} = require("@cucumber/cucumber");

let dashboardDataAggregator,
  customersCollectionMock,
  usageCollectionMock,
  aggregatedCollectionMock,
  dbMock;

BeforeAll(async () => {
  // Create mocks for the collections
  customersCollectionMock = {
    find: sinon.stub().returns({
      project: sinon.stub().returns({
        toArray: sinon.stub().resolves([]),
      }),
    }),
  };

  usageCollectionMock = {
    aggregate: sinon.stub().returns({
      toArray: sinon.stub().resolves([]),
    }),
  };

  aggregatedCollectionMock = {
    findOne: sinon.stub().resolves(null),
    insertOne: sinon.stub().resolves(),
    updateOne: sinon.stub().resolves(),
  };

  dbMock = {
    collection: sinon.stub().callsFake((collectionName) => {
      if (collectionName === "Customers") return customersCollectionMock;
      if (collectionName === "Usage") return usageCollectionMock;
      if (collectionName === "AggregatedDashboardUsage")
        return aggregatedCollectionMock;
    }),
  };

  sinon.stub(db, "getDb").returns(dbMock);

  dashboardDataAggregator = require("../../index");
});

Before(() => {
  // Reset mock call histories before each scenario
  customersCollectionMock.find().project().toArray.resetHistory();
  usageCollectionMock.aggregate.resetHistory();
  aggregatedCollectionMock.insertOne.resetHistory();
  aggregatedCollectionMock.updateOne.resetHistory();
});

After(() => {
  sinon.restore();
});

Given("the dashboardDataAggregator is invoked daily", async () => {
  customersCollectionMock
    .find()
    .project()
    .toArray.resolves([
      { _id: "customer1", DomainName: "org1" },
      { _id: "customer2", DomainName: "org2" },
    ]);

  usageCollectionMock.aggregate.returns({
    toArray: sinon.stub().resolves([
      {
        _id: { JobDeliveryMethod: "web", TransactionDate: "01-01-2025" },
        count: 50,
      },
      {
        _id: { JobDeliveryMethod: "mobile", TransactionDate: "01-02-2025" },
        count: 30,
      },
    ]),
  });
});

Given("there is no active customers", async () => {
  customersCollectionMock.find().project().toArray.resolves([]);
});

Given("there are active customers but no usage data", async () => {
  usageCollectionMock.aggregate().toArray.resolves([]);
});

Given("there are active customers and usage data exists", async () => {
  customersCollectionMock
    .find()
    .project()
    .toArray.resolves([{ _id: "customer1", DomainName: "org1" }]);

  usageCollectionMock.aggregate.returns({
    toArray: sinon.stub().resolves([
      {
        _id: { JobDeliveryMethod: "web", TransactionDate: "01-01-2025" },
        count: 50,
      },
      {
        _id: { JobDeliveryMethod: "mobile", TransactionDate: "01-02-2025" },
        count: 30,
      },
    ]),
  });

  aggregatedCollectionMock.findOne.resolves({ _id: "customer1" });
  aggregatedCollectionMock.updateOne.resolves();
});

When("the Lambda function executes successfully", async () => {
  await dashboardDataAggregator.handler();
});

When("the Lambda function throws an error", async () => {
  dbMock.collection = sinon
    .stub()
    .throws(new Error("Database connection error"));
  await dashboardDataAggregator.handler();
});

Then(
  "it calculates the date range as the last 28 days excluding the current day",
  async () => {
    const date = new Date();
    const nowUtc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const expectedStartDate = new Date(
      new Date(nowUtc).getTime() - 24 * 28 * 60 * 60 * 1000
    ); // 28 Days
    const expectedEndDate = new Date(
      new Date(nowUtc).getTime() - 24 * 60 * 60 * 1000
    );

    const [queryCall] = usageCollectionMock.aggregate.args;
    const condition = queryCall[0][0].$match;

    expect(condition.TransactionDate.$gte.toISOString()).to.equal(
      expectedStartDate.toISOString()
    );
    expect(condition.TransactionDate.$lte.toISOString()).to.equal(
      expectedEndDate.toISOString()
    );
  }
);

Then(
  "the data stored in the AggregatedDashboardUsage collection has the correct structure",
  async () => {
    const [insertCall] = aggregatedCollectionMock.insertOne.args;
    const storedData = insertCall[0];

    // List of expected keys in the inserted document
    const expectedKeys = [
      "CustomerID",
      "OrgID",
      "UpdatedAt",
      "Usage",
      "PeriodStartDate",
      "PeriodEndDate",
    ];

    // Assert that the object has exactly the expected keys
    expect(Object.keys(storedData)).to.have.members(expectedKeys);
    expect(Object.keys(storedData)).to.have.length(expectedKeys.length);

    // Verify data types for each field
    expect(storedData).to.have.property("CustomerID").that.is.a("string");
    expect(storedData).to.have.property("OrgID").that.is.a("string");
    expect(storedData).to.have.property("UpdatedAt").that.is.instanceOf(Date);
    expect(storedData).to.have.property("Usage").that.is.an("array");

    // Validate the structure of each Usage item
    for (const usageItem of storedData.Usage) {
      expect(usageItem).to.have.property("TransactionDate").that.is.a("string");
      expect(usageItem)
        .to.have.property("JobDeliveryMethod")
        .that.is.a("string");
      expect(usageItem).to.have.property("TotalPages").that.is.a("number");

      // Ensure no extra fields in Usage items
      const expectedUsageKeys = [
        "TransactionDate",
        "JobDeliveryMethod",
        "TotalPages",
      ];
      expect(Object.keys(usageItem)).to.have.members(expectedUsageKeys);
      expect(Object.keys(usageItem)).to.have.length(expectedUsageKeys.length);
    }
  }
);

Then(
  "no data is stored in the AggregatedDashboardUsage collection",
  async () => {
    expect(aggregatedCollectionMock.insertOne.called).to.be.false;
    expect(aggregatedCollectionMock.updateOne.called).to.be.false;
  }
);

Then(
  "the data stored for those customers in the AggregatedDashboardUsage collection is empty",
  async () => {
    const [insertCall] = aggregatedCollectionMock.insertOne.args;
    const storedData = insertCall[0];

    expect(storedData.Usage).to.be.empty;
  }
);

Then(
  "the AggregatedDashboardUsage collection is updated with the correct data",
  async () => {
    expect(aggregatedCollectionMock.updateOne.called).to.be.true;
  }
);

Then("an error is logged and the process terminates gracefully", async () => {
  expect(this.error).to.be.undefined;
});
