const { Customers, HandwriteRecognition } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  HANDWRITE_RECOGNITION_ALREADY_EXIST,
  HANDWRITE_RECOGNITION_DATA_NOT_FOUND,
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
    async addHandWriteRecognition(_, { addHandWriteRecognitionInput }, context) {
      log.lambdaSetup(context, "handwriteRecognition", "addHandWriteRecognition");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          AttachOriginalDocument,
          ConfidenceThreshold,
          IsActive,
        } = addHandWriteRecognitionInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newHandwrite = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          AttachOriginalDocument,
          ConfidenceThreshold,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingHandwrite = await db
          .collection(HandwriteRecognition)
          .findOne({
            CustomerID: ObjectId.createFromHexString(CustomerID),
            IsDeleted: false,
          });
        if (existingHandwrite) {
          log.info("Handwrite Recognition already exists:", CustomerID);
          throw new GraphQLError(HANDWRITE_RECOGNITION_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newHandwrite = formObjectIds(newHandwrite);
        newHandwrite = addCreateTimeStamp(newHandwrite);

        const { insertedId } = await db
          .collection(HandwriteRecognition)
          .insertOne(newHandwrite);
        const HandwriteData = await db
          .collection(HandwriteRecognition)
          .findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: HandwriteData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...HandwriteData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addHandWriteRecognition error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateHandWriteRecognition(
      _,
      { updateHandWriteRecognitionInput, customerId },
      context    ) {
      log.lambdaSetup(context, "handwriteRecognition", "updateHandWriteRecognition");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateHandWriteRecognitionInput);
        const db = await getDb();
        updateHandWriteRecognitionInput = addUpdateTimeStamp(
          updateHandWriteRecognitionInput
        );

        let updateObject = await dot.dot(updateHandWriteRecognitionInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(HandwriteRecognition).updateOne(
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
        log.error("error in updateHandWriteRecognition ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteHandWriteRecognition(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "handwriteRecognition", "deleteHandWriteRecognition");
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
          .collection(HandwriteRecognition)
          .updateOne(
            {
              CustomerID: ObjectId.createFromHexString(customerId),
              IsDeleted: false,
            },
            { $set: { IsDeleted: true } }
          );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteHandWriteRecognition ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateHandWriteRecognitionStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "handwriteRecognition", "updateHandWriteRecognitionStatus");
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
        await db
          .collection(HandwriteRecognition)
          .updateOne(
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
        log.error("error in updateHandWriteRecogStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getHandWriteRecognition(_, { customerId }, context) {
      log.lambdaSetup(context, "handwriteRecognition", "getHandWriteRecognition");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(HandwriteRecognition).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(HANDWRITE_RECOGNITION_DATA_NOT_FOUND, {
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
        log.error("getHandWriteRecognition error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
