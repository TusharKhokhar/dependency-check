const { Customers } = require("./collections");

const customerDataByDomainName = async (db, subdomain) => {
  return await db.collection(Customers).findOne(
    { DomainName: subdomain, IsDeleted: false },
    {
      projection: {
        _id: 1,
        Tier: 1,
        DomainName: 1,
        CustomerName: 1,
      },
    }
  );
};

module.exports = { customerDataByDomainName };