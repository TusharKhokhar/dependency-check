const { Customers, RestorePictures } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  RESTORE_PICTURES_ALREADY_EXIST,
  RESTORE_PICTURES_DATA_NOT_FOUND,
} = require("../../helpers/error-messages");
const dot = require("dot-object");
const { getObjectId: ObjectId } = require("../../helpers/objectIdConverter");
const {
  formObjectIds,
  addCreateTimeStamp,
  addUpdateTimeStamp,
  verifyUserAccess,
} = require("../../helpers/util");
dot.keepArray = true;
const CustomLogger = require("../../helpers/customLogger");
const { getDb } = require("../../config/dbHandler");
const log = new CustomLogger();

module.exports = {
  Mutation: {
    async addRestorePictures(_, { addRestorePicturesInput }, context) {
      log.lambdaSetup(context, "restorePictures", "addRestorePictures");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          RestoreExePath,
          IsActive,
        } = addRestorePicturesInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newRestorePictures = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          RestoreExePath,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingRestorePictures = await db
          .collection(RestorePictures)
          .findOne({
            CustomerID: ObjectId.createFromHexString(CustomerID),
            IsDeleted: false,
          });
        if (existingRestorePictures) {
          log.info("RestorePictures already exists:", CustomerID);
          throw new GraphQLError(RESTORE_PICTURES_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newRestorePictures = formObjectIds(newRestorePictures);
        newRestorePictures = addCreateTimeStamp(newRestorePictures);

        const { insertedId } = await db
          .collection(RestorePictures)
          .insertOne(newRestorePictures);
        const RestorePicturesData = await db
          .collection(RestorePictures)
          .findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: RestorePicturesData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...RestorePicturesData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addRestorePictures error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateRestorePictures(
      _,
      { updateRestorePicturesInput, customerId },
      context
    ) {
      log.lambdaSetup(context, "restorePictures", "updateRestorePictures");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateRestorePicturesInput);
        const db = await getDb();

        updateRestorePicturesInput = addUpdateTimeStamp(
          updateRestorePicturesInput
        );

        let updateObject = await dot.dot(updateRestorePicturesInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(RestorePictures).updateOne(
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
        log.error("error in updateRestorePictures ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteRestorePictures(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "restorePictures", "deleteRestorePictures");
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
          .collection(RestorePictures)
          .updateOne(
            {
              CustomerID: ObjectId.createFromHexString(customerId),
              IsDeleted: false,
            },
            { $set: { IsDeleted: true } }
          );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteRestorePictures ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateRestorePicturesStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(
        context,
        "restorePictures",
        "updateRestorePicturesStatus"
      );
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
        await db.collection(RestorePictures).updateOne(
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
        log.error("error in updateRestorePicturesStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getRestorePictures(_, { customerId }, context) {
      log.lambdaSetup(context, "restorePictures", "getRestorePictures");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(RestorePictures).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(RESTORE_PICTURES_DATA_NOT_FOUND, {
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
        return {
          ...response,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("getRestorePictures error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
