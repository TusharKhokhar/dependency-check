const utcDateGet = () => {
  const date = new Date();
  const nowUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  return new Date(nowUtc);
};

const addProtonTransactionRecord = async (db, transactions, jobId) => {
  try {
    const docsToInsert = [];
    for (const transactionObj of transactions) {
      const protonPayload = transactionObj?.ProtonPayload;
      const obj = {
        Type: "Retry",
        CustomerID: transactionObj?.CustomerID,
        Customer: transactionObj?.Customer,
        BillingAccountId: protonPayload?.contactId,
        BillingAccountName: transactionObj?.BillingAccountName,
        UsageID: transactionObj?.UsageID,
        ThirdPartyTransactionID: jobId,
        LocationID: transactionObj?.LocationID,
        Thing: transactionObj?.Thing,
        ThingID: transactionObj?.ThingID,
        TransactionPayload: {
          ContactId: protonPayload?.contactId,
          StartDate: protonPayload?.startDate,
          LocationNumber: protonPayload?.locationNumber,
          ServiceId: protonPayload?.serviceId,
          Quantity: protonPayload?.quantity,
          CurrencyCode: protonPayload?.currencyCode,
          TransactionId: protonPayload?.transactionId,
        },
        CreatedAt: utcDateGet(),
        ExpireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      docsToInsert.push(obj);
    }
    if (docsToInsert.length === 0) {
      return;
    }
    await db.collection("AuditProtonTransaction").insertMany(docsToInsert);
    console.log(`Inserted successful transactions for jobId ${jobId}`);
  } catch (error) {
    console.error("Error inserting successful transactions:", error);
  }
};

module.exports = {
  addProtonTransactionRecord,
};
