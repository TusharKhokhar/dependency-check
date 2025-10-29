// mocks.js
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const fs = require("fs/promises");
const path = require("path");
const { basePath } = require("../config/config");
const {GetObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const {mockClient} = require('aws-sdk-client-mock');

const s3Mock = mockClient(S3Client);

let rawData;
const testDomain = "admin";
const domainInfoResponse = {
  customerData: {
    _id: "6231ce19932e27000985ba60",
    Tier: "standard",
    DomainName: "admin",
    CustomerName: "ADMIN - DO NOT TOUCH",
  },
  jobLists: [
    {
      DefaultValues: {
        Color: "Grayscale",
        PaperSize: "Legal",
        Copies: 1,
        Orientation: "Landscape",
        PageRange: "all",
        Duplex: false,
      },
      AutomaticPrintDelivery: true,
    },
  ],
  customizationsText: {
    _id: "62c5ceea364c8828ca535678",
    MainSection: {
      TopSection: {
        CustomerLogo:
          "https://api.eprintitsaas.org/logo/cloud-eprintitsaas-pri-dev?image=LzYyMzFjZTE5OTMyZTI3MDAwOTg1YmE2MC93ZWIucG5n",
      },
      Description: {
        DescriptionTitle: "Aakash Sharma ePRINTit Saas Solution",
        DescriptionBox:
          '<h1 class="ql-align-center"><strong>Welcome</strong> to our<span style="color: #ff9900;"> Wireless Printing Service!</span></h1>\n<h3 class="ql-align-center">Go to <a href="https://google.com">ePRINTit</a></h3>',
      },
    },
    SelectFileSection: {
      SupportedFileTypes: [
        "pdf",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tif",
        "tiff",
        "doc",
        "docx",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "html",
        "htm",
        "txt",
        "rtf",
        "pub",
        "odt",
        "odp",
        "ods",
        "xps",
        "heic",
        "svg",
        "epub",
        "vsd",
        "oxps",
        "wmf",
        "webp",
      ],
    },
    AdvancedEmailConfiguration: {
      AdvancedEmailAlias: [],
    },
  },
  locations: [
    {
      _id: "65f9cf70f79f63699c144e2b",
    },
  ],
};
const signedUrlResponse = {
  error: null,
  data: {
    arrayOfLinks: [
      {
        signedUrl: "https://test.signedurl",
        expiryTime: 3600,
        newFileName: "test.pdf",
        contentType: "text/html",
      },
    ],
    id: "66572b9d9ab7f02a41c1ff64",
  },
  status: 1,
};
const signedUrl = "https://test.signedurl";
let mockAxiosInstance;

const setupAxiosInstance = () => {
  mockAxiosInstance = new MockAdapter(axios);
  return mockAxiosInstance
};

const restoreAxiosInstance = () => {
  mockAxiosInstance.restore();
};

const readFileAsync = async (filePath) => {
  try {
    const filePaths = path.join(__dirname, filePath);
    const data = await fs.readFile(filePaths, "utf8");
    return { Body: data };
  } catch (err) {
    throw err;
  }
};

const mockS3GetObject = async (filePath) => {
  const data = await readFileAsync(filePath);
  rawData = data.Body;
  s3Mock.reset();
  s3Mock.on(GetObjectCommand).resolves(data);
  const s3 = new S3Client({});
  const getObjectResult = await s3.send(new GetObjectCommand({name: "test-bucket", key: "test-key"}));
  return getObjectResult
};

const mockJobFailRequest = () => {
  mockAxiosInstance.onPost(`${basePath}/job/fail`).reply(200, {});
};

const mockCreateSignedUrlRequest = () => {
  mockAxiosInstance
    .onPost(`${basePath}/signedUrls`)
    .reply(200, signedUrlResponse);
};

const mockUploadAttchmentRequest = () => {
  mockAxiosInstance.onPut(signedUrl).reply(200, {});
};

const mockAttachmentUploadWithRetry = (signedUrl) => {
  mockAxiosInstance.onPut(signedUrl).replyOnce(500);
  mockAxiosInstance.onPut(signedUrl).reply(200, { status: "ok" });
};

const mockGetUserEmailAddressRequest = () => {
  mockAxiosInstance.onPost(`${basePath}/getUserEmailAddress`).reply(200, {
    Username: "test",
  });
};

const mockConfirmFileUploadRequest = () => {
  mockAxiosInstance.onPost(`${basePath}/confirmFileUpload`).reply(200, {});
};

module.exports = {
  mockS3GetObject,
  mockJobFailRequest,
  mockCreateSignedUrlRequest,
  mockUploadAttchmentRequest,
  mockGetUserEmailAddressRequest,
  mockConfirmFileUploadRequest,
  setupAxiosInstance,
  restoreAxiosInstance,
  getRawData: () => rawData,
  mockAttachmentUploadWithRetry,
};
