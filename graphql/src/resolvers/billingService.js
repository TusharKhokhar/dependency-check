const { getDb } = require("../../config/dbHandler");
const { GraphQLError } = require("graphql");
const { verifyUserAccess } = require("../../helpers/util");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger();

module.exports = {
  Query: {
    async getBillingServices(_, { paginationInput }, context) {
      log.lambdaSetup(context, "billing", "getBillingServices");
      try {
        let { pattern, pageNumber, limit, sort, status, sortKey } = paginationInput;
        verifyUserAccess(context, context.data.CustomerID);
        
        pageNumber = pageNumber ? parseInt(pageNumber) : 1;
        limit = limit ? parseInt(limit) : 10;
        sortKey = sortKey || "ServiceName";
        sort = sort === "desc" ? -1 : 1;

        const db = await getDb();
        const query = {};
        if (status) query.status = status;
        if (pattern) query.ServiceName = { $regex: pattern, $options: "i" };

        const servicesCursor = db.collection("BillingServices")
          .find(query)
          .sort({ [sortKey]: sort })
          .skip((pageNumber - 1) * limit)
          .limit(limit);
        
        const services = await servicesCursor.toArray();
        const total = await db.collection("BillingServices").countDocuments(query);

        return {
          services,
          total,
        };
      } catch (error) {
        log.error("getBillingServices error ***", error);
        throw new GraphQLError(error?.message || "Failed to fetch billing services");
      }
    },
  },
};
