const { Given, When, Then, setDefaultTimeout, Before} = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {addUsage, orientationUnset, orientationSetAsSaved} = require('../mutations/usage.mutation')
const { getUsagesWithTransactionTypeFilters } = require('../queries/usages')
const { findAndUpdateUser, findUserById, findUserQuery } = require("../../../memoryDb/users");
const {getEvent} = require("../mocks/event");
const {handler} = require("../../graphql");
const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter');
const { findGroupByQuery, updateGroup } = require('../../../memoryDb/group');
const { createAddValueUsageData, addUsageData } = require('../../../memoryDb/usage');
const { validateToken } = require('../../services/token-interceptor');
let globalResponse = {}
let userData;
setDefaultTimeout(100000)

/**
 * Scenario: Mutation to add a new usage data
 */
let mockAxios
Before(() => {
    mockAxios = new MockAdapter(axios);
    const protonConfig = {
        "ocpApimSubscriptionKey" : "77777",
        "ClientId" : "123455",
        "ClientSecret" : "",
        "TokenAPIEndpoint" : "https://test.com",
        "TransactionServicesAPIEndpoint" : "https://test.com/transaction"
    };
    const tokenResponse = { token: 'mock-token' };

    mockAxios.onGet(`${protonConfig.TokenAPIEndpoint}/${protonConfig.ClientId}?secret=${protonConfig.ClientSecret}`)
      .reply(200, tokenResponse);
    mockAxios.onPost(protonConfig.TransactionServicesAPIEndpoint)
      .reply(200, {});
})


Given('A valid graphql addUsage mutation', async () => {
    return addUsage.mutation
})

When('User has provided valid usageInput', () => {
    return addUsage.variables
})


Then('The api should respond with status code 200 for addUsage', async () => {
    const event = getEvent(addUsage);
    const context = {};
    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
})

Then('The response contains usage data', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage).to.exist
})


Then('Verify if the usage added correctly', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage.Print).to.exist
})


Then('Verify orientation, BillingAccountId and BillingAccountName exists in the response', () => {
    const usageResponse = globalResponse.response.body.data.addUsage
    expect(usageResponse.Print.Orientation).to.be.equals('Landscape')
    expect(usageResponse.BillingAccountId).to.exist
    expect(usageResponse.BillingAccountName).to.exist
})

/**
 * Scenario: Update the Orientation if there is a null value in the print configuration
 */

Given('A valid graphql addUsage mutation with null Orientation', () => {
    return orientationUnset.mutation
})

When('User has provided valid usageInput where Orientation is null', () => {
    return orientationUnset.variables
})

Then('The api should respond with status code 200 with null Orientation', async () => {
    orientationUnset.variables.addUsageInput.CustomerID = config.customerId
    const event = getEvent(orientationUnset);
    const context = {};
    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
})

Then('A valid usage object with a same ReleaseCode and SystemFileName', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage).to.exist
})


Then('The Print Orientation should be set correctly based on the JobList if the Print configuration Orientation is null.', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage.Print).to.exist
    expect(usageResponse.data.addUsage.Print.Orientation).to.be.equal('Portrait')
})

Given('a user {string} with an empty GroupQuotas',async (userName) => {
    userData = await findAndUpdateUser(config.customerId,{Username : userName,GroupQuotas : []})
    addUsage.variables.addUsageInput.Username = userName
    addUsage.variables.addUsageInput.Print.PaymentType = "debit"
    addUsage.variables.addUsageInput.DeductBalance = ['debit']
    addUsage.variables.addUsageInput.Print.TotalCost = 10
    return addUsage.mutation
})

Given('a user {string} with an non-exsit GroupQuotas',async (userName) => {
    userData = await findAndUpdateUser(config.customerId,{Username : userName})
    addUsage.variables.addUsageInput.Username = userName
    addUsage.variables.addUsageInput.Print.PaymentType = "debit"
    addUsage.variables.addUsageInput.DeductBalance = ['debit']
    addUsage.variables.addUsageInput.Print.TotalCost = 10
    return addUsage.mutation
})

Then('it should deduct balance from current balance', async () => {
    const newData = await findUserById(userData._id)
    const remaingAmount = userData?.DebitBalance - addUsage?.variables?.addUsageInput?.Print?.TotalCost;
    expect(newData.DebitBalance).to.be.equals(remaingAmount)
})


/**
 * Scenario: Update the Orientation if there is a AsSaved value in the print configuration.
 */

Given('A valid graphql addUsage mutation with AsSaved Orientation', () => {
    return orientationSetAsSaved.mutation
})

When('User has provided valid usageInput where Orientation is AsSaved', () => {
    return orientationSetAsSaved.variables
})

Then('The api should respond with status code 200 with AsSaved Orientation', async () => {
    orientationSetAsSaved.variables.addUsageInput.CustomerID = config.customerId
    const event = getEvent(orientationSetAsSaved);
    const context = {};
    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
})

Then('A valid usage object with a same ReleaseCode and SystemFileName with AsSaved Orientation', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage).to.exist
})


Then('The Print Orientation should be Portrait correctly based on the JobList if the Print configuration Orientation is AsSaved.', () => {
    const usageResponse = globalResponse.response.body
    expect(usageResponse.data.addUsage.Print).to.exist
    expect(usageResponse.data.addUsage.Print.Orientation).to.be.equal('Portrait')
})

Given(
  "a user {string} with a valid usage input and has selected DebitBalance as the payment method for printing",
  async (userName) => {
    await findAndUpdateUser(config.customerId, {
      Username: userName,
      DebitBalance: 100,
    });
    userData = await findUserQuery({
      Username: userName,
      CustomerID: config.customerId,
    });
    addUsage.variables.addUsageInput.Username = userData.Username;
    addUsage.variables.addUsageInput.Print.PaymentType = "Account";
    addUsage.variables.addUsageInput.DeductBalance = ["debit"];
    addUsage.variables.addUsageInput.Print.TotalCost = 1;
  }
);

When("the addUsage API is invoked concurrently", async () => {
  let _addUsage = JSON.parse(JSON.stringify(addUsage));
  delete _addUsage.variables.addUsageInput.BillingAccountId;
  const event1 = getEvent(_addUsage);
  const event2 = getEvent(_addUsage);
  const context = {};
  try {
    const [response1, response2] = await Promise.all([
      handler(event1, context),
      handler(event2, context),
    ]);
    response1.body = JSON.parse(response1.body);
    globalResponse.response1 = response1;
    response2.body = JSON.parse(response2.body);
    globalResponse.response2 = response2;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("each addUsage API call should respond with a 200 status code", () => {
  expect(globalResponse.response1.statusCode).to.equal(200);
  expect(globalResponse.response2.statusCode).to.equal(200);
});

Then(
  "the user's balance should be correctly deducted from DebitBalance, even under concurrent usage",
  async () => {
    const newData = await findUserById(userData._id);
    const usageResponse1 = globalResponse.response1.body;
    const usageResponse2 = globalResponse.response2.body;
    const amount1 = usageResponse1.data.addUsage.Print.TotalCost;
    const amount2 = usageResponse2.data.addUsage.Print.TotalCost;
    const remainingAmount = userData?.DebitBalance - amount1 - amount2;
    expect(newData.DebitBalance).to.be.equals(Number(remainingAmount.toFixed(2)));
  }
);

Given(
  "a user {string} with a valid usage input and has selected QuotaBalance as the payment method for printing",
  async (userName) => {
    await findAndUpdateUser(config.customerId, {
      Username: userName,
    });
    userData = await findUserQuery({
      Username: userName,
      CustomerID: config.customerId,
    });
    const quotaGroupId = userData.GroupQuotas[0].GroupID.toString();
    const permissionGroup = await findGroupByQuery({
      _id: { $in: userData.GroupID },
      GroupType: "Permissions",
    });
    await updateGroup(permissionGroup[0]._id, {
      AssociatedQuotaBalance: [ObjectId.createFromHexString(quotaGroupId)],
    });
    addUsage.variables.addUsageInput.Username = userName;
    addUsage.variables.addUsageInput.Print.PaymentType = "Account";
    addUsage.variables.addUsageInput.DeductBalance = [quotaGroupId];
    addUsage.variables.addUsageInput.Print.TotalCost = 1;
  }
);

Then(
  "the user's balance should be correctly deducted from QuotaBalance, even under concurrent usage",
  async () => {
    const newData = await findUserById(userData._id);
    const usageResponse1 = globalResponse.response1.body;
    const usageResponse2 = globalResponse.response2.body;
    const amount1 = usageResponse1.data.addUsage.Print.TotalCost;
    const amount2 = usageResponse2.data.addUsage.Print.TotalCost;
    const remainingQuotaBalance =
      userData.GroupQuotas[0].QuotaBalance - amount1 - amount2;
    expect(newData.GroupQuotas[0].QuotaBalance).to.be.equals(
      Number(remainingQuotaBalance.toFixed(2))
    );
  }
); 

Given(
  "I have valid request parameters including a transactionType credit_card filter for getUsages",
  async () => {
    const { data } = await validateToken({
      token: config.token,
      apiKey: config.apiTestKey,
      requesterDomain: config.domainName,
      tier: config.tier,
    });
    const userName = data.user.Username;
    await createAddValueUsageData(
      config.customerId,
      userName,
      "Credit Card"
    );
    getUsagesWithTransactionTypeFilters.variables.customerIds = [
      config.customerId,
    ];
    getUsagesWithTransactionTypeFilters.variables.filters.transactionType = [
      "credit_card",
    ];
    getUsagesWithTransactionTypeFilters.variables.filters.reportType =
      "add_value";
  }
);

When("I send a request to fetch the getUsages", async () => {
  const event = getEvent(getUsagesWithTransactionTypeFilters);
  const context = {};
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
  "the response should contain a list of getUsages matching the filter",
  () => {
    const response = globalResponse.response.body.data;
    expect(response.getUsages.usage).to.exist;
    const result = response.getUsages.usage;

    const isPresent = result.every(
      (obj) => obj.AddValue?.ValueAddedMethod === "Credit Card"
    );
    expect(isPresent).to.be.true;
  }
);

Given(
  "I have valid request parameters including a documentName filter for getUsages",
  async () => {
    const { data } = await validateToken({
      token: config.token,
      apiKey: config.apiTestKey,
      requesterDomain: config.domainName,
      tier: config.tier,
    });
    const userName = data.user.Username;
    await addUsageData(
      "print",
      config.customerId,
      userName,
      "A4",
      "Account",
      "test(5).pdf"
    );
    getUsagesWithTransactionTypeFilters.variables.customerIds = [
      config.customerId,
    ];
    getUsagesWithTransactionTypeFilters.variables.filters.documentName = "test(5)";
    getUsagesWithTransactionTypeFilters.variables.filters.reportType = "print";
    delete getUsagesWithTransactionTypeFilters.variables.filters.transactionType;
  }
);

Then(
  "the response should contain a list of getUsages matching the filter by documentName",
  () => {
    const response = globalResponse.response.body.data;
    expect(response.getUsages.usage).to.exist;
    const result = response.getUsages.usage;

    const isPresent = result.every(
      (obj) => obj.Print?.DocumentName.includes("test(5)")
    );
    expect(isPresent).to.be.true;
  }
);

Given(
  "I have valid request parameters including a transactionBy filter for getUsages",
  async () => {
    const { data } = await validateToken({
      token: config.token,
      apiKey: config.apiTestKey,
      requesterDomain: config.domainName,
      tier: config.tier,
    });
    const userName = data.user.Username;
     await createAddValueUsageData(
      config.customerId,
      userName,
      "Credit Card",
      "test(3)User"
    );
    getUsagesWithTransactionTypeFilters.variables.customerIds = [
      config.customerId,
    ];
    getUsagesWithTransactionTypeFilters.variables.filters.transactionBy = "test(3)User";
    getUsagesWithTransactionTypeFilters.variables.filters.reportType = "print";
    delete getUsagesWithTransactionTypeFilters.variables.filters.documentName
  }
);

Then(
  "the response should contain a list of getUsages matching the filter by transactionBy",
  () => {
    const response = globalResponse.response.body.data;
    expect(response.getUsages.usage).to.exist;
    const result = response.getUsages.usage;

    const isPresent = result.every(
      (obj) => obj.AddValue?.ValueAddedBy.includes("test(3)")
    );
    expect(isPresent).to.be.true;
  }
);