const CustomLogger = require("../helpers/customLogger");
const { setErrorResponse, setSuccessResponse } = require("../services/api-handler");
const ERROR = require("../helpers/error-keys");
const {getObjectId: ObjectId} = require("../helpers/objectIdConvertion");
const {getDb} = require("../config/db");
const log = new CustomLogger();

/**
 * Save failed SMS logs to the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveSmsAuditLog = async (req, res) => {
  log.lambdaSetup(req, 'smsAudit.controller', 'saveSmsAuditLog');
  try {
    const { errorMessage, phoneNumber, customerId } = req.body;

    if (!errorMessage || !customerId) {
      return await setErrorResponse(null, ERROR.MISSING_INPUT, res);
    }

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);

    // Create new audit log document
    const auditLogDoc = {
      Type: 'SMS',
      Date: new Date(),
      Mobile: phoneNumber || '',
      ErrorMessage: errorMessage,
      CustomerID: ObjectId.createFromHexString(customerId),
      ExpireAt: expireAt
    };

    // Get the database connection
    const db = await getDb()

    const indexes = await db.collection('AuditLogs').indexes();
    const hasExpireIndex = indexes.some(index => index.name === 'ExpireAt_1');

    if (!hasExpireIndex) {
      await db.collection('AuditLogs').createIndex({ ExpireAt: 1 }, { expireAfterSeconds: 0 });
    }

    // Insert document into AuditLogs collection
    const result = await db.collection('AuditLogs').insertOne(auditLogDoc);

    return await setSuccessResponse({
      success: true,
      message: 'SMS audit log saved successfully',
      data: { ...auditLogDoc, _id: result.insertedId }
    }, res);
  } catch (error) {
    log.error('Error saving SMS audit log:', error);
    return await setErrorResponse(error, ERROR.UNKNOWN_ERROR, res);
  }
};

module.exports = {
  saveSmsAuditLog
};
