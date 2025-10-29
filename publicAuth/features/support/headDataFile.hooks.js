const { Before, After } = require('@cucumber/cucumber');
const sinon = require('sinon');

// Setup test context
Before(function() {
  this.sandbox = sinon.createSandbox();
});

// Clean up after each scenario
After(function() {
  this.sandbox.restore();
});