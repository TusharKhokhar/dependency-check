const { iotPolicy, cloudWatchFilterLogsPolicy } = require("./services/policy");
const { getStsCredentials } = require("./helpers/credentialGenerator");
const {
  fetchAllOfflineThings,
  fetchAllDuplicateThing,
} = require("./services/iot-handler");
const { region } = require("./config/config");
const { getDb, switchDb } = require("./config/db");
const CustomLogger = require("./helpers/customLogger");
const log = new CustomLogger();

module.exports.handler = async (req, res) => {
  try {
    const db = await getDb();
    const policy = await iotPolicy();
    const credentials = await getStsCredentials(policy);
    const accessParams = {
      accessKeyId: credentials.Credentials.AccessKeyId,
      secretAccessKey: credentials.Credentials.SecretAccessKey,
      sessionToken: credentials.Credentials.SessionToken,
    };
    // Disabled premium customer processing for now 
    // const premiumCustomers = await db
    //   .collection("Customers")
    //   .find({ Tier: "premium", IsDeleted: false, IsActive: true })
    //   .toArray();

    // if (premiumCustomers && premiumCustomers.length) {
    //   await runIotAlerts(db, accessParams);
    //   for (let customerPre of premiumCustomers) {
    //     const premDb = await switchDb(customerPre.DomainName);
    //     await runIotAlerts(premDb, accessParams);
    //   }
    // } else {
    //    await runIotAlerts(db, accessParams);
    // }

    // Fetch and log offline things
    await runIotAlerts(db, accessParams);

    // Logs all duplicate thing connections within 24 hours 
    await runDuplicateThingConnectionAlerts(db);
  } catch (e) {
    log.error("Error while logging offline things:", e);
  }
};

let runIotAlerts = async (db, accessParams) => {
  const dbThings = await getDbThings(db);
  const awsThings = await fetchAllOfflineThings(region, accessParams);

  const bulkOperations = [];
  for (const thing of dbThings) {
    const existingThing = awsThings.find(
      (ele) => ele.thingName === thing.PrimaryRegion?.ThingName
    );
    if (existingThing) {
      const currentTimeStamp = new Date().getTime();
      const thingOfflineDuration =
        existingThing.connectivity.timestamp > 0
          ? currentTimeStamp - existingThing.connectivity.timestamp
          : 0;

      const offlineThing = {
        Type: "ThingOfflineAlert",
        ThingLabel: thing.Label,
        ThingType: thing.ThingType,
        CustomerID: thing.CustomerID,
        ThingName: thing.PrimaryRegion.ThingName,
        ThingID: thing._id,
        OfflineDuration: thingOfflineDuration,
        DisconnectReason: existingThing.connectivity.disconnectReason,
        Date: getTimeStamp(),
      };

      const updateOperation = {
        updateOne: {
          filter: { ThingName: thing.PrimaryRegion.ThingName },
          update: {
            $set: offlineThing,
            $setOnInsert: { CreatedAt: getTimeStamp() },
          },
          upsert: true, // Insert if not exists or Update if exists
        },
      };
      bulkOperations.push(updateOperation);
    }
  }

  if (bulkOperations.length > 0) {
    await db.collection("AuditLogs").bulkWrite(bulkOperations);
  }
};

let getTimeStamp = () => {
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

let getDbThings = async (db) => {
  return new Promise((resolve, reject) => {
    try {
      let thingList = [];
      const recordsPerPage = 10;
      const page = 0;
      const recursiveFetchThing = async (db, recordsPerPage, page) => {
        const data = await db
          .collection("Things")
          .find({
            IsActive: true,
            IsDeleted: false,
          })
          .skip(recordsPerPage * page)
          .limit(recordsPerPage)
          .toArray();

        if (data.length) {
          thingList = thingList.concat(data || []);
          page += 1;
          await recursiveFetchThing(db, recordsPerPage, page);
        } else {
          resolve(thingList);
        }
      };
      recursiveFetchThing(db, recordsPerPage, page);
    } catch (error) {
      reject(error);
    }
  });
};

let runDuplicateThingConnectionAlerts = async (db) => {
  try {
    console.log("START runDuplicateThingConnectionAlerts")
    const cloudWatchPolicy = cloudWatchFilterLogsPolicy();
    const cloudWatchCredentials = await getStsCredentials(cloudWatchPolicy);
    const cloudWatchAccessParams = {
      accessKeyId: cloudWatchCredentials.Credentials.AccessKeyId,
      secretAccessKey: cloudWatchCredentials.Credentials.SecretAccessKey,
      sessionToken: cloudWatchCredentials.Credentials.SessionToken,
    };

    const startTime = Date.now() -  24 * 60 * 60 * 1000;

    await db.collection("AuditLogs").updateMany(
      { Type: "DuplicateClientConnection", Date: { $lt: getTimeStamp() } },
      { $set: { DuplicateConnectionCount: 0, IPAddress: [] } }
    );

    const uniqueMessages = {};
    const errorMessage = "A new connection was established with the same client ID";
    const disconnectReason = "DUPLICATE_CLIENT_ID"; 

    await fetchAllDuplicateThing(region, cloudWatchAccessParams, startTime, async (batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;

      let groupedByClientId = {};
      for (const log of batch) {
        if (!groupedByClientId[log.clientId]) {
          groupedByClientId[log.clientId] = {
            errorMessages: new Set(),
            disconnectReasons: new Set(),
            sourceIps: new Set(),
            count: 0,
          };
        }
        let group = groupedByClientId[log.clientId];

        if (log.details) {
          const trimmed = log.details.trim();
          group.errorMessages.add(trimmed);
          if (trimmed && trimmed !== errorMessage) {
            if (!uniqueMessages[log.clientId]) {
              uniqueMessages[log.clientId] = {
                errorMessages: new Set(),
                disconnectReasons: new Set(),
              };
            }
            uniqueMessages[log.clientId].errorMessages.add(trimmed);
          }
        }

        if (log.reason) {
          const trimmed = log.reason.trim();
          group.disconnectReasons.add(trimmed);
          if (trimmed && trimmed !== disconnectReason) {
            if (!uniqueMessages[log.clientId]) {
              uniqueMessages[log.clientId] = {
                errorMessages: new Set(),
                disconnectReasons: new Set(),
              };
            }
            uniqueMessages[log.clientId].disconnectReasons.add(trimmed);
          }
        }

        if (log.sourceIp) group.sourceIps.add(log.sourceIp);
        group.count++;
      }

      // Enrich batch records with DB lookup (Things & Customers)
      const thingNames = Object.keys(groupedByClientId);
      const things = await db.collection("Things")
        .find({ "PrimaryRegion.ThingName": { $in: thingNames } })
        .project({ "PrimaryRegion.ThingName": 1, CustomerID: 1, Label: 1, Thing: 1 })
        .toArray();

      const customerIds = [...new Set(things.map(t => t.CustomerID).filter(Boolean))];
      const customers = await db.collection("Customers")
        .find({ _id: { $in: customerIds } })
        .project({ CustomerName: 1 })
        .toArray();

      const thingMap = new Map(things.map(t => [
        t.PrimaryRegion.ThingName,
        { CustomerID: t.CustomerID, Label: t.Label, Thing: t.Thing, ThingID: t._id }
      ]));
      const customerMap = new Map(customers.map(c => [c._id.toString(), c.CustomerName]));

      const bulkOps = Object.entries(groupedByClientId).map(([thingName, g]) => {
        const thingData = thingMap.get(thingName) || {};
        const customerId = thingData.CustomerID || null;

        return {
          updateOne: {
            filter: { Type: "DuplicateClientConnection", ThingName: thingName },
            update: {
              $set: {
                ThingID: thingData.ThingID,
                ThingLabel: thingData.Label,
                Thing: thingData.Thing,
                CustomerID: customerId,
                CustomerName: customerId ? customerMap.get(customerId.toString()) || null : null,
                Date: getTimeStamp(),
                ErrorMessage: [...g.errorMessages].join(", "),
                DisconnectReason: [...g.disconnectReasons].join(", "),
              },
              $inc: { DuplicateConnectionCount: g.count },
              $addToSet: {
                IPAddress: { $each: [...g.sourceIps] }
              },
              $setOnInsert: { CreatedAt: getTimeStamp() },
            },
            upsert: true,
          },
        };
      });
      if (bulkOps.length) {
        await db.collection("AuditLogs").bulkWrite(bulkOps);
        bulkOps.length = 0;
      }
    });

    const finalBulkOps = Object.entries(uniqueMessages).map(([thingName, g]) => {
      const errorMsg = [...g.errorMessages].join(", ");
      const disconnectReason = [...g.disconnectReasons].join(", ");
      return {
        updateOne: {
          filter: { Type: "DuplicateClientConnection", ThingName: thingName },
          update: [
            {
              $set: {
                ErrorMessage: { $concat: [{ $ifNull: ["$ErrorMessage", ""] }, errorMsg ? ", " + errorMsg : ""]},
                DisconnectReason: { $concat: [{ $ifNull: ["$DisconnectReason", ""] }, disconnectReason ? ", " + disconnectReason : ""]},
              },
            },
          ],
        },
      };
    });

    if (finalBulkOps.length) { 
      await db.collection("AuditLogs").bulkWrite(finalBulkOps); 
    }
    console.log("PROCESS COMPLETED - runDuplicateThingConnectionAlerts")
  } catch (error) {
    log.error("Error in runDuplicateThingConnectionAlerts:", error);
  }
};
