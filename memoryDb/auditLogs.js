const { getDb } = require("../publicAuth/config/db");
const collectionName = "AuditLogs";
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");

const utcDateGet = () => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  return new Date(nowUtc)
}

module.exports = {
    addAuditLog: async (type, errorMessage, CustomerID) => {
        const db = await getDb()
        const auditLogData = {
            Type : type,
            Date : new Date(),
            CreatedAt : utcDateGet(),
            ErrorMessage : errorMessage ? errorMessage : faker.lorem.sentence(),
            ErrorDescription : null,
            CustomerID : CustomerID,
        }

        const data = await db.collection(collectionName).insertOne(auditLogData)
        auditLogData._id = data.insertedId
        return {insertedId: data.insertedId, ops: [auditLogData]}
    },
    getAuditLogsByType: async (type) => {
        const db = await getDb()
        const data = await db.collection(collectionName).find({ Type: type }).toArray()
        return data
    },
}
