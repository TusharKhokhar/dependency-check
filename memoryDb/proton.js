const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Protons'
const {getObjectId:ObjectId} = require('../publicAuth/helpers/objectIdConvertion')

module.exports = {
    addProton: async (customerId) => {
        const db = await getDb()
        const {insertedId} = await db.collection(collectionName).insertOne(
          {
              "_id" : ObjectId.createFromHexString("67ce908d37f1bb908e0f03e6"),
              "CustomerID" : customerId,
              "ThirdPartySoftwareType" : "ProtonIntegration",
              "Tags" : [ "test" ],
              "ocpApimSubscriptionKey" : "77777",
              "ClientId" : "123455",
              "ClientSecret" : "",
              "TokenAPIEndpoint" : "https://test.com",
              "TransactionServicesAPIEndpoint" : "https://test.com/transaction",
              "Enabled" : true,
              "CreatedBy" : ObjectId.createFromHexString("63ad433ded68bbe375820925"),
              "IsDeleted" : false,
              "CreatedAt" : new Date("2025-03-10T07:11:09.000Z"),
              "UpdatedAt" : new Date("2025-03-10T07:46:43.000Z"),
              "IsActive" : true,
              "ThirdPartySoftwareName" : "Proton"
          }
        )
        return insertedId
    }
}