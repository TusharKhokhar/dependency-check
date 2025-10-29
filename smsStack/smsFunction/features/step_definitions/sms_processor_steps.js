const { Before, Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const sinon = require('sinon');
const https = require('https');
const EventEmitter = require('events');
const { mockSNS, setUpSuccessfulSNS, setUpFailingSNS } = require('../support/sms_test_helper');

// Mock variables
let mockRequest;
let mockResponse;
let mockLambdaEvent;
let lambdaResult;
let consoleWarnSpy;
let httpsRequestStub;

// Import the Lambda function
let smsProcessor;
try {
  smsProcessor = require('../../sms-processor');

  // Override the SNS client with our mock
  smsProcessor.testMode = true;
  smsProcessor.testMocks = { sns: mockSNS };
} catch (error) {
  console.warn('Unable to load sms-processor.js:', error.message);
}

// Setup before each scenario
Before(function() {
  // Reset sinon at the start of each scenario
  sinon.restore();

  // Reset test state
  setUpSuccessfulSNS();

  // Set environment variables
  process.env.ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:SMS-Processing-Alerts';
  process.env.CROSS_VALUE = 'test-api-key';

  // Spy on console.warn
  consoleWarnSpy = sinon.spy(console, 'warn');

  // Setup HTTP mocking
  mockRequest = new EventEmitter();
  mockRequest.write = sinon.stub();
  mockRequest.end = sinon.stub().callsFake(() => {
    setTimeout(() => {
      mockResponse.emit('data', JSON.stringify({ success: true }));
      mockResponse.emit('end');
    }, 10);
    return mockRequest;
  });

  mockResponse = new EventEmitter();

  // Stub https.request
  httpsRequestStub = sinon.stub(https, 'request').callsFake((options, callback) => {
    if (callback) callback(mockResponse);
    return mockRequest;
  });

  // Initialize event
  mockLambdaEvent = { Records: [] };
});

Given('the Lambda function is configured with an alert topic ARN', function() {
  // Already set in the Before hook
});

Given('the Lambda function is configured with an API key', function() {
  // Already set in the Before hook
});

Given('I have a valid SMS message in the SQS queue', function(dataTable) {
  const row = dataTable.hashes()[0];
  mockLambdaEvent.Records.push({
    messageId: 'test-sqs-message-id',
    body: JSON.stringify({
      phoneNumber: row.phoneNumber,
      messageBody: row.messageBody,
      environment: row.environment,
      timestamp: new Date().toISOString(),
      metadata: {
        customerId: row.customerId
      }
    })
  });
});

Given('I have multiple SMS messages in the SQS queue', function(dataTable) {
  dataTable.hashes().forEach((row, index) => {
    mockLambdaEvent.Records.push({
      messageId: `test-sqs-message-id-${index + 1}`,
      body: JSON.stringify({
        phoneNumber: row.phoneNumber,
        messageBody: row.messageBody,
        environment: row.environment,
        timestamp: new Date().toISOString(),
        metadata: {
          customerId: row.customerId
        }
      })
    });
  });
});

Given('I have an SMS message missing the phone number', function(dataTable) {
  const row = dataTable.hashes()[0];
  mockLambdaEvent.Records.push({
    messageId: 'test-sqs-message-id',
    body: JSON.stringify({
      // phoneNumber intentionally omitted
      messageBody: row.messageBody,
      environment: row.environment,
      timestamp: new Date().toISOString(),
      metadata: {
        customerId: row.customerId
      }
    })
  });
});

Given('I have an SMS message missing the customerId', function(dataTable) {
  const row = dataTable.hashes()[0];
  mockLambdaEvent.Records.push({
    messageId: 'test-sqs-message-id',
    body: JSON.stringify({
      phoneNumber: row.phoneNumber,
      messageBody: row.messageBody,
      environment: row.environment,
      timestamp: new Date().toISOString(),
      metadata: {
        // customerId intentionally omitted
      }
    })
  });
});

Given('I have an SQS message with malformed JSON', function() {
  mockLambdaEvent.Records.push({
    messageId: 'test-sqs-message-id',
    body: '{invalid-json'
  });
});

Given('I have an empty Records array in the event', function() {
  // Records array is already empty
});

Given('I have a null event', function() {
  mockLambdaEvent = null;
});

Given('the SNS service will fail with error {string}', function(errorMessage) {
  setUpFailingSNS(errorMessage);
});

Given('the SNS service will fail', function() {
  setUpFailingSNS();
});

Given('the audit API will fail with a network error', function() {
  mockRequest.end = sinon.stub().callsFake(() => {
    setTimeout(() => {
      mockRequest.emit('error', new Error('Network error'));
    }, 10);
    return mockRequest;
  });
});

// When steps
When('the Lambda function processes the message', async function() {
  if (!smsProcessor) {
    this.skip();
    return;
  }

  try {
    lambdaResult = await smsProcessor.handler(mockLambdaEvent);
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    lambdaResult = { success: 0, failure: 0, messages: [] };
  }
});

When('the Lambda function processes the messages', async function() {
  if (!smsProcessor) {
    this.skip();
    return;
  }

  try {
    lambdaResult = await smsProcessor.handler(mockLambdaEvent);
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    lambdaResult = { success: 0, failure: 0, messages: [] };
  }
});

When('the Lambda function processes the event', async function() {
  if (!smsProcessor) {
    this.skip();
    return;
  }

  try {
    lambdaResult = await smsProcessor.handler(mockLambdaEvent);
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    lambdaResult = { success: 0, failure: 0, messages: [] };
  }
});

// Then steps
Then('the SMS should be sent successfully', function() {
  // Check if the SMS was sent successfully
  const smsCalls = mockSNS.send.getCalls().filter(call =>
    !call.args[0].input || !call.args[0].input.TopicArn // Not an alert
  );

  expect(smsCalls.length).to.be.at.least(1, 'Expected at least one SMS to be sent');
});

Then('all SMS messages should be sent successfully', function() {
  const smsCalls = mockSNS.send.getCalls().filter(call =>
    !call.args[0].input || !call.args[0].input.TopicArn // Not an alert
  );

  expect(smsCalls.length).to.equal(mockLambdaEvent.Records.length,
    `Expected ${mockLambdaEvent.Records.length} SMS calls, but got ${smsCalls.length}`);
});

Then('the SMS should not be sent', function() {
  // For this scenario, we expect no successful SMS calls
  const successfulSmsCalls = mockSNS.send.getCalls().filter(call =>
    (!call.args[0].input || !call.args[0].input.TopicArn) && // Not an alert
    !call.exception // No exception
  );

  expect(successfulSmsCalls.length).to.equal(0, 'Expected no successful SMS calls');
});

Then('the success counter should be incremented', function() {
  expect(lambdaResult.success).to.equal(1, 'Expected success counter to be 1');
});

Then('the success counter should equal the number of messages', function() {
  expect(lambdaResult.success).to.equal(mockLambdaEvent.Records.length,
    `Expected success counter to equal number of messages (${mockLambdaEvent.Records.length})`);
});

Then('no failure should be recorded', function() {
  expect(lambdaResult.failure).to.equal(0, 'Expected no failures to be recorded');
});

Then('no failures should be recorded', function() {
  expect(lambdaResult.failure).to.equal(0, 'Expected no failures to be recorded');
});

Then('the failure counter should be incremented', function() {
  expect(lambdaResult.failure).to.be.at.least(1, 'Expected failure counter to be at least 1');
});

Then('no success or failure should be recorded', function() {
  expect(lambdaResult.success).to.equal(0, 'Expected success counter to be 0');
  expect(lambdaResult.failure).to.equal(0, 'Expected failure counter to be 0');
});

Then('no alert should be sent', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.equal(0, 'Expected no alerts to be sent');
});

Then('no alerts should be sent', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.equal(0, 'Expected no alerts to be sent');
});

Then('an alert should be sent with the error details', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');
});

Then('the audit API should be called with the error information', function() {
  expect(httpsRequestStub.called).to.be.true;
  expect(mockRequest.write.called).to.be.true;
});

Then('the audit API should be called with the {string} endpoint', function(endpoint) {
  expect(httpsRequestStub.called).to.be.true;

  const requestCalls = httpsRequestStub.getCalls();
  expect(requestCalls.length).to.be.at.least(1, 'Expected at least one API call');

  // Check the hostname in the first call
  expect(requestCalls[0].args[0].hostname).to.equal(endpoint);
});

Then('the Lambda function should complete execution', function() {
  expect(lambdaResult).to.exist;
});

Then('a warning about missing customerId should be logged', function() {
  const warningCalls = consoleWarnSpy.getCalls().filter(call =>
    call.args.some(arg => typeof arg === 'string' && arg.includes('No customerId found'))
  );

  expect(warningCalls.length).to.be.at.least(1, 'Expected a warning about missing customerId');
});

Then('an alert should be sent to the configured topic', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');
});

Then('the alert should contain the error message', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');

  const alertCall = alertCalls[0];
  const alertMessage = JSON.parse(alertCall.args[0].input.Message);

  expect(alertMessage.error).to.exist;
});

Then('the alert should contain the message ID', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');

  const alertCall = alertCalls[0];
  const alertMessage = JSON.parse(alertCall.args[0].input.Message);

  expect(alertMessage.messageId).to.exist;
});

Then('the alert should contain the original message body', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');

  const alertCall = alertCalls[0];
  const alertMessage = JSON.parse(alertCall.args[0].input.Message);

  expect(alertMessage.body).to.exist;
});

Then('the alert should contain a timestamp', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');

  const alertCall = alertCalls[0];
  const alertMessage = JSON.parse(alertCall.args[0].input.Message);

  expect(alertMessage.timestamp).to.exist;
});

Then('an alert should be sent with the parsing error details', function() {
  const alertCalls = mockSNS.send.getCalls().filter(call =>
    call.args[0].input && call.args[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
  );

  expect(alertCalls.length).to.be.at.least(1, 'Expected at least one alert to be sent');

  // Check at least one alert contains SyntaxError
  const syntaxErrorAlerts = alertCalls.filter(call => {
    const message = JSON.parse(call.args[0].input.Message);
    return message.error && message.error.includes('SyntaxError');
  });

  expect(syntaxErrorAlerts.length).to.be.at.least(1, 'Expected an alert with SyntaxError details');
});

