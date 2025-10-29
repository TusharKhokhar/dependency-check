// A simplified version of the test helper for SMS processor BDD tests
const sinon = require('sinon');

// Create mock for testing
const mockSNS = {
  send: sinon.stub().resolves({ MessageId: 'mock-message-id' })
};

// Add specialized test methods
const setUpSuccessfulSNS = () => {
  mockSNS.send.reset();
  mockSNS.send.resolves({ MessageId: 'mock-message-id' });
};

const setUpFailingSNS = (errorMessage = 'SNS publish failed') => {
  mockSNS.send.reset();
  mockSNS.send.callsFake(command => {
    if (command.input && command.input.TopicArn) {
      // Allow alerts to succeed
      return Promise.resolve({ MessageId: 'mock-alert-id' });
    }
    // Make SMS calls fail
    return Promise.reject(new Error(errorMessage));
  });
};

module.exports = {
  mockSNS,
  setUpSuccessfulSNS,
  setUpFailingSNS
};
