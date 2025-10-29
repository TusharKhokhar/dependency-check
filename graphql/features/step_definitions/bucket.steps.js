const request = require('supertest');
const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {UploadMultipleFiles, ConfirmFileUpload} = require('../mutations/bucket.mutation')
const {updateLicense} = require('../../../memoryDb/license')
let server
let globalResponse = {}
setDefaultTimeout(100000)

server = request(config.url);

/**
 * Scenario: Mutation to add uploadMultipleFile data
 */


 Given('a valid graphql uploadMultipleFile mutation', () => {
    return UploadMultipleFiles.mutation
})

When('User has provided valid uploadMultipleFile input', () => {
    return UploadMultipleFiles.variables
})

Then('The api should respond with status code 200 for uploadMultipleFile when license configured for translation', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(UploadMultipleFiles)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.UploadMultipleFilesResponse = res.res;
          expect(globalResponse.UploadMultipleFilesResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('The response contains uploadMultipleFile data', () => {
    const multipleFileResponse = JSON.parse(globalResponse.UploadMultipleFilesResponse.text)
    ConfirmFileUpload.variables.recordId = multipleFileResponse.data.id
    expect(multipleFileResponse.data.uploadMultipleFiles.signedUrls[0].originalFileName).to.be.equals(UploadMultipleFiles.variables.fileInput[0].fileName)
})

Then('The response contains uploadMultipleFile post request signed urls', () => {
    const multipleFileResponse = JSON.parse(globalResponse.UploadMultipleFilesResponse.text)
    expect(multipleFileResponse.data.uploadMultipleFiles.signedUrls[0].postSignedMeta).exist
})

When('User has provided valid uploadMultipleFile input but license not configured for translation', async () =>  {
    await updateLicense(config.customerId)
})

Then('The response contains uploadMultipleFile license error', () => {
    server.post('/graphql')
    .set('apikey', config.apiTestKey)
    .set('tier', config.tier)
    .set('authorization',config.token)
    .set('subdomain', config.domainName)
    .send(UploadMultipleFiles)
    .end(function (err, res) {
        globalResponse.UploadMultipleFilesResponseFailed = res.res;
        expect(globalResponse.UploadMultipleFilesResponseFailed.statusCode).to.equal(200);
    const multipleFileResponse = JSON.parse(globalResponse.UploadMultipleFilesResponseFailed.text)
    expect(multipleFileResponse.errors[0].message).to.be.equals("Please active the license for translation service")
    });
})


/**
 * Scenario: Mutation to add confirmFileUpload data
 */

 Given('a valid graphql confirmFileUpload mutation', () => {
    return ConfirmFileUpload.mutation
})

When('User has provided valid confirmFileUpload input', () => {
    return ConfirmFileUpload.variables
})

Then('The api should respond with status code 200 for confirmFileUpload', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', 'admin')
      .send(ConfirmFileUpload)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.confirmFileUploadResponse = res.res;
          expect(globalResponse.confirmFileUploadResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('The response contains confirmFileUpload data', () => {
    const confirmFileResponse = JSON.parse(globalResponse.confirmFileUploadResponse.text)
    expect(confirmFileResponse.data.confirmFileUpload).to.be.equals(confirmFileResponse.data.confirmFileUpload)
})
