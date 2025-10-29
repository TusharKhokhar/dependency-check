const model = require("../../models/index");
const { Accounts, Customers } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  ACCOUNT_ALREADY_EXIST,
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  ACCOUNT_DATA_NOT_FOUND,
} = require("../../helpers/error-messages");
const dot = require("dot-object");
const { getObjectId: ObjectId } = require("../../helpers/objectIdConverter");
const {
  formObjectIds,
  addCreateTimeStamp,
  addUpdateTimeStamp,
  getDatabaseForGetAllAPI,
  verifyUserAccess,
} = require("../../helpers/util");
dot.keepArray = true;
const CustomLogger = require("../../helpers/customLogger");
const { getDb } = require("../../config/dbHandler");
const { customerSecurity } = require("../../utils/validation");
const { accountData } = require('../../helpers/xlsColumns')
const { Parser } = require('json2csv')
const log = new CustomLogger();

module.exports = {
  Mutation: {
    async addAccount(_, { addAccountInput }, context) {
      log.lambdaSetup(context, "accounts", "addAccount");
      try {
        const {
          CustomerID,
          AccountId,
          AccountName,
          Description,
          Tags,
          IsActive,
        } = addAccountInput;
        verifyUserAccess(context, context.data.CustomerID);
        const createdBy = ObjectId.createFromHexString(context.data._id);

        let newAccount = {
          CustomerID,
          AccountId,
          AccountName,
          Description,
          Tags,
          CreatedBy: createdBy,
          IsDeleted: false,
          IsActive,
        };

        const db = await getDb();
        const existingAccount = await db.collection(Accounts).findOne({
          AccountId: AccountId,
          IsDeleted: false,
        });
        if (existingAccount) {
          log.info("Account already exists");
          throw new GraphQLError(ACCOUNT_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newAccount = formObjectIds(newAccount);
        newAccount = addCreateTimeStamp(newAccount);

        const { insertedId } = await db
          .collection(Accounts)
          .insertOne(newAccount);
        const accountData = await db
          .collection(Accounts)
          .findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: accountData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...accountData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addAccount error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAccount(_, { updateAccountInput, accountId }, context, info) {
      log.lambdaSetup(context, "accounts", "updateAccount");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateAccountInput);
        const db = await getDb();
        updateAccountInput = addUpdateTimeStamp(updateAccountInput);

        let updateObject = await dot.dot(updateAccountInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db
          .collection(Accounts)
          .updateOne({ _id: ObjectId.createFromHexString(accountId) }, { $set: updateObject });
        return {
          message: "Updated successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in updateAccount ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteAccount(_, { IsDeleted, accountId }, context) {
      log.lambdaSetup(context, "accounts", "deleteAccount");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: "400",
            },
          });
        }
        const db = await getDb();
        await db
          .collection(Accounts)
          .updateOne({ _id: ObjectId.createFromHexString(accountId) }, { $set: { IsDeleted: true } });
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteAccount ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAccountStatus(_, { IsActive, accountId }, context) {
      log.lambdaSetup(context, "accounts", "updateAccountStatus");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: "121",
            },
          });
        }
        if (!accountId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: { code: "400" },
          });
        }
        const db = await getDb();
        await db
          .collection(Accounts)
          .updateOne(
            { _id: ObjectId.createFromHexString(accountId) },
            { $set: { IsActive: IsActive } }
          );
        return {
          message: IsActive
            ? "Activated Successfully"
            : "Deactivated Successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in accountStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getAccounts(_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, "accounts", "getAccounts");
      try {
        let { pattern, pageNumber, limit, sort, status, sortKey } =
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
        const db = await getDatabaseForGetAllAPI(
          context,
          context.data.CustomerID
        );

        const accountList = await model.accounts.getAccountsInformation({
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          db,
        });

        return accountList;
      } catch (error) {
        log.error("getAccounts error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async getAccount(_, { accountId }, context) {
      log.lambdaSetup(context, "accounts", "getAccount");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(Accounts).findOne({
          _id: ObjectId.createFromHexString(accountId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(ACCOUNT_DATA_NOT_FOUND, {
            extensions: {
              code: "404",
            },
          });
        }

        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: response?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return { ...response, CustomerName: customerData?.CustomerName || null };
      } catch (error) {
        log.error("getAccount error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async importAccount (_, { customerId }, context) {
      log.lambdaSetup(context, 'accounts', 'importAccount')
      try {
        verifyUserAccess(context, customerId)
        const finalReport = [{
          AccountId: 'Account Id',
          AccountName: 'Account Name',
          Description: 'Description',
          Tags: 'Tags',
        }]
        const json2csvParser = new Parser({ fields: accountData, del: ',' })
        const finalCsvData = await json2csvParser.parse(finalReport)
        const template =  Buffer.from(finalCsvData).toString('base64') 
        return {
          message: template,
          statusCode: 200
        }
      } catch (e) {
        log.error(e)
        throw new Error(e)
      }
    }
  },
};
