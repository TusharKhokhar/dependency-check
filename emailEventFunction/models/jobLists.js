const { JobLists } = require("./collections");
const { getObjectId: ObjectId } = require("../utils");

const jobListByCustomerId = async (db, customerId) => {
  return await await db.collection(JobLists).findOne(
    {
      CustomerID: ObjectId.createFromHexString(customerId),
    },
    {
      projection: {
        AutomaticPrintDelivery: 1,
        DefaultValues: 1,
        _id: 0,
      },
    }
  );
};

module.exports = { jobListByCustomerId };
