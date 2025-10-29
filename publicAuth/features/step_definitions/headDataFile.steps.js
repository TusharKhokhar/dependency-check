const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const sinon = require('sinon');
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { headDataFile } = require('../support/headDataFile.helper');

// Setup step definitions
Given('a valid S3 client instance is available', function() {
  this.s3 = new S3Client({ region: 'us-east-1' });
  this.s3SendStub = sinon.stub(this.s3, 'send');
});

Given('a file object with basic properties is provided', function() {
  this.file = {
    OriginalFileNameWithExt: 'test.pdf',
    TotalPagesPerFile: 5,
    PageRange: '1-5'
  };
});

Given('S3 metadata contains pagecount of {int}', function(pageCount) {
  this.pageCount = pageCount;
  this.s3Metadata = { pagecount: pageCount.toString() };
});

Given('the file object has TotalPagesPerFile of {int}', function(pageCount) {
  this.file.TotalPagesPerFile = pageCount;
});

Given('the file has OriginalFileNameWithExt ending with {string}', function(extension) {
  if (extension.startsWith('.')) {
    const baseName = this.file.OriginalFileNameWithExt.split('.')[0];
    this.file.OriginalFileNameWithExt = `${baseName}${extension}`;
  } else {
    this.file.OriginalFileNameWithExt = `test${extension}`;
  }
});

Given('the file has OriginalFileNameWithExt of {string}', function(filename) {
  this.file.OriginalFileNameWithExt = filename;
});

Given('the file object has PageRange of {string}', function(pageRange) {
  this.file.PageRange = pageRange;
});

Given('the file object has UploadedFrom set to {string}', function(uploadedFrom) {
  this.file.UploadedFrom = uploadedFrom;
});

Given('S3 HeadObjectCommand will return an error', function() {
  this.s3Error = new Error('S3 HeadObjectCommand error');
  this.s3SendStub.callsFake((command, callback) => {
    callback(this.s3Error, null);
  });
});

Given('S3 metadata does not contain pagecount property', function() {
  this.s3Metadata = {}; // Empty metadata without pagecount
});

Given('S3 metadata contains pagecount of {string}', function(pagecount) {
  this.s3Metadata = { pagecount };
});

When('headDataFile is called with valid S3 parameters', async function() {
  this.params = {
    Bucket: 'test-bucket',
    Key: `PublicUploads/customer-id/${this.file.OriginalFileNameWithExt}`
  };

  // Configure the stub to return our test metadata
  if (!this.s3Error) {
    this.s3SendStub.callsFake((command, callback) => {
      callback(null, { Metadata: this.s3Metadata });
    });
  }

  try {
    this.result = await headDataFile(this.s3, this.params, this.file);
    this.error = null;
  } catch (error) {
    this.error = error;
    this.result = null;
  }
});

Then('the function should resolve with the original file object', function() {
  expect(this.error).to.be.null;
  expect(this.result).to.deep.equal(this.file);
});

Then('no page count modifications should be made', function() {
  expect(this.result.TotalPagesPerFile).to.equal(this.file.TotalPagesPerFile);
  if (this.file.PageRange) {
    expect(this.result.PageRange).to.equal(this.file.PageRange);
  }
});

Then('the function should resolve with updated file object', function() {
  expect(this.error).to.be.null;
  expect(this.result).to.not.be.null;
});

Then('TotalPagesPerFile should be set to {int}', function(expectedPageCount) {
  expect(this.result.TotalPagesPerFile).to.equal(expectedPageCount);
});

Then('PageRange should be set to {string}', function(expectedPageRange) {
  expect(this.result.PageRange).to.equal(expectedPageRange);
});

Then('TotalPagesPerFile should remain {int}', function(expectedPageCount) {
  expect(this.result.TotalPagesPerFile).to.equal(expectedPageCount);
});

Then('PageRange should remain {string}', function(expectedPageRange) {
  expect(this.result.PageRange).to.equal(expectedPageRange);
});

Then('the function should reject with the S3 error', function() {
  expect(this.error).to.equal(this.s3Error);
  expect(this.result).to.be.null;
});

Then('the page count logic should be applied based on pdf extension', function() {
  // This is for the complex file extension scenario - we need to verify the extension was correctly detected
  const fileExt = this.file.OriginalFileNameWithExt.split('.').pop();
  expect(fileExt).to.equal('pdf');
  
  // Check if the appropriate logic was applied based on S3 pagecount vs TotalPagesPerFile
  if (this.pageCount > this.file.TotalPagesPerFile) {
    // Should follow the logic for more pages
    if (this.file.PageRange === '1-1' && this.file.TotalPagesPerFile > 1) {
      expect(this.result.TotalPagesPerFile).to.equal(this.pageCount);
    } else {
      const splitPageRange = this.file.PageRange.split('-');
      if (parseInt(splitPageRange[1]) === this.file.TotalPagesPerFile) {
        expect(this.result.PageRange).to.equal(`${splitPageRange[0]}-${this.pageCount}`);
        expect(this.result.TotalPagesPerFile).to.equal(this.pageCount);
      }
    }
  } else if (this.pageCount < this.file.TotalPagesPerFile) {
    // Should follow the logic for fewer pages
    const splitPageRange = this.file.PageRange.split('-');
    if (parseInt(splitPageRange[1]) === this.file.TotalPagesPerFile) {
      expect(this.result.PageRange).to.equal(`${splitPageRange[0]}-${this.pageCount}`);
    }
    expect(this.result.TotalPagesPerFile).to.equal(this.pageCount);
  }
});