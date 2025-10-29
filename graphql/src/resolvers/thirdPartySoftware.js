const model = require("../../models/index");
const { customerSecurity } = require("../../utils/validation");
const { getDb } = require("../../config/dbHandler");
const CustomLogger = require("../../helpers/customLogger");
const { verifyUserAccess } = require("../../helpers/util");
const log = new CustomLogger();

module.exports = {
  Query: {
    async getThirdPartySoftware(_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, "ThirdPartySoftware", "getThirdPartySoftware");
      try {
        let { pattern, pageNumber, limit, sort, sortKey, status } =
          paginationInput;
        verifyUserAccess(context, context.data.CustomerID);
        const customerId = context.data.customerIdsFilter;
        const tenantDomain = context.data.TenantDomain;
        pageNumber = pageNumber ? parseInt(pageNumber) : undefined;
        limit = limit ? parseInt(limit) : undefined;

        customerIds = customerIds || [];
        const secureIds = await customerSecurity(
          tenantDomain,
          customerId,
          customerIds,
          context
        );

        if (secureIds) {
          customerIds = secureIds;
        }
        const db = await getDb();
        const thirdPartySoftwareList =
          await model.thirdPartySoftware.getThirdPartySoftwareInformation({
            pattern,
            sort,
            pageNumber,
            limit,
            sortKey,
            status,
            customerIds,
            db,
            context
          });

        return thirdPartySoftwareList;
      } catch (error) {
        log.error("getThirdPartySoftware error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
