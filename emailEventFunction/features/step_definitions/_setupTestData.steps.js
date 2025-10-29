const { BeforeAll } = require("@cucumber/cucumber");
const { setupTestData } = require("../helpers/setupTestData");

BeforeAll(async () => {
  await setupTestData();
});
