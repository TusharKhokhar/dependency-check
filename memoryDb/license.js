const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Licenses'

module.exports = {
    addLicense: async (customerId) => {
        const db = await getDb()
        const {insertedId} = await db.collection(collectionName).insertOne(
            {
                "Tags" : [ ],
                "IsActive" : true,
                "IsDeleted" : false,
                "CustomerID" : customerId,
                "Translation" : true,
                "ThingsLimit": [{
                    "ThingType": "ricoh embedded",
                    "ThingNumber": 456
                }, {
                        "ThingType": "kiosk",
                        "ThingNumber": 10
                    }
                ]
            })
        return insertedId
    },
    updateLicense: async (customerId) => {
        const db = await getDb()
        return await db.collection('Licenses').updateOne({CustomerID: customerId}, {$set: {Translation: false}})
    }
}