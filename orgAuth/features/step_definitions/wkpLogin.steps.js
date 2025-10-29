const { Given, When, Then, Before } = require("@cucumber/cucumber");
const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;
const { config } = require("../configs/config");
const server = request(config.url);
const { updateAuthProvider } = require("../../../memoryDb/provider");

let authProvider, response;
let requestBody = {};

const modifyRequestBody = (modification) => {
  switch (modification) {
    case "without authId":
      delete requestBody.authId;
      break;
    case "without pin or with invalid pin":
      requestBody.pin = "InvalidPassword";
      break;
    default:
      break;
  }
};

const modifyConfig = async (modification) => {
  let updateObj = {
    WkpConfig: { ...config.wkpData.WkpConfig },
    AuthProvider: "wkp",
  };
  switch (modification) {
    case "with invalid ClientId":
      updateObj.WkpConfig.ClientId = "InvalidClientId";
      break;
    case "with invalid ClientSecret":
      updateObj.WkpConfig.ClientSecret = "InvalidClientSecret";
      break;
    case "with invalid OcpApimSubscriptionKey":
      updateObj.WkpConfig.OcpApimSubscriptionKey = "InvalidOcpApimSubscriptionKey";
      break;
    default:
      break;
  }
  await updateAuthProvider(updateObj, config.wkpData._id);
};

Before('@WkpLogin', async () => {
  authProvider = config.wkpData
  response = null;
  requestBody = {
    orgId: config.orgID,
    pin: config.wkpLoginCreds.Pin,
    authId: authProvider._id,
  };
});


Given("a request body {string} to login with wkp", async function (requestBody) {
  modifyRequestBody(requestBody)
});

Given(
  "an authProvider {string} to login with wkp",
  async function (authConfig) {
    await modifyConfig(authConfig);
  }
);

When("I send a POST request to login with wkp", (callback) => {
  server
    .post("/auth/login")
    .send(requestBody)
    .end(function (err, res) {
      if (err) {
        callback(err);
      }
      response = res.res;
      callback();
    });
});

Then(
  "The response status should be {int} in login with wkp",
  function (statusCode) {
    expect(response.statusCode).to.equal(statusCode);
  }
);

Then(
  "The response should contain {string} in login with wkp",
  function (expectedMessage) {
    const responseData = JSON.parse(response.text);
    if(expectedMessage === "success"){
      expect(responseData.data).has.key("hashId");
      expect(responseData.data.hashId).not.null
    }else{
      expect(responseData.error.message).to.be.equal(expectedMessage);
    }
  }
);

