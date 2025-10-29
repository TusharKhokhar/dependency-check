const { addCustomer } = require("../../../memoryDb/customer");
const { addUser } = require("../../../memoryDb/users");
const { addUsageData } = require("../../../memoryDb/usage");
const config = require("../config/config")

async function setupTestData() {
  const {insertedId, ops: customerData} = await addCustomer()
  const userData = await addUser([], [],
        insertedId, customerData[0].Tier, customerData[0].DomainName)
  config.customerId = insertedId
  config.customerData = customerData
  config.userId = userData.insertedId
  await addUsageData("print", insertedId, userData.Username, "Letter");
  await addUsageData("print", insertedId, userData.Username, "A3", "free");
  await addUsageData("add_value", insertedId, userData.Username, "A3");
  await addUsageData("deduct_value", insertedId, userData.Username, "A3");
  await addUsageData("print", insertedId, userData.Username, "A3", "credit card");
  await addUsageData("print", insertedId, userData.Username, "A3", "cboard");
  await addUsageData("print", insertedId, userData.Username, "A3", "CBORD");
}

module.exports = {
  setupTestData,
};
