const { getDb } = require("./config/db");
const CustomLogger = require("./helpers/customLogger");
const https = require("https");

const log = new CustomLogger();

/**
 * Lambda function to detect SMS failures from CloudWatch logs
 * Triggered when CloudWatch Logs indicate a failed SMS delivery
 */
module.exports.handler = async (event) => {
  try {
    const db = await getDb();

    // Parse CloudWatch Logs event
    const logEvents = parseCloudWatchEvent(event);

    for (const logEvent of logEvents) {
      try {
        const messageId = extractMessageIdFromLog(logEvent);

        if (!messageId) {
          log.warn('No messageId found in log event', { logEvent });
          continue;
        }

        // Look up the messageId in MongoDB
        const smsRecord = await findSmsRecord(db, messageId.messageId);

        if (!smsRecord) {
          log.warn(`SMS record not found for messageId: ${messageId.messageId}`);
          continue;
        }

        // Call audit API with the failure information
        await callSmsAuditApi(smsRecord, messageId.error, smsRecord.environment, smsRecord.phoneNumber, smsRecord.customerId)

        log.info(`Successfully processed SMS failure for messageId: ${messageId}`, {
          messageId,
          phoneNumber: smsRecord.phoneNumber,
          customerId: smsRecord.customerId,
          environment: smsRecord.environment
        });

      } catch (error) {
        log.error('Error processing individual log event:', error);
        // Continue processing other events
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedEvents: logEvents.length
      })
    };

  } catch (error) {
    log.error('Error in SMS failure detection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Parse CloudWatch Logs event to extract log messages
 */
function parseCloudWatchEvent(event) {
  try {
    // Handle CloudWatch Logs subscription filter event
    if (event.awslogs && event.awslogs.data) {
      const compressed = Buffer.from(event.awslogs.data, 'base64');
      const uncompressed = require('zlib').gunzipSync(compressed);
      const logData = JSON.parse(uncompressed.toString('utf8'));
      return logData.logEvents || [];
    }

    // Handle direct CloudWatch event
    if (event.Records) {
      return event.Records.map(record => ({
        message: record.Sns ? record.Sns.Message : record.message,
        timestamp: record.timestamp || Date.now()
      }));
    }

    // Handle direct log message
    if (event.message) {
      return [{ message: event.message, timestamp: event.timestamp || Date.now() }];
    }

    return [];
  } catch (error) {
    log.error('Error parsing CloudWatch event:', error);
    return [];
  }
}

/**
 * Extract messageId and error information from CloudWatch log message
 * Handles the new SNS delivery status log format
 */
function extractMessageIdFromLog(logEvent) {
  try {
    const message = logEvent.message;

    // Try to parse as JSON first (new format)
    try {
      const parsed = JSON.parse(message);

      // Check if this is the new SNS delivery status format
      if (parsed.notification && parsed.delivery && parsed.status) {
        const messageId = parsed.notification.messageId;
        const status = parsed.status;
        const destination = parsed.delivery.destination;
        const providerResponse = parsed.delivery.providerResponse;

        // Only process FAILURE status logs
        if (status === 'FAILURE') {
          return {
            messageId,
            error: providerResponse || 'SMS delivery failed',
            phoneNumber: destination
          };
        }
        return null; // Skip non-failure logs
      }

      // Fallback to existing messageId extraction for other formats
      return {
        messageId: parsed.messageId || parsed.MessageId || parsed.message_id,
        error: parsed.error || parsed.errorMessage || 'SMS delivery failed',
        phoneNumber: parsed.phoneNumber || parsed.destination
      };
    } catch (e) {
      // Not JSON, continue with regex patterns
    }

    // Existing regex patterns for backward compatibility
    const snsPattern = /MessageId:\s*([a-f0-9-]+)/i;
    const snsMatch = message.match(snsPattern);
    if (snsMatch) return { messageId: snsMatch[1] };

    const pinpointPattern = /messageId["\']?\s*:\s*["\']?([a-f0-9-]+)/i;
    const pinpointMatch = message.match(pinpointPattern);
    if (pinpointMatch) return { messageId: pinpointMatch[1] };

    const genericPattern = /message[_-]?id["\']?\s*[:=]\s*["\']?([a-f0-9-]+)/i;
    const genericMatch = message.match(genericPattern);
    if (genericMatch) return { messageId: genericMatch[1] };

    return null;
  } catch (error) {
    log.error('Error extracting messageId from log:', error);
    return null;
  }
}

/**
 * Find SMS record in MongoDB by messageId
 */
async function findSmsRecord(db, messageId) {
  try {
    const collection = db.collection('SmsMessageAudit');
    return await collection.findOne({ messageId });
  } catch (error) {
    log.error('Error finding SMS record:', error);
    throw error;
  }
}

const API_ENDPOINTS = {
  dev: 'api.eprintitsaas.org',
  qa: 'api.eprintitsaas.net',
  prod: 'api.eprintitsaas.com'
};

/**
 * Call the SMS audit API to log failed messages
 * @param {Object} messageData - The message data
 * @param {string} error - The error message
 * @param {string} environment - The environment (dev, staging, prod)
 * @param phoneNumber
 * @param customerId
 * @returns {Promise} - The API response
 */
const callSmsAuditApi = async (messageData, error, environment, phoneNumber, customerId) => {
  const hostname = API_ENDPOINTS[environment] || API_ENDPOINTS.prod;
  const apiUrl = `https://${hostname}/public/smsAuditLog`;

  // Parse the URL to get hostname, path, etc.
  const parsedUrl = new URL(apiUrl);

  // Prepare the request options
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': process.env.CROSS_VALUE
    }
  };

  if (!customerId) {
    console.warn('No customerId found in message metadata, cannot log to audit API');
    return Promise.resolve({ success: false, message: 'Missing customerId' });
  }
  // Prepare the request body
  const requestBody = JSON.stringify({
    errorMessage: error,
    phoneNumber: phoneNumber,
    customerId: customerId
  });

  console.log(`Calling SMS audit API at ${apiUrl} with:`, requestBody);

  // Return a promise that resolves when the API call completes
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log('SMS audit API response:', parsedResponse);
          resolve(parsedResponse);
        } catch (error) {
          console.error('Error parsing SMS audit API response:', error);
          resolve({ success: false, message: 'Error parsing response', data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error calling SMS audit API:', error);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
};
