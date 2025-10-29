const { Given, When, Then, Before, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const request = require('supertest');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const interceptor = config.apiTestKey;
let response;
let statusCode;
const {
  fetchCustomerDetailsByDomain,
} = require("../../controllers/auth.controller");
const { addProvider } = require('../../../memoryDb/provider');
const { findGroupByQuery } = require('../../../memoryDb/group');

const reqForDomainInfo = {};
const resForDomainInfo = {
  status: function (code) {
    this.statusCode = code;
    return this;
  },
  send: function (data) {
    this.data = data;
    return this;
  },
};

Given(/^a valid route for the domainInfo API$/,  () => {
    let domainName = config.domainName;
    reqForDomainInfo.headers = {
        apikey: interceptor,
        tier: config.tier,
        subdomain: domainName,
      };
      reqForDomainInfo.query = {
        domain: domainName,
      };
});

When("I send a GET request to get domainInfo",async () => {
    await fetchCustomerDetailsByDomain(reqForDomainInfo, resForDomainInfo);
    response = resForDomainInfo.data;
    statusCode = resForDomainInfo.statusCode;
});

Then('I should receive a response that contains profile and profile data if exists', () => {
    expect(statusCode).to.equal(200);
    expect(response.data.profiles).to.be.an('array');
    const groupTypeExists = response.data.profiles.some(group => group?.ProfileSetting?.PrintConfigurationGroup?.GroupType === 'Print Configuration');
    expect(groupTypeExists).to.be.deep.equal(true);
});

Given(
  "a valid request for the domainInfo API with {string} domain",
  (domainNameCase) => {
    let domainName = config.domainName;
    if (domainNameCase === "capital") {
      domainName = config.domainName.toUpperCase();
    } else if (domainNameCase === "small") {
      domainName = config.domainName.toLowerCase();
    } else {
      domainName = config.domainName
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
          return index == 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, "");
    }

    reqForDomainInfo.headers = {
      apikey: interceptor,
      tier: config.tier,
      subdomain: domainName,
    };
    reqForDomainInfo.query = {
      domain: domainName,
    };
  }
);


Then("I should receive a response with the correct customer data", () => {
  expect(response.data.customerData).to.be.an("object");
  expect(response.data.customerData.DomainName).to.be.deep.equal(
    config.domainName
  );
});

Given("a request with invalid domain name for the domainInfo API", () => {
  reqForDomainInfo.headers = {
    apikey: interceptor,
    tier: config.tier,
    subdomain: "domainName",
  };
  reqForDomainInfo.query = {
    domain: "domainName",
  };
});


Then("I should receive an error message like {string}", (errorMessage) => {
  expect(statusCode).to.equal(400);
  expect(response.error.message).to.be.deep.equal("Customer Not Found");
});

Given("a customer has Sip2 as an authProvider", async () => {
  const groupData = await findGroupByQuery({
    CustomerID: config.customerId,
    GroupType: "Permissions",
  });
  await addProvider(
    config.customerId,
    "sip2",
    config.domainName,
    groupData._id
  );

  let domainName = config.domainName;
  reqForDomainInfo.headers = {
    apikey: interceptor,
    tier: config.tier,
    subdomain: domainName,
  };
  reqForDomainInfo.query = {
    domain: domainName,
  };
});

Then("the response should include Sip2Config inside the authProvider details", () => {
  expect(statusCode).to.equal(200);
  expect(response.data.authProviders).to.be.an("array");
  const sip2ConfigExists = response.data.authProviders.some(
    (authProvider) => authProvider?.Sip2Config
  );
  expect(sip2ConfigExists).to.be.exist;
});