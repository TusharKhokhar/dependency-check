const { Customers, FTP } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  FTP_ALREADY_EXIST,
  FTP_DATA_NOT_FOUND,
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
    async addFTP(_, { addFTPInput }, context) {
      log.lambdaSetup(context, "FTP", "addFTP");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          FTPType,
          HostName,
          PortNumber,
          Username,
          Password,
          IsActive,
        } = addFTPInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newFTP = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          FTPType,
          HostName,
          PortNumber,
          Username,
          Password,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingFTP = await db.collection(FTP).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingFTP) {
          log.info("FTP already exists:", CustomerID);
          throw new GraphQLError(FTP_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newFTP = formObjectIds(newFTP);
        newFTP = addCreateTimeStamp(newFTP);
        newFTP = await performEncryption(newFTP);

        const { insertedId } = await db.collection(FTP).insertOne(newFTP);
        const FTPData = await db.collection(FTP).findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: FTPData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...FTPData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addFTP error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateFTP(_, { updateFTPInput, customerId }, context) {
      log.lambdaSetup(context, "FTP", "updateFTP");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateFTPInput);
        updateFTPInput = await performEncryption(updateFTPInput);
        const db = await getDb();
        updateFTPInput = addUpdateTimeStamp(updateFTPInput);

        let updateObject = await dot.dot(updateFTPInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(FTP).updateOne(
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
        log.error("error in updateFTP ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteFTP(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "FTP", "deleteFTP");
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
        await db.collection(FTP).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsDeleted: true } }
        );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteFTP ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateFTPStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "FTP", "updateFTPStatus");
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
        await db.collection(FTP).updateOne(
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
        log.error("error in updateFTPStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getFTP(_, { customerId }, context) {
      log.lambdaSetup(context, "FTP", "getFTP");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(FTP).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(FTP_DATA_NOT_FOUND, {
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
        log.error("getFTP error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
