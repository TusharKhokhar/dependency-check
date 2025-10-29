const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// AuditLogs Model
const AuditLogs = {}

/**
 * Method to get all AuditInformation
 */

const errorMappings = {
  INVALID_TOKEN: ["authentication failed"],
  DB_TIMEOUT: ["database response took too long"],
  ENOTFOUND: [
    "LDAP connection error: DNS lookup failed for hostname.",
    "DNS lookup failed for hostname. Please check configuration",
  ],
  ETIMEDOUT: [
    "The connection attempt timed out.",
    "The connection attempt timed out. Please check configuration",
  ],
  ECONNREFUSED: [
    "The connection was refused by the server.",
    "The connection was refused by the server. Please check configuration",
  ],
  CLIENT_INITIATED_DISCONNECT: [
    "The client indicates that it will disconnect. The client can do this by sending either a MQTT DISCONNECT control packet or a Close frame if the client is using a WebSocket connection.",
  ],
  CLIENT_ERROR: [
    "The client did something wrong that causes it to disconnect. For example, a client will be disconnected for sending more than 1 MQTT CONNECT packet on the same connection or if the client attempts to publish with a payload that exceeds the payload limit.",
  ],
  CONNECTION_LOST: [
    "The client-server connection is cut off. This can happen during a period of high network latency or when the internet connection is lost.",
  ],
  MQTT_KEEP_ALIVE_TIMEOUT: [
    "If there is no client-server communication for 1.5x of the client's keep-alive time, the client is disconnected.",
  ],
};

AuditLogs.getAuditLogsInformation = ({ sort, pageNumber, limit, sortKey, customerIds, collection, typeOf, dateFrom, dateTo, message }) => {
    return new Promise((resolve, reject) => {
        const condition = {}
        sort = sort === 'asc' ? 1 : -1
        sortKey = sortKey || '_id'
        const skips = limit * (pageNumber - 1)
        if (customerIds && customerIds.length > 0) {
            customerIds = customerIds.map(custId => {
                return ObjectId.createFromHexString(custId)
            })
            Object.assign(condition, { CustomerID: { $in: customerIds } })
        }
        if (typeOf && typeOf.length > 0) {
          const hasThingOffline = typeOf.includes("ThingOfflineAlert");
          const hasDuplicateClient = typeOf.includes("DuplicateClientConnection");

          if (hasThingOffline || hasDuplicateClient) {
            const orConditions = [];
            // Handle ThingOfflineAlert
            if (hasThingOffline) {
              orConditions.push({ Type: "ThingOfflineAlert", OfflineDuration: { $gt: 0 }});
            }
            // Handle DuplicateClientConnection
            if (hasDuplicateClient) {
              orConditions.push({ Type: "DuplicateClientConnection", DuplicateConnectionCount: { $gt: 0 }});
            }
            // Handle remaining types in typeOf (excluding the special ones)
            const otherTypes = typeOf.filter((t) => t !== "ThingOfflineAlert" && t !== "DuplicateClientConnection");
            if (otherTypes.length > 0) {
              orConditions.push({ Type: { $in: otherTypes } });
            }
            Object.assign(condition, { $or: orConditions });
          } else {
            Object.assign(condition, { Type: { $in: typeOf } });
          }
        } else {
          Object.assign(condition, {
            $or: [
              { Type: { $nin: ["ThingOfflineAlert", "DuplicateClientConnection"] } },
              { Type: "ThingOfflineAlert", OfflineDuration: { $gt: 0 } },
              { Type: "DuplicateClientConnection", DuplicateConnectionCount: { $gt: 0 }},
            ],
          });
        }
        if (dateTo && dateFrom) {
            Object.assign(condition, {Date: {"$gte": dateFrom, "$lte": dateTo}})
        }
        if (message) {
            const lowerMessage = message.toLowerCase();

            const possibleErrorKeys = Object.entries(errorMappings)
              .filter(([key, values]) =>
                values.some((val) => val.toLowerCase().includes(lowerMessage))
              )
              .map(([key]) => key);

           Object.assign(condition, {
                $or: [
                    { ErrorMessage: { $regex: prepareSearchRegex(message), $options: 'i' } }, // case-insensitive substring match
                    { ErrorMessage: { $in: possibleErrorKeys } },
                    { DisconnectReason : { $in : possibleErrorKeys}},
                ]
            });
        }
        const query = [
            {
                $match: condition
            },
            {
                $lookup: {
                    from: 'Customers',
                    localField: 'CustomerID',
                    foreignField: '_id',
                    as: 'CustomerData'
                }
            },
            {
                $unwind: {
                    path: '$CustomerData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'Groups',
                    localField: 'GroupID',
                    foreignField: '_id',
                    pipeline: [
                        { $project: { _id: 1, GroupName: 1, GroupType: 1 } }
                    ],
                    as: 'GroupData'
                }
            },
            {
                $unwind: {
                    path: '$GroupData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    CustomerID: '$CustomerID',
                    CustomerData: {
                        CustomerName: '$CustomerData.CustomerName',
                        _id: '$CustomerData._id',
                        DomainName: '$CustomerData.DomainName'
                    },
                    Type: '$Type',
                    Date: '$Date',
                    FileName: '$FileName',
                    ReleaseCode: '$ReleaseCode',
                    User: '$User',
                    Amount: '$Amount',
                    ErrorMessage: '$ErrorMessage',
                    QuotaGroupID: '$QuotaGroupID',
                    RetryCount: '$RetryCount',
                    UsageID: '$UsageID',
                    Status: '$Status',
                    QuotaGroupName: '$QuotaGroupName',
                    GroupData: '$GroupData',
                    ThingName: '$ThingName',
                    DisconnectReason: "$DisconnectReason",
                    OfflineDuration: "$OfflineDuration",
                    ThingID: "$ThingID",
                    Mobile: "$Mobile",
                    ThingLabel: "$ThingLabel",
                    DuplicateConnectionCount: "$DuplicateConnectionCount",
                    IPAddress: "$IPAddress",
                    ThingType: "$ThingType",
                    CreatedAt: "$CreatedAt"
                }
            }
        ]
        let totalQuery = query
        totalQuery = totalQuery.concat({ $count: 'total' })
        Promise.props({
            audit: collection.aggregate(query, { collation: { locale: 'en' } })
              .sort({ [sortKey]: sort })
              .skip(skips)
              .limit(limit).toArray(),
            total: collection.aggregate(totalQuery).toArray()
        }).then(results => {
            results.total = results.total[0] &&
            results.total[0].total
              ? results.total[0].total
              : 0
            resolve(results)
        }).catch(err => {
            console.log(err)
            reject(err)
        })
    })
}

function prepareSearchRegex(str) {
    const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flexible = escaped.replace(/\s+/g, '[\\s\\S]*');
    return flexible;
}

module.exports = AuditLogs
