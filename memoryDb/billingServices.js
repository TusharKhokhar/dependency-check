const { getDb } = require('../publicAuth/config/db');
const collectionName = 'BillingServices';
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");

module.exports = {
    addBillingService: async () => {
        const db = await getDb();
        const billingServiceData = [
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd942"),
                "ServiceID" : 639,
                "ServiceName" : "Canon Print – Colour A3/Ledger",
                "IsDeleted" : false,
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z")
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd941"),
                "ServiceID" : 638,
                "ServiceName" : "Print – Black & White A3/Ledger",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd944"),
                "ServiceID" : 4130,
                "ServiceName" : "Copy – Colour A4/Letter",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd93e"),
                "ServiceID" : 545,
                "ServiceName" : "Fax",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd940"),
                "ServiceID" : 4132,
                "ServiceName" : "Print – Colour A4/Letter",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd945"),
                "ServiceID" : 635,
                "ServiceName" : "Copy – Black & White A3/Ledger",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd93d"),
                "ServiceID" : 703,
                "ServiceName" : "Document Scanning",
                "IsDeleted" : false,
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z")
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd943"),
                "ServiceID" : 4129,
                "ServiceName" : "Copy – Black & White A4/Letter",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd946"),
                "ServiceID" : 636,
                "ServiceName" : "Copy – Colour A3/Ledger",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            },
            {
                "_id" : ObjectId.createFromHexString("67d80b683c556b36bb9cd93f"),
                "ServiceID" : 4131,
                "ServiceName" : "Print – Black & White A4/Letter",
                "CreatedAt" : new Date("2025-03-17T11:45:44.190Z"),
                "IsDeleted" : false
            }
        ]
        await db.collection(collectionName).insertMany(billingServiceData);
        return { insertedId: billingServiceData[0]._id, ops: billingServiceData };
    },
};
