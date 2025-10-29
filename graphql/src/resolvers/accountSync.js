const { getObjectId: ObjectId } = require("../../helpers/objectIdConverter");
const {
  formObjectIds,
  addCreateTimeStamp,
  addUpdateTimeStamp,
  verifyUserAccess,
  performDecryption,
  performEncryption,
} = require("../../helpers/util");
const { AccountSync } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const dot = require("dot-object");

const {
  ACCOUNT_SYNC_DATA_NOT_FOUND,
  INVALID_STATUS,
  INTEGRATION_ALREADY_EXIST,
  REQUIRED_INPUT_MISSING,
} = require("../../helpers/error-messages");
const { getDb } = require("../../config/dbHandler");
const CustomLogger = require("../../helpers/customLogger");
const { getDataFromCollection } = require("../../helpers/aggregator");
const log = new CustomLogger();
dot.keepArray = true;

module.exports = {
  Mutation: {
    async addAccountSync(_, { addAccountSyncInput }, context) {
      log.lambdaSetup(context, "accountSync", "addAccountSync");
      try {
        let {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          APIEndpoint,
          ClientId,
          ClientSecret,
          Mappings,
          IsActive
        } = addAccountSyncInput;
        verifyUserAccess(context, context.data.CustomerID);
        IsActive = addAccountSyncInput.IsActive ?? false;
        const CreatedBy = ObjectId.createFromHexString(context.data._id);
        let newIntegration = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          APIEndpoint,
          ClientId,
          ClientSecret,
          Mappings,
          CreatedBy,
          IsActive,
          IsDeleted: false,
        };
        const db = await getDb();
        const accountSyncData = await db.collection(AccountSync).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });

        if (accountSyncData) {
          log.info("Account sync integration already exists");
          throw new GraphQLError(INTEGRATION_ALREADY_EXIST, {
            extensions: {
              code: "121",
            },
          });
        }

        newIntegration = formObjectIds(newIntegration);
        newIntegration = addCreateTimeStamp(newIntegration);
        newIntegration = await performEncryption(newIntegration);

        const { insertedId } = await db
          .collection(AccountSync)
          .insertOne(newIntegration);
        let response = await db
          .collection(AccountSync)
          .findOne({ _id: insertedId });
        response = await performDecryption(response);
        return response;
      } catch (error) {
        log.error("addAccountSync error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAccountSync(
      _,
      { updateAccountSyncInput, customerId },
      context
    ) {
      log.lambdaSetup(context, "accountSync", "updateAccountSync");
      try {
        verifyUserAccess(context, customerId);
        dot.remove("CustomerID", updateAccountSyncInput);
        const db = await getDb();

        updateAccountSyncInput = await performEncryption(
          updateAccountSyncInput
        );
        updateAccountSyncInput.Mappings = {
          AccountID: updateAccountSyncInput?.Mappings?.AccountID,
          AccountName: updateAccountSyncInput?.Mappings?.AccountName ?? null,
          Description: updateAccountSyncInput?.Mappings?.Description ?? null
        }
        updateAccountSyncInput = addUpdateTimeStamp(updateAccountSyncInput);
        let updateObject = await dot.dot(updateAccountSyncInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);
        await db.collection(AccountSync).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          {
            $set: updateObject,
          }
        );
        return {
          message: "Updated successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in updateAccountSync ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteAccountSync(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "accountSync", "deleteAccountSync");
      try {
        verifyUserAccess(context, customerId);
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: "400",
            },
          });
        }
        const db = await getDb();
        await db.collection(AccountSync).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsDeleted: true } }
        );
        return {
          message: "Deleted Successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in deleteAccountSync ***", error);
        throw new Error(error?.message || error);
      }
    },

    async accountSyncStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "accountSync", "accountSyncStatus");
      try {
        verifyUserAccess(context, customerId);
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: "121",
            },
          });
        }
        const db = await getDb();
        await db
          .collection(AccountSync)
          .updateOne(
            { CustomerID: ObjectId.createFromHexString(customerId) },
            { $set: { IsActive: IsActive } }
          );
        return {
          message: IsActive
            ? "Deactivated Successfully"
            : "Activated Successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("accountSyncStatus error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getAccountSync(_, { customerId }, context) {
      log.lambdaSetup(context, "accountSync", "getAccountSync");
      try {
        verifyUserAccess(context, customerId);
        const db = await getDb();
        let response = await db.collection(AccountSync).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });

        if (!response) {
          throw new GraphQLError(ACCOUNT_SYNC_DATA_NOT_FOUND, {
            extensions: {
              code: "404",
            },
          });
        }
        const customerData = await getDataFromCollection({
          collectionName: "Customers",
          filters: { _id: ObjectId.createFromHexString(customerId) },
          projection: ["CustomerName"],
          pagination: { single: true },
        });

        if (customerData) {
          response["CustomerName"] = customerData?.CustomerName;
        }
        response = await performDecryption(response);
        return response;
      } catch (error) {
        log.error("getAccountSync error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
