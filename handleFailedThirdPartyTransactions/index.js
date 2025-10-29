const { getDb } = require('./config/db');
const { decryptText } = require("./helpers/encryptDecrypt");
const protonService = require("./service/protonService");
const { getObjectId: ObjectId } = require("./helpers/objectIdConvertion");
const { addProtonTransactionRecord } = require('./service/dbService');

const TRANSACTION_STATUS = {
    SUCCESS: 'Success',
    FAILED: 'Failed'
};

module.exports.handler = async (event, context) => {
    console.log('Event:', event);
    try {
        const db = await getDb();
        await retryFailedProtonTransactions(event, db);
        return { status: 'success' };
    } catch (error) {
        console.log('Handler error:', error);
        throw error;
    }
};

const retryFailedProtonTransactions = async (event, db) => {
    console.log('Retrying failed Proton transactions...');
    const protonConfigs = await db.collection('Protons')
      .find({
          IsDeleted: false,
          IsActive: true,
          ThirdPartySoftwareType: "ProtonIntegration"
      })
      .toArray();
    for (const config of protonConfigs) {
        await processCustomerTransactions(config, db);
    }
};

const processCustomerTransactions = async (config, db) => {
    const { CustomerID } = config;
    config.ClientSecret = await decryptText(config.ClientSecret);
    const batchSize = 1000;
    let skip = 0;

    while (true) {
        const failedTransactions = await db.collection('AuditLogs')
          .find({
              CustomerID,
              RetryCount: { $lte: 5 },
              Status: TRANSACTION_STATUS.FAILED,
              ShouldRetry: true
          })
          .sort({ _id: -1 })
          .skip(skip)
          .limit(batchSize)
          .toArray();

        if (!failedTransactions.length) break;

        await processTransactionBatch(failedTransactions, config, db);
        skip += batchSize;
    }
};

const processTransactionBatch = async (transactions, config, db) => {
    const { CustomerID } = config;
    const transactionPayloads = await transactions.map(t => t.ProtonPayload);

    try {
        const { token } = await protonService.getProtonToken(config);
        console.log('transactionPayloads: ',transactionPayloads);
        const retryResponse = await protonService.sendTransaction(config, token, transactionPayloads);
        console.log('retryResponse: ',retryResponse);
        if (!retryResponse?.jobId && !retryResponse?.invalidTransactions) {
            await handleConfigurationError(transactions, db, CustomerID);
            return;
        }

        await processRetryResponse(retryResponse, transactions, config, db, token);

        console.log(`Processed ${transactions.length} failed transactions for customer ${CustomerID}`);
    } catch (error) {
        console.log(`Error processing transactions for customer ${CustomerID}:`, error);
        await handleConfigurationError(transactions, db, CustomerID);
    }
};

const handleConfigurationError = async (transactions, db, CustomerID) => {
    const usageIDs = transactions.map(t => t.UsageID);
    await updateTransactionStatus(
      db,
      CustomerID,
      usageIDs,
      TRANSACTION_STATUS.FAILED,
      true
    );
};

const processRetryResponse = async (retryResponse, transactions, config, db, token) => {
    console.log('inside processRetryResponse');
    const { CustomerID } = config;
    const invalidTransactionIds = new Set(
      retryResponse?.invalidTransactions?.map(t => t.transactionId) || []
    );
    console.log('invalidTransactionIds: ',invalidTransactionIds)
    const validTransactions = transactions
      .filter(t => !invalidTransactionIds.has(t.ProtonPayload.transactionId))
      .map(t => t.ProtonPayload);
    console.log('validTransactions: ',validTransactions);
    
    let finalJobId = retryResponse?.jobId;
    // Retry valid transactions if there were invalid ones
    if (validTransactions.length && invalidTransactionIds.size) {
        console.log('Retrying valid transactions...');
        const retryValidResponse = await protonService.sendTransaction(config, token, validTransactions);
        console.log('Retry response for valid transactions:', retryValidResponse);
        finalJobId = retryValidResponse?.jobId;
    }
    // Update valid transactions
    if (validTransactions.length) {
        console.log('Updating valid transactions...');
        const validUsageIDs = validTransactions.map(t =>
          ObjectId.createFromHexString(t.transactionId)
        );
        await updateTransactionStatus(
          db,
          CustomerID,
          validUsageIDs,
          TRANSACTION_STATUS.SUCCESS
        );
        
        // Store successful valid transactions in AuditProtonTransaction
        if (finalJobId) {
          const _validTransactions = transactions.filter(
            (t) => !invalidTransactionIds.has(t.ProtonPayload.transactionId)
          );
          await addProtonTransactionRecord(db, _validTransactions, finalJobId);
        }
    }

    // Update invalid transactions
    if (invalidTransactionIds.size) {
        const invalidUsageIDs = Array.from(invalidTransactionIds)
          .map(id => ObjectId.createFromHexString(id));
        await updateTransactionStatus(
          db,
          CustomerID,
          invalidUsageIDs,
          TRANSACTION_STATUS.FAILED,
          true
        );
    }
};

const updateTransactionStatus = async (db, CustomerID, usageIDs, status, incrementRetry = true) => {
    const updateOperations = {
        $set: {
            Status: status,
            LastRetry: new Date(),
            ErrorMessage: `Retry ${status}`
        }
    };

    if (incrementRetry) {
        updateOperations.$inc = { RetryCount: 1 };
    }

    console.log('updateOperations:::::::',updateOperations, usageIDs);

    await db.collection('AuditLogs').updateMany(
      { CustomerID, UsageID: { $in: usageIDs } },
      updateOperations
    );
};