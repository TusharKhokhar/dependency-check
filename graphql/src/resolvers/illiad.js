const { Customers, Illiad } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  ILLIAD_ALREADY_EXIST,
  ILLIAD_DATA_NOT_FOUND,
} = require("../../helpers/error-messages");
const dot = require("dot-object");
const { getObjectId: ObjectId } = require("../../helpers/objectIdConverter");
const {
  formObjectIds,
  addCreateTimeStamp,
  addUpdateTimeStamp,
  verifyUserAccess,
  performEncryption,
  performDecryption,
} = require("../../helpers/util");
dot.keepArray = true;
const CustomLogger = require("../../helpers/customLogger");
const { getDb } = require("../../config/dbHandler");
const log = new CustomLogger();

module.exports = {
  Mutation: {
    async addIlliad(_, { addIlliadInput }, context) {
      log.lambdaSetup(context, "illiad", "addIlliad");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          Server,
          Path,
          Username,
          Password,
          IsActive,
        } = addIlliadInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newIlliad = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          Server,
          Path,
          Username,
          Password,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingilliad = await db.collection(Illiad).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingilliad) {
          log.info("Illiad already exists:", CustomerID);
          throw new GraphQLError(ILLIAD_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newIlliad = formObjectIds(newIlliad);
        newIlliad = addCreateTimeStamp(newIlliad);
        newIlliad = await performEncryption(newIlliad);

        const { insertedId } = await db.collection(Illiad).insertOne(newIlliad);
        const illiadData = await db
          .collection(Illiad)
          .findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: illiadData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...illiadData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addIlliad error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateIlliad(_, { updateIlliadInput, customerId }, context) {
      log.lambdaSetup(context, "illiad", "updateIlliad");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateIlliadInput);
        updateIlliadInput = await performEncryption(updateIlliadInput);
        const db = await getDb();

        updateIlliadInput = addUpdateTimeStamp(updateIlliadInput);

        let updateObject = await dot.dot(updateIlliadInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(Illiad).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: updateObject }
        );
        return {
          message: "Updated successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in updateIlliad ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteIlliad(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "illiad", "deleteIlliad");
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
          .collection(Illiad)
          .updateOne(
            {
              CustomerID: ObjectId.createFromHexString(customerId),
              IsDeleted: false,
            },
            { $set: { IsDeleted: true } }
          );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteIlliad ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateIlliadStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "illiad", "updateIlliadStatus");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: "121",
            },
          });
        }
        if (!customerId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: { code: "400" },
          });
        }
        const db = await getDb();
        await db.collection(Illiad).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsActive: IsActive } }
        );
        return {
          message: IsActive
            ? "Activated Successfully"
            : "Deactivated Successfully",
          statusCode: 200,
        };
      } catch (error) {
        log.error("error in updateIlliadStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getIlliad(_, { customerId }, context) {
      log.lambdaSetup(context, "illiad", "getIlliad");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(Illiad).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(ILLIAD_DATA_NOT_FOUND, {
            extensions: {
              code: "404",
            },
          });
        }
        response = response ? await performDecryption(response) : {}
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: response?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...response,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("getIlliad error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
