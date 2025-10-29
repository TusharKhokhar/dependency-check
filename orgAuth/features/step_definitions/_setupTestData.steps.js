const { BeforeAll, setDefaultTimeout } = require("@cucumber/cucumber");
const { setupTestData } = require("../helpers/setupTestData");

setDefaultTimeout(400000);

BeforeAll(async () => {
  await setupTestData();
});
