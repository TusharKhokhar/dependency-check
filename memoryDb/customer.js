const { getDb } = require("../publicAuth/config/db");
const collectionName = "Customers";
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");
let customerId
module.exports = {
    addCustomer: async () => {
        const db = await getDb()
        const customerData = {
            CustomerName: faker.company.name(),
            CustomerType: "tbs",
            ParentCustomer: null,
            Description: faker.company.catchPhrase(),
            Tags: faker.lorem.words().split(' '),
            TimeZone: "US/Mountain",
            Partner: faker.datatype.boolean(),
            DomainName: faker.internet.domainWord(),
            Tier: "standard",
            CreatedBy: ObjectId.createFromHexString(),
            IsDeleted: false,
            IsApproved: true,
            ApprovedBy: ObjectId.createFromHexString(),
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            IsActive: true,
            Email: faker.internet.email(),
            Label: faker.lorem.word(),
            UpdatedBy: ObjectId.createFromHexString()
        }
        const data = await db.collection(collectionName).insertOne(customerData)
        customerData._id = data.insertedId
        customerId = data.insertedId
        return {insertedId: data.insertedId, ops: [customerData]}
    },
    updateCustomer: async (updateObject, customerId) => {
      const db = await getDb();
      await db.collection(collectionName).updateOne(
        { _id: ObjectId.createFromHexString(customerId) },
        {
          $set: updateObject,
        }
      );
    },
    getCustomer: async (customerId = "") => {
      const db = await getDb();
      return await db.collection(collectionName).findOne(
        { _id: ObjectId.createFromHexString(customerId) }
      );
    },
}
