const { Locations } = require("./collections");
const { getObjectId: ObjectId } = require("../utils");

const locationByCustomerId = async (db, customerId) => {
  return await db
    .collection(Locations)
    .find(
      {
        CustomerID: ObjectId.createFromHexString(customerId),
        IsDeleted: false,
      },
      { projection: { AdvancedEmails: 1, ShortName: 1, _id: 1 } }
    )
    .toArray();
};

module.exports = { locationByCustomerId };
