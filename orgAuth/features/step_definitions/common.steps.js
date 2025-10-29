const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const { config } = require("../configs/config");
const server = request(config.url);

let req;

let response;
let orgID;


Given("the redirect URI {string}", function (url) {
    let testRedirectURI = url
      .replace("${orgId}", config.orgID)
      .replace("${domainName}", config.DomainName);
  
    req = {
      headers: {
        cookie: `pkceToken=invalid; fe_redirectURI=${testRedirectURI}`,
      },
      query: {
        authId: config.oidcData._id?.toString(),
        orgId: config.orgID,
        tier: "standard",
        redirectURI: testRedirectURI,
      },
      path: "/auth/login",
    };
  });
  
  When("the function is executed", function (callback) {
    server
      .get("/auth/login")
      .set("cookie", req.headers.cookie)
      .query(req.query)
      .send()
      .end((err, res) => {
        if (err) {
          callback(err);
        }
        response = res;
  
        callback();
      });
  });
  
  Then("the redirect should be allowed", async function () {
    const location = response.header.location;
    const expectedvalue = location.includes("error");
    expect(expectedvalue).to.equal(false);
  });
  
  Then("the redirect should be blocked", async function () {
    const location = response.header.location;
    const expectedvalue = location.includes("error");
    expect(expectedvalue).to.equal(true);
  });