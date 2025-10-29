const { addCustomer } = require("../../../memoryDb/customer");
const { addCustomizationText } = require("../../../memoryDb/customizationText");
const { addLocation } = require("../../../memoryDb/locations");
const { addJobList } = require("../../../memoryDb/jobList");

async function setupTestData() {
  const { insertedId: customerId } = await addCustomer();
  await addCustomizationText("", customerId);
  await addLocation(customerId);
  await addJobList(customerId);
}

module.exports = {
  setupTestData,
};
