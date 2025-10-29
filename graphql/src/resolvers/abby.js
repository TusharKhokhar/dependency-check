const { Customers, Abby } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  ABBY_ALREADY_EXIST,
  ABBY_DATA_NOT_FOUND,
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
    async addAbby(_, { addAbbyInput }, context) {
      log.lambdaSetup(context, "addAbby", "addAbbyInput");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          FastObjectsExtraction,
          FastBinarization,
          PdfImageOnText,
          FastMode,
          DetectDocumentStructure,
          AggressiveTextExtraction,
          PromptForOriginalLanguage,
          PdfMrcCompression,
          IsCheckAll,
          Languages,
          IsActive,
        } = addAbbyInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newAbby = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          FastObjectsExtraction,
          FastBinarization,
          PdfImageOnText,
          FastMode,
          DetectDocumentStructure,
          AggressiveTextExtraction,
          PromptForOriginalLanguage,
          PdfMrcCompression,
          IsCheckAll,
          Languages,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingAbby = await db.collection(Abby).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingAbby) {
          log.info("Abby already exists:", CustomerID);
          throw new GraphQLError(ABBY_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newAbby = formObjectIds(newAbby);
        newAbby = addCreateTimeStamp(newAbby);

        const { insertedId } = await db.collection(Abby).insertOne(newAbby);
        const abbyData = await db.collection(Abby).findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: abbyData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...abbyData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addAbbyInput error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAbby(_, { updateAbbyInput, customerId }, context) {
      log.lambdaSetup(context, "Abby", "updateAbby");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateAbbyInput);
        const db = await getDb();
        updateAbbyInput = addUpdateTimeStamp(updateAbbyInput);

        let updateObject = await dot.dot(updateAbbyInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(Abby).updateOne(
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
        log.error("error in updateAbby ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteAbby(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "Abby", "deleteAbby");
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
        await db.collection(Abby).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsDeleted: true } }
        );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteAbby ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAbbyStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "Abby", "updateAbbyStatus");
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
        await db.collection(Abby).updateOne(
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
        log.error("error in updateAbbyStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getAbby(_, { customerId }, context) {
      log.lambdaSetup(context, "Abby", "getAbby");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(Abby).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(ABBY_DATA_NOT_FOUND, {
            extensions: {
              code: "404",
            },
          });
        }
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id:  response?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...response,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("getAbby error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
