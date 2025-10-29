const request = require('supertest');
const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {addFax} = require('../mutations/fax.mutation')
let server
let globalResponse = {}
setDefaultTimeout(100000)

server = request(config.url);

/**
 * Scenario: Mutation to add a new fax data
 */


 Given('A valid graphql addFax mutation', () => {
    return addFax.mutation
})

When('User has provided valid faxInput', () => {
    return addFax.variables
})


Then('The api should respond with status code 200 for addFax', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', 'standard')
      .set('authorization',config.token)
      .set('subdomain', 'admin')
      .send(addFax)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.addFaxResponse = res.res;
          expect(globalResponse.addFaxResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('The response contains fax data', () => {
    const faxResponse = JSON.parse(globalResponse.addFaxResponse.text)
    expect(faxResponse.data.addFax).to.be.equals(faxResponse.data.addFax)
})
