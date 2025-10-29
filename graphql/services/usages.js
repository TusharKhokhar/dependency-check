const { fromZonedTime } = require('date-fns-tz')
const model = require("../models");
const {
  getDatabaseForGetAllAPI,
} = require("../helpers/util");
const { Usages } = require("../models/collections");
const { customerSecurity } = require("../utils/validation");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();

const fetchUsages = async ({
  paginationInput = {},
  context,
  customerIds,
  filters = {},
  useUserNameFilter = false,
}) => {
  let { pageNumber, limit, sort, sortKey } = paginationInput;
  let customerId = context.data.customerIdsFilter;
  

  log.info({
    message: "fetchUsages parameters",
    data: {
      customerIds,
      customerId,
      paginationInput,
      filters,
      useUserNameFilter,
    },
  });
  
  if (!useUserNameFilter) {
    filters.userName = context.data.user.Username;
  }
  
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
  if (tenantDomain !== "admin") {
    let testIds = customerIds.map((id) => id.toString());
    let removeDuplicates = (arr) => {
      return arr.filter((item, index) => arr.indexOf(item) === index);
    };
    customerIds = removeDuplicates(testIds);
  }
  try {
    const db = await getDatabaseForGetAllAPI(context, customerIds);
    const collection = await db.collection(Usages);
    filters = await convertFilterTimeFilters(filters);
    return await model.usages
      .getUsageInformation({
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection,
        filters,
      })
      .then((dataSet) => {
        return dataSet;
      })
      .catch((error) => {
        log.error(error);
        throw new Error(error);
      });
  } catch (err) {
    log.error(err);
    throw new Error(err);
  }
};

let convertFilterTimeFilters = async (filters) => {
  log.info(filters);
  if (filters && filters.dateFrom && filters.dateTo) {
    filters.dateFrom = await fromZonedTime(filters.dateFrom, filters.timeZone);
    filters.dateTo = await fromZonedTime(filters.dateTo, filters.timeZone);
    filters.dateFrom = new Date(filters.dateFrom);
    filters.dateTo = new Date(filters.dateTo);
    return filters;
  } else {
    return filters;
  }
};

module.exports = { fetchUsages };