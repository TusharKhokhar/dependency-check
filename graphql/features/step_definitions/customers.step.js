const request = require("supertest");
const {
  Given,
  When,
  Then,
  setDefaultTimeout,
  BeforeAll,
} = require("@cucumber/cucumber");
const expect = require("chai").expect;
const { config } = require("../configs/config");
const { addCustomer, updateCustomer, getCustomer } = require("../../../memoryDb/customer");
const { getSubCustomers } = require("../queries/customers");
const { onboardCustomer } = require("../mutations/customers");
const { getEvent } = require("../mocks/event");
const { handler } = require("../../graphql");
const { getCustomPermission } = require("../../../memoryDb/customerPermissions");
const { updateRole, getRole } = require("../../../memoryDb/roles");
const { mockSESv2Client, mockGetStsCredentials } = require("../mocks/mocks");
const { getCustomizationTextByCustomerId } = require("../../../memoryDb/customizationText");

let server;
let globalResponse = {};
let customerName;
let searchCustomerName;
const customerIds = [];

setDefaultTimeout(100000);

server = request(config.url);

BeforeAll(async () => {
  const { insertedId: customer1Id, ops: customer1Data } = await addCustomer();
  customerIds.push(customer1Id);
  const { insertedId: customer2Id, ops: customer2Data } = await addCustomer();
  customerIds.push(customer2Id);
  customerName = customer1Data[0].CustomerName;
  await mockGetStsCredentials()
  await mockSESv2Client()
});

Given("a valid GraphQL GetSubCustomers query", () => {
  return getSubCustomers.query;
});

When("the user provides valid PaginationData", async () => {
  for (let i = 0; i < customerIds.length; i++) {
    let updateCustomerObject = {};
    updateCustomerObject.ParentCustomer = config.customerId;
    updateCustomer(updateCustomerObject, customerIds[i]);
  }
  getSubCustomers.variables.paginationInput.pattern = customerName;
  getSubCustomers.variables.customerId = config.customerId;
  return getSubCustomers.variables;
});

When("the user does not provide PaginationData", async () => {
  for (let i = 0; i < customerIds.length; i++) {
    let updateCustomerObject = {};
    updateCustomerObject.ParentCustomer = config.customerId;
    updateCustomer(updateCustomerObject, customerIds[i]);
  }
  delete getSubCustomers.variables.paginationInput;
  getSubCustomers.variables.customerId = config.customerId;
  return getSubCustomers.variables;
});

When(
  "the user executes the GetSubCustomers query to retrieve the list of associated customers",
  async () => {
   const event = getEvent(getSubCustomers);
     try {
      const context = {data : {customerIdsStrings : [config.customerId], isKiosk: false}};

       const response = await handler(event, context);
       response.body = JSON.parse(response.body);
       globalResponse.response = response;
     } catch (error) {
       console.error("Error in Lambda Handler:", error);
       throw error;
     }
  }
);

Then(
  "the API should respond with status code 200 and return a filtered list of associated customers",
  () => { 
    const { data } = globalResponse.response.body
    expect(data?.getSubCustomers.customer.length).to.equal(1);
    expect(globalResponse.response.statusCode).to.equal(200);
  }
);

Then(
  "The api should respond with status code 200 and all the partner customers",
  () => {
    const { data } = globalResponse.response.body
    expect(data?.getSubCustomers.customer.length).to.greaterThan(1);
    expect(globalResponse.response.statusCode).to.equal(200);
  }
);


When(
  "the user provides a valid input for GetSubCustomers to sort associated customers data in descending order",
  () => {
      getSubCustomers.variables.paginationInput = {
        limit: 2,
        pageNumber: 1,
        sort: "dsc",
        sortKey:  "CustomerName"
      }
    getSubCustomers.variables.customerId = config.customerId;
    return getSubCustomers.variables;
  }
);

Then(
  `the API response should include the associated customer data sorted in descending order`,
  () => {
    const customerData =
      globalResponse.response.body.data.getSubCustomers.customer;
    const isSortedDescending = customerData.every((item, index, arr) => {
      return (
        index === 0 || item.CustomerName <= arr[index - 1].CustomerName
      );
    });
    expect(isSortedDescending).to.be.true;
  }
);

When(
  "the user provides a CustomerName to search",
  async () => {
      const {CustomerName} = await getCustomer(config.customerId)
      searchCustomerName = CustomerName
      
      getSubCustomers.variables.paginationInput = {
        limit: 2,
        pageNumber: 1,
        sort: "dsc",
        sortKey:  "CustomerName",
        pattern: CustomerName
      }
    getSubCustomers.variables.customerId = config.customerId;
    return getSubCustomers.variables;
  }
);

Then(
  `the API should respond with status code 200 and return the list of associated customers matching the search name`,
  () => {
    const customerData = globalResponse.response.body.data.getSubCustomers.customer;
    const isPresent = customerData.every((obj) =>
      Object.values(obj).some((val) =>
        typeof val === "string" && val.includes(searchCustomerName)
      )
    );
    expect(isPresent).to.be.true;
  }
);


Given("a valid GraphQL onboardCustomer mutation", () => {
  return onboardCustomer.query;
});

When(
  "the user submits an OnboardCustomerInput with CustomerLanguage set to {string}",
  async (language) => {
    await updateCustomer(
      {
        Partner: true, // Because onboardCustomer is only for partner customers and global admin
      },
      config.customerId
    );
    const roleId = config.roleId;
    const role = await getRole(roleId);
    const customPermission = await getCustomPermission("Add_Customer");
    await updateRole(
      {
        CustomPermissions: [...role.CustomPermissions, customPermission._id],
      },
      roleId
    );
    onboardCustomer.variables.onboardCustomerInput.CustomizationTextData.CustomerLanguage =
      language;
    return onboardCustomer.variables.onboardCustomerInput;
  }
);

When("the user executes the onboardCustomer mutation", async () => {
  const event = getEvent(onboardCustomer);
  try {
    const context = { data: { user: { TenantDomain: "admin" } } };

    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then(`the API should respond with a 200 status code`, async () => {
  expect(globalResponse.response.statusCode).to.equal(200);
});

Then(
  `the CustomerLanguage field in the database should be set to {string}`,
  async (language) => {
    const customerId =
      globalResponse?.response?.body?.data?.onboardCustomer?.customerId;
    const customizationTextData = await getCustomizationTextByCustomerId(
      customerId
    );
    expect(customizationTextData.CustomerLanguage).to.equal(language);
  }
);