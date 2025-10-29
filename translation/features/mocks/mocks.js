// mocks.js
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const { basePath } = require("../../config/config");
const {GetObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const {mockClient} = require('aws-sdk-client-mock');

const s3Mock = mockClient(S3Client);
let mockAxiosInstance;

const setupAxiosInstance = () => {
  mockAxiosInstance = new MockAdapter(axios);
};

const restoreAxiosInstance = () => {
  mockAxiosInstance.restore();
};

// const mockS3GetObject = async (filePath) => {
//   const data = await readFileAsync(filePath);
//   rawData = data.Body;
//   s3Mock.on(GetObjectCommand).resolves(data);
//   const s3 = new S3Client({});
//   return await s3.send(new GetObjectCommand({name: "test-bucket", key: "test-key"}))
// };
//
// const mockDomainInfoRequest = () => {
//   mockAxiosInstance
//     .onGet(`${basePath}/domainInfo?domain=${testDomain}`)
//     .reply(200, {
//       error: null,
//       data: domainInfoResponse,
//     });
// };
//
// const mockJobFailRequest = () => {
//   mockAxiosInstance.onPost(`${basePath}/job/fail`).reply(200, {});
// };

module.exports = {
  setupAxiosInstance,
  restoreAxiosInstance
};
