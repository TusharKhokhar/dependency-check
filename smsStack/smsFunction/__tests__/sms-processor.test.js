const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const https = require('https');
const EventEmitter = require('events');

// Import the Lambda handler
const lambda = require('../sms-processor');

// Mock the AWS SDK services
jest.mock('@aws-sdk/client-sns');

// Mock environment variables
process.env.ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:SMS-Processing-Alerts';
process.env.CROSS_VALUE = 'test-api-key';

describe('SMS Processor Lambda Function', () => {
  let mockSNSClient;
  let mockHttps;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock SNS send method
    mockSNSClient = {
      send: jest.fn()
    };
    SNSClient.mockImplementation(() => mockSNSClient);

    // Mock https.request
    mockHttps = {
      request: jest.fn()
    };
    https.request = mockHttps.request;
  });

  describe('Successful SMS processing', () => {
    it('should process a valid SMS message successfully', async () => {
      // Mock SNS send to return success
      mockSNSClient.send.mockResolvedValue({ MessageId: 'test-message-id' });

      // Create test event with a valid SMS message
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(1);
      expect(result.failure).toBe(0);
      expect(result.messages[0].status).toBe('success');
      expect(result.messages[0].snsMessageId).toBe('test-message-id');

      // Verify SNS was called with correct parameters
      expect(SNSClient).toHaveBeenCalledWith({ region: expect.any(String) });
      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            PhoneNumber: '+11234567890',
            Message: 'Test SMS message',
            MessageAttributes: expect.objectContaining({
              'AWS.SNS.SMS.SMSType': expect.objectContaining({
                DataType: 'String',
                StringValue: 'Transactional'
              })
            })
          })
        })
      );
    });

    it('should process multiple messages in a batch', async () => {
      // Mock SNS send to return success for multiple calls
      mockSNSClient.send.mockResolvedValueOnce({ MessageId: 'test-message-id-1' })
                          .mockResolvedValueOnce({ MessageId: 'test-message-id-2' });

      // Create test event with multiple messages
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id-1',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message 1',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          },
          {
            messageId: 'test-sqs-message-id-2',
            body: JSON.stringify({
              phoneNumber: '0987654321',
              messageBody: 'Test SMS message 2',
              environment: 'prod',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '6e8c5a3f2d1b7e9a4d6c3f8b'
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(2);
      expect(result.failure).toBe(0);
      expect(result.messages.length).toBe(2);
      expect(result.messages[0].status).toBe('success');
      expect(result.messages[1].status).toBe('success');

      // Verify SNS was called twice with different phone numbers
      expect(mockSNSClient.send).toHaveBeenCalledTimes(2);
      expect(mockSNSClient.send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          input: expect.objectContaining({
            PhoneNumber: '+11234567890'
          })
        })
      );
      expect(mockSNSClient.send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: expect.objectContaining({
            PhoneNumber: '+10987654321'
          })
        })
      );
    });
  });

  describe('Failed SMS processing', () => {
    it('should handle missing required parameters', async () => {
      // Create test event with missing phoneNumber
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              // phoneNumber is missing
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          }
        ]
      };

      // Mock SNS send for the alert
      mockSNSClient.send.mockResolvedValue({});

      // Mock https.request for the audit API
      const mockRequest = new EventEmitter();
      mockRequest.write = jest.fn();
      mockRequest.end = jest.fn();

      const mockResponse = new EventEmitter();

      mockHttps.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(0);
      expect(result.failure).toBe(1);
      expect(result.messages[0].status).toBe('failure');
      expect(result.messages[0].error).toContain('Missing required parameters');

      // Verify alert was sent
      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: process.env.ALERT_TOPIC_ARN,
            Subject: 'SMS Processing Error'
          })
        })
      );
    });

    it('should handle SNS publish errors and call the audit API', async () => {
      // Mock SNS send to throw an error
      const snsError = new Error('SNS publish failed');
      mockSNSClient.send.mockImplementation(command => {
        if (command.input && command.input.TopicArn) {
          // This is the alert, let it succeed
          return Promise.resolve({});
        } else {
          // This is the SMS, make it fail
          return Promise.reject(snsError);
        }
      });

      // Mock https.request for the audit API
      const mockRequest = new EventEmitter();
      mockRequest.write = jest.fn();
      mockRequest.end = jest.fn();

      const mockResponse = new EventEmitter();

      mockHttps.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      // Create test event
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(0);
      expect(result.failure).toBe(1);
      expect(result.messages[0].status).toBe('failure');
      expect(result.messages[0].error).toBe(snsError.message);

      // Verify audit API was called
      expect(mockHttps.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: expect.any(String),
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'apiKey': process.env.CROSS_VALUE
          })
        }),
        expect.any(Function)
      );

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('errorMessage')
      );

      // Simulate the response from audit API
      mockResponse.emit('data', JSON.stringify({ success: true }));
      mockResponse.emit('end');
    });
  });

  describe('Audit API integration', () => {
    it('should call the correct environment-specific audit API endpoint', async () => {
      // Mock SNS send to throw an error
      const snsError = new Error('SNS publish failed');
      mockSNSClient.send.mockImplementation(command => {
        if (command.input && command.input.TopicArn) {
          return Promise.resolve({});
        } else {
          return Promise.reject(snsError);
        }
      });

      // Mock https.request for the audit API
      const mockRequest = new EventEmitter();
      mockRequest.write = jest.fn();
      mockRequest.end = jest.fn();

      const mockResponse = new EventEmitter();

      mockHttps.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      // Create test events for different environments
      const environments = ['dev', 'qa', 'prod'];

      for (const env of environments) {
        // Reset mocks for each environment test
        jest.clearAllMocks();

        const event = {
          Records: [
            {
              messageId: `test-sqs-message-id-${env}`,
              body: JSON.stringify({
                phoneNumber: '1234567890',
                messageBody: 'Test SMS message',
                environment: env,
                timestamp: new Date().toISOString(),
                metadata: {
                  customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
                }
              })
            }
          ]
        };

        // Execute the Lambda handler
        await lambda.handler(event);

        // Get the expected endpoint for this environment
        const expectedEndpoint = {
          dev: 'api.eprintitsaas.org',
          qa: 'api.eprintitsaas.net',
          prod: 'api.eprintitsaas.com'
        }[env];

        // Verify the correct endpoint was called
        expect(mockHttps.request).toHaveBeenCalledWith(
          expect.objectContaining({
            hostname: expectedEndpoint
          }),
          expect.any(Function)
        );

        // Simulate the response from audit API
        mockResponse.emit('data', JSON.stringify({ success: true }));
        mockResponse.emit('end');
      }
    });

    it('should handle audit API errors gracefully', async () => {
      // Mock SNS send to throw an error
      const snsError = new Error('SNS publish failed');
      mockSNSClient.send.mockImplementation(command => {
        if (command.input && command.input.TopicArn) {
          return Promise.resolve({});
        } else {
          return Promise.reject(snsError);
        }
      });

      // Mock https.request to simulate an error
      const mockRequest = new EventEmitter();
      mockRequest.write = jest.fn();
      mockRequest.end = jest.fn(() => {
        mockRequest.emit('error', new Error('Network error'));
      });

      mockHttps.request.mockReturnValue(mockRequest);

      // Create test event
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions - the main function should complete despite audit API errors
      expect(result.success).toBe(0);
      expect(result.failure).toBe(1);
      expect(result.messages[0].status).toBe('failure');
    });

    it('should handle missing customerId in metadata', async () => {
      // Mock SNS send to throw an error
      const snsError = new Error('SNS publish failed');
      mockSNSClient.send.mockImplementation(command => {
        if (command.input && command.input.TopicArn) {
          return Promise.resolve({});
        } else {
          return Promise.reject(snsError);
        }
      });

      // Mock console.warn to check for the warning
      const originalWarn = console.warn;
      console.warn = jest.fn();

      // Create test event with missing customerId
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                // customerId is missing
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(0);
      expect(result.failure).toBe(1);

      // Should log a warning about missing customerId
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No customerId found')
      );

      // Restore console.warn
      console.warn = originalWarn;
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed JSON in SQS message body', async () => {
      // Create test event with invalid JSON
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: '{invalid-json'
          }
        ]
      };

      // Mock SNS send for the alert
      mockSNSClient.send.mockResolvedValue({});

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(0);
      expect(result.failure).toBe(1);
      expect(result.messages[0].status).toBe('failure');
      expect(result.messages[0].error).toContain('SyntaxError');
    });

    it('should handle empty Records array', async () => {
      // Create test event with no records
      const event = {
        Records: []
      };

      // Execute the Lambda handler
      const result = await lambda.handler(event);

      // Assertions
      expect(result.success).toBe(0);
      expect(result.failure).toBe(0);
      expect(result.messages.length).toBe(0);
    });

    it('should handle null or undefined event', async () => {
      // Execute the Lambda handler with null
      const resultNull = await lambda.handler(null);

      // Execute the Lambda handler with undefined
      const resultUndefined = await lambda.handler(undefined);

      // Assertions
      expect(resultNull.success).toBe(0);
      expect(resultNull.failure).toBe(0);

      expect(resultUndefined.success).toBe(0);
      expect(resultUndefined.failure).toBe(0);
    });
  });

  describe('Alert notifications', () => {
    it('should send alerts with the correct information', async () => {
      // Mock SNS send to throw an error for SMS but succeed for alert
      const snsError = new Error('SNS publish failed');
      mockSNSClient.send.mockImplementation(command => {
        if (command.input && command.input.TopicArn) {
          // This is the alert, let it succeed
          return Promise.resolve({});
        } else {
          // This is the SMS, make it fail
          return Promise.reject(snsError);
        }
      });

      // Create test event
      const event = {
        Records: [
          {
            messageId: 'test-sqs-message-id',
            body: JSON.stringify({
              phoneNumber: '1234567890',
              messageBody: 'Test SMS message',
              environment: 'dev',
              timestamp: new Date().toISOString(),
              metadata: {
                customerId: '5f7b3a2e1d8c5b6a3f9e4d2c'
              }
            })
          }
        ]
      };

      // Execute the Lambda handler
      await lambda.handler(event);

      // Find the alert SNS call
      const alertCall = mockSNSClient.send.mock.calls.find(
        call => call[0].input && call[0].input.TopicArn === process.env.ALERT_TOPIC_ARN
      );

      // Verify the alert was sent with correct data
      expect(alertCall).toBeDefined();
      expect(alertCall[0].input.Subject).toBe('SMS Processing Error');

      // Parse the message body
      const messageBody = JSON.parse(alertCall[0].input.Message);
      expect(messageBody.error).toBe(snsError.message);
      expect(messageBody.messageId).toBe('test-sqs-message-id');
      expect(messageBody.body).toBeDefined();
      expect(messageBody.timestamp).toBeDefined();
    });
  });
});
