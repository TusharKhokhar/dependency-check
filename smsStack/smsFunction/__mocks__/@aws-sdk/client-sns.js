// Mocking approach for AWS SDK v3
const mockSNSClient = jest.fn().mockImplementation(() => ({
  send: jest.fn().mockImplementation((command) => {
    if (command && command.TopicArn === process.env.ALERT_TOPIC_ARN) {
      return Promise.resolve({ MessageId: 'mock-alert-id' });
    }
    return Promise.resolve({ MessageId: 'mock-message-id' });
  })
}));

// Export the mock so the Lambda function can import it
module.exports = {
  SNSClient: mockSNSClient,
  PublishCommand: jest.fn()
};
