const { Given, When, Then, Before} = require('@cucumber/cucumber');
const request = require('supertest');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {addPublicUploadRecordConfirmUpload} = require("../../../memoryDb/publicUploads");
const server = request(config.url);
let response
let payload = {}
const { faker } = require('@faker-js/faker');
const { getObjectId: ObjectId } = require("../../helpers/objectIdConvertion")

const confirmFileUploadPayload = {"notification":{"email":"matthew.philips@tbsit360.com","text":""},
    "guestName":null,"userName":null,"libraryCard":null,
    "data":[{"color":"Color","duplex":false,"paperSize":"Letter","copies":1,
        "orientation":"AsSaved","staple":null,"totalPagesPerFile":1,
        "pageRange":"1-1","originalFileNameWithExt":"favicon-16x16.png",
        "newFileName":"cc077be3-92bf-4812-94bd-27b81bb755d8.pdf",
        "uploadStatus":true,"uploadedFrom":"web",
        "platform":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"}],
    "totalCost":0,"customerLocation":"Saket Nagar","recordId":"" ,
    "customerId":"633c4f831d56a2724c9b58d2",
    "automaticDelivery":true,"locationId":""}

Before('@global', async function () {
    response = null
})

Given('a request body with deviceId and deviceName',  async () => {
    payload.id = await addPublicUploadRecordConfirmUpload()
    confirmFileUploadPayload.recordId = payload.id
    confirmFileUploadPayload.deviceName = faker.word.words()
    confirmFileUploadPayload.deviceId = ObjectId.createFromHexString()
    payload.body = confirmFileUploadPayload

});

When('I send a POST request to confirmFileUpload', (callback) => {
    server.post('/public/confirmFileUpload')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .send(payload.body)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          response = res.res;
          callback();
      });
});

Then('The HTTP response status should be 200 for confirm file upload', () => {
    expect(response.statusCode).to.equal(200);
});