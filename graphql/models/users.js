const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const Bcrypt = require('bcryptjs');
const {apiKey} = require('../config/config')
const CustomLogger = require("../helpers/customLogger");
const { attachUserLoginProvider } = require('../helpers/util');
const log = new CustomLogger()

// Users Model
const Users = {}

const combinedUserGroupAndCustomer = async (db, users) => {
  log.info("combining user group and customer data");
  // Extract unique CustomerIDs and GroupIDs from users
  const customerIds = [...new Set(users.map((user) => user?.CustomerID).filter(Boolean))];
  const groupIds = [...new Set(users.flatMap((user) => (Array.isArray(user?.GroupID) ? user?.GroupID : [])).filter(Boolean))];

  // Fetch customer and group details from the database concurrently
  const [customers, groups] = await Promise.all([
    customerIds.length ? db.collection("Customers").find({ _id: { $in: customerIds } }, { projection: { _id: 1, CustomerName: 1, Tier: 1, DomainName: 1 } }).toArray() : [],
    groupIds.length ? db.collection("Groups").find({ _id: { $in: groupIds } }, { projection: { _id: 1, GroupName: 1, GroupType: 1 } }).toArray() : []
  ]);

  // Convert the fetched customers and groups into maps for quick lookup
  return {
    customerMap: Object.fromEntries(customers.map((customer) => [customer._id.toString(), customer])),
    groupMap: Object.fromEntries(groups.map((group) => [group._id.toString(), group]))
  };
};

const arrangeUserGroup = (users, customerMap, groupMap) => {
  log.info("arranging user with arrange permissions group");

  return users.map((user) => {
    // Attach customer data to the user
    user.CustomerData = customerMap[user?.CustomerID?.toString()] || null;

    // Attach group data to the user, filtering out undefined/null values
    user.GroupData = (Array.isArray(user?.GroupID) ? user.GroupID.map((id) => groupMap[id?.toString()]).filter(Boolean) : []);

    // Prioritize "Permissions" group if present
    const permissionsGroup = user?.GroupData.find((group) => group?.GroupType === "Permissions");
    if (permissionsGroup) {
      user.GroupData = [permissionsGroup, ...user?.GroupData.filter((group) => group?.GroupType !== "Permissions")];
    }

    user.GroupNameForSort = user?.GroupData?.length ? user?.GroupData[0]?.GroupName : "";
    return user;
  });
};

const userSearch = (users, pattern) => {
  if (!pattern) return users;
  log.info("Doing user search", pattern);
  const regex = new RegExp(pattern, "i");
  // Search for the pattern in various user fields
  return users.filter((user) =>
    [user.FirstName, user.LastName, user.Username, user.Email, user.CardNumber, user.PrimaryEmail]
      .some((field) => regex.test(field || "")) ||
    (user.CustomerData?.CustomerName && regex.test(user.CustomerData?.CustomerName)) ||
    user.GroupData.some((group) => regex.test(group.GroupName)) ||  (user.AuthProvideData?.ProviderName && regex.test(user.AuthProvideData?.ProviderName))
  );
};

const sortUserList = (users, sortKey = "Username", sort) => {
  log.info("sorting user list****", { sortKey, sort });

  sort = sort?.toLowerCase();
  if (sort === 'dsc') sort = 'desc';
  if (sort !== 'asc' && sort !== 'desc') sort = 'asc';

  return users.sort((a, b) => {
    let aVal = resolveSortValue(a, sortKey);
    let bVal = resolveSortValue(b, sortKey);

    // Ensure values are strings
    aVal = String(aVal).trim();
    bVal = String(bVal).trim();

    // Perform the case-sensitive comparison directly first
    const caseSorting = aVal.localeCompare(bVal);

    // If case-sensitive comparison results in equality, then compare case-insensitively
    if (caseSorting !== 0) {
      return sort === 'asc' ? caseSorting : -caseSorting;
    }

    // For equal values, use a case-insensitive comparison
    const aLower = String(aVal).toLowerCase();
    const bLower = String(bVal).toLowerCase();
    return sort === 'asc'
      ? aLower.localeCompare(bLower)
      : bLower.localeCompare(aLower);
  });
};

const resolveSortValue = (user, sortKey) => {
  switch (sortKey) {
    case 'GroupData.GroupName':
      return user.GroupNameForSort || '';
    case 'CustomerData.CustomerName':
      return user.CustomerData?.CustomerName || '';
    case 'AuthProvideData.ProviderName':
      return user.AuthProvideData?.ProviderName || '';
    default:
      return Array.isArray(user[sortKey]) ? user[sortKey][0] || '' : user[sortKey] ?? '';
  }
};


Users.getUsersInformation = async ({ status, pattern, sort = "asc", pageNumber, limit, sortKey, customerIds, db }) => {
  try {
    log.info("getting user information *******", {
      status,
      pattern,
      sort,
      pageNumber,
      limit,
      sortKey,
      customerIds,
    });
    const condition = { IsDeleted: false };
    if (customerIds?.length) {
      condition.CustomerID = { $in: customerIds.map((id) => ObjectId.createFromHexString(id)) };
    }
    if (status !== undefined) {
      condition.IsActive = status;
    }

    let users = await db.collection("Users").find(condition).toArray();
     // Fetch and attach customer and group data
    const { customerMap, groupMap } = await combinedUserGroupAndCustomer(db, users);
    log.info("combined userGroup and customer");

    users = arrangeUserGroup(users, customerMap, groupMap);
    log.info("arranged UserGroup *******");

     // Fetch and attach login provider
    users = await attachUserLoginProvider(users);

    // Apply search filter
    users = userSearch(users, pattern);
    log.info("user search done *******");

    // Apply sorting
    users = sortUserList(users, sortKey, sort);

    // Paginate results
    const total = users.length;
    const skips = limit * (pageNumber - 1);
    users = users.slice(skips, skips + limit);
    log.info("total*******", total);
    log.info("skips*******", skips);

    return { user: users, total };
  } catch (error) {
    console.error("error occurred in getUsersInformation",error);
    throw error;
  }
};

Users.updateIat = (db, iat, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection('Users').updateOne({ _id: id }, { $set: { iat: iat } })
      resolve('updated')
    } catch (error) {
      reject(error)
    }
  })
}

Users.updateIatApi = (db, iat, id, api) => {
  return new Promise((resolve, reject) => {
    try {
      const keyName = Object.keys(apiKey).find(k=>apiKey[k]===api);
      const queryKey = `LoginSession.${keyName}`
      db.collection('Users').updateOne({ _id: id }, { $set: { [queryKey]: iat }})
      resolve('updated')
    } catch (error) {
      reject(error)
    }
  })
}

Users.comparePassword = ({ candidatePassword, hash }) => {
  return new Promise((resolve, reject) => {
    Bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) {
        reject(err)
      }
      resolve(isMatch)
    })
  })
}

// Export Users model
module.exports = Users
