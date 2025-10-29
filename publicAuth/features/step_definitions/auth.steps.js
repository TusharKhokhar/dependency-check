const { Given, When, Then, BeforeAll} = require('@cucumber/cucumber');
const { faker } = require('@faker-js/faker');
const request = require('supertest');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {addCustomer} = require("../../../memoryDb/customer");
const {addGroup, addQuotaGroup, addPermissionGroup} = require("../../../memoryDb/group");
const {addRole} = require("../../../memoryDb/roles");
const {addUser, findUser} = require("../../../memoryDb/users");
const {addNavigation} = require("../../../memoryDb/navigation");
const {addPermission} = require("../../../memoryDb/permissions");
const {addCustomPermission} = require("../../../memoryDb/customerPermissions");
const {addProfile} = require("../../../memoryDb/profile");
const {addCustomizationText} = require("../../../memoryDb/customizationText");
const { loginOAuth2 } = require('../../controllers/auth.controller');
const { addAuthProvider } = require('../../../memoryDb/authProviders');
const server = request(config.url);
const interceptor = config.apiTestKey
let response={}
let route = {
    login: '/public/v2/login',
    signup: '/public/signup'
}
const res = {
  status(code) {
    response.statusCode = code;
    return this;
  },
  send(data) {
    response.data = data;
    return this;
  },
  json(data) {
    response.data = data;
    return this;
  }
};


BeforeAll(async () => {
    const {insertedId: customerId, ops: customerData} = await addCustomer()
    await addNavigation()
     await addPermission()
     await addCustomPermission()
    const {insertedId: groupId, ops: groupData} = await addGroup(customerId)
    const {insertedId: quotaGroupId} = await addQuotaGroup(customerId)
    const {insertedId: roleId} = await addRole(customerId)
    const {insertedId: groupPermissionId} = await addPermissionGroup(customerId, roleId)
    const {ops: userData, password} = await addUser([groupId, groupPermissionId], [
          {
              "GroupID" : quotaGroupId,
              "QuotaBalance" : 10
          }
      ],
      customerId, customerData[0].Tier, customerData[0].DomainName)
    await addProfile(customerId, groupId)
    await addCustomizationText(groupId, customerId)
    await addAuthProvider(customerId)
    config.domainName = customerData[0].DomainName
    config.customerId = customerData[0]._id
    config.userName = userData[0].Username
    config.password = password
})

Given(/^a valid route for login api$/,  () => {
    expect('/public/v2/login').to.be.equals(route.login)
});

When(/^We send a login request with valid username and password$/, async() => {
    const req = {
        body: {
          userName: config.userName,
          password: config.password,
        },
        headers: {
          subdomain: config.domainName,
          apikey: config.apiTestKey,
          tier: 'standard'
        }
    }
    await loginOAuth2(req, res)
});

Then('I should get a success message and login response should contain Print Config Group and Device data', () => {
    expect(response.statusCode).to.equal(200)
    expect(response.data).to.have.property('data');
    const apiData = response.data.data;
    expect(apiData).to.have.property('printConfigGroup');
    expect(apiData.printConfigGroup).to.be.an('array');
    expect(apiData.printConfigGroup[0]).to.have.property('deviceData');
});

Then('The token should have an expiry time matching the expected duration', () => {
    expect(response.statusCode).to.equal(200);
    const apiResponse = response.data;
    const token = apiResponse.data.token;
    expect(token).to.exist;
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    const issuedAt = decoded.iat;
    const expiresAt = decoded.exp;
    const expiryDuration = expiresAt - issuedAt;
    const expectedExpiry = 10 * 3600;
    expect(expiryDuration).to.be.closeTo(expectedExpiry, 60);
});