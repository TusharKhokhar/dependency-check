const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const {region, prodAwsAccountNumber, smsQueueName, Stage} = require("../config/config");

// Initialize clients
const sqs = new SQSClient({ region: region});

module.exports.awsTextMessageHandler = async (event) => {
    const queueUrl = `https://sqs.us-east-1.amazonaws.com/${prodAwsAccountNumber}/${smsQueueName}`;

    try {
        const { phoneNumber, messageBody, metadata, customerData } = event;

        if (!phoneNumber || !messageBody) {
            throw new Error('Missing required parameters: phoneNumber or messageBody');
        }

        // Prepare message for SQS
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({
                phoneNumber,
                messageBody,
                metadata: metadata || {},
                environment: Stage,
                customerId: customerData?._id || null,
                timestamp: new Date().toISOString()
            })
        };

        const command = new SendMessageCommand(params);
        const result = await sqs.send(command);
        console.log('Message sent successfully:', result.MessageId);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'SMS request queued successfully',
                messageId: result.MessageId
            })
        };
    } catch (error) {
        console.error('Error sending SMS request:', error);
        throw error;
    }
};