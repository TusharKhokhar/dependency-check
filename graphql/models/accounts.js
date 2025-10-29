const { getObjectId: ObjectId } = require("../helpers/objectIdConverter");
const { Accounts: AccountCollection, Customers } = require("./collections");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();
const Accounts = {};

const includeCustomerDetails = async (accounts, db) => {
  // Extract CustomerIDs from the accounts
  const accountCustomerIds = accounts
    .map((account) => account.CustomerID)
    .filter((id) => id);
  log.info("includeCustomerDetails in accountCustomerIds=====",accountCustomerIds)
  let customers = [];

  if (accountCustomerIds.length > 0) {
    customers = await db
      .collection(Customers)
      .find(
        { _id: { $in: accountCustomerIds } },
        { projection: { _id: 1, CustomerName: 1 } }
      )
      .toArray();
  }

  // Create a map of CustomerID to CustomerName
  const customerMap = customers.reduce((acc, customer) => {
    acc[customer._id.toString()] = customer;
    return acc;
  }, {});

  // Flatten customer data into each account
  accounts.forEach((account) => {
    const customerId = account.CustomerID.toString();
    const customer = customerMap[customerId] || null;
    if (customer) {
      // Embed relevant customer fields into the account object
      account.CustomerName = customer.CustomerName || null;
    }
  });

  return accounts;
};

const filterAccountsByPattern = (accounts, pattern) => {
  if (!pattern) return accounts;

  const regex = new RegExp(pattern, "i");
  return accounts.filter(
    (account) =>
      regex.test(account.AccountName || "") ||
      regex.test(account.Tags || "") ||
      regex.test(account.Description || "") ||
      regex.test(account.AccountId || "") ||
      regex.test(account.CustomerName || "")
  );
};

Accounts.getAccountsInformation = async ({
  pattern,
  pageNumber,
  limit,
  sort = "asc",
  status,
  sortKey = "AccountName",
  customerIds,
  db,
}) => {
  try {
    const condition = { IsDeleted: false };
    sort = sort === "dsc" ? -1 : 1;
    sortKey = sortKey || "AccountName";
    const skips = limit * (pageNumber - 1);

    if (customerIds?.length) {
      customerIds = customerIds.map((id) => ObjectId.createFromHexString(id));
      Object.assign(condition, { CustomerID: { $in: customerIds } });
    }

    if (status !== undefined) {
      condition.IsActive = status;
    }

    const accountCollection = db.collection(AccountCollection);
    // Fetch accounts and total count
    let [accounts, total] = await Promise.all([
      limit && pageNumber
        ? accountCollection
            .find(condition, { collation: { locale: "en" } })
            .sort({ [sortKey]: sort })
            .skip(skips)
            .limit(limit)
            .toArray()
        : accountCollection
            .find(condition, { collation: { locale: "en" } })
            .toArray(),
      accountCollection.countDocuments(condition),
    ]);

    // Enrich accounts with customer data
    accounts = await includeCustomerDetails(accounts, db);

    // Apply additional filtering based on CustomerName
    accounts = filterAccountsByPattern(accounts, pattern);

    return { accounts, total };
  } catch (err) {
    log.error("Error fetching accounts:", err);
    throw new Error(err?.message || "Error fetching accounts");
  }
};

module.exports = Accounts;
