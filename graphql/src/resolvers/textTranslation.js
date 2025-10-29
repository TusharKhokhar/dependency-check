// filepath: /Users/work/Documents/development/cloud-saas-api/graphql/src/resolvers/textTranslation.js
const { Customers, TextTranslation } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  TEXT_TRANSLATION_ALREADY_EXIST,
  TEXT_TRANSLATION_DATA_NOT_FOUND,
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
    async addTextTranslation(_, { addTextTranslationInput }, context) {
      log.lambdaSetup(context, "addTextTranslation", "addTextTranslationInput");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          EnableMicrosoftTranslation,
          EnableGoogleTranslation,
          TranslationServices,
          MicrosoftCharacterLimit,
          GoogleCharacterLimit,
          AttachOriginalDocument,
          IsCheckAll,
          Languages,
          IsActive,
        } = addTextTranslationInput;

        verifyUserAccess(context, CustomerID)
        let newTextTranslation = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          EnableMicrosoftTranslation,
          EnableGoogleTranslation,
          TranslationServices,
          MicrosoftCharacterLimit,
          GoogleCharacterLimit,
          AttachOriginalDocument,
          IsCheckAll,
          Languages,
          IsActive: IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingTextTranslation = await db.collection(TextTranslation).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingTextTranslation) {
          log.info("TextTranslation already exists:", CustomerID);
          throw new GraphQLError(TEXT_TRANSLATION_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newTextTranslation = formObjectIds(newTextTranslation);
        newTextTranslation = addCreateTimeStamp(newTextTranslation);

        const { insertedId } = await db.collection(TextTranslation).insertOne(newTextTranslation);
        const textTranslationData = await db.collection(TextTranslation).findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: textTranslationData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...textTranslationData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addTextTranslationInput error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateTextTranslation(_, { updateTextTranslationInput, customerId }, context) {
      log.lambdaSetup(context, "TextTranslation", "updateTextTranslation");
      try {
        if (!customerId) {
          log.error("Required Customer ID missing:", customerId);
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: "122",
            },
          });
        }

        if (!updateTextTranslationInput) {
          log.error("Required input missing", updateTextTranslationInput);
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: "122",
            },
          });
        }

        verifyUserAccess(context, customerId)
        const db = await getDb();
        const textTranslationData = await db.collection(TextTranslation).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });

        if (!textTranslationData) {
          log.error("TextTranslation data not found:", customerId);
          throw new GraphQLError(TEXT_TRANSLATION_DATA_NOT_FOUND, {
            extensions: {
              code: "122",
            },
          });
        }

        const updateData = dot.dot(updateTextTranslationInput);
        const objectIdData = formObjectIds(updateData);
        const timeStampData = addUpdateTimeStamp(objectIdData);

        await db.collection(TextTranslation).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: timeStampData }
        );

        return {
          statusCode: 200,
          message: "TextTranslation updated successfully",
        };
      } catch (error) {
        log.error("updateTextTranslation error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteTextTranslation(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "TextTranslation", "deleteTextTranslation");
      try {
        if (!customerId) {
          log.error("Required Customer ID missing:", customerId);
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: "122",
            },
          });
        }
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '400'
            }
          })
        }

        verifyUserAccess(context, customerId)
        const db = await getDb();
        const textTranslationData = await db.collection(TextTranslation).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });

        if (!textTranslationData) {
          log.error("TextTranslation data not found:", customerId);
          throw new GraphQLError(TEXT_TRANSLATION_DATA_NOT_FOUND, {
            extensions: {
              code: "122",
            },
          });
        }

        await db.collection(TextTranslation).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          {
            $set: {
              IsDeleted: true,
              UpdatedAt: new Date(),
              UpdatedBy: ObjectId.createFromHexString(context.data._id),
            },
          }
        );

        return {
          statusCode: 200,
          message: "TextTranslation deleted successfully",
        };
      } catch (error) {
        log.error("deleteTextTranslation error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateTextTranslationStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "TextTranslation", "updateTextTranslationStatus");
      try {
        if (!customerId) {
          log.error("Required Customer ID missing:", customerId);
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: "122",
            },
          });
        }

        if (IsActive === undefined || IsActive === null) {
          log.error("Invalid status:", IsActive);
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: "122",
            },
          });
        }

        verifyUserAccess(context, customerId)
        const db = await getDb();
        const textTranslationData = await db.collection(TextTranslation).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });

        if (!textTranslationData) {
          log.error("TextTranslation data not found:", customerId);
          throw new GraphQLError(TEXT_TRANSLATION_DATA_NOT_FOUND, {
            extensions: {
              code: "122",
            },
          });
        }

        await db.collection(TextTranslation).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          {
            $set: {
              IsActive,
              UpdatedAt: new Date(),
              UpdatedBy: ObjectId.createFromHexString(context.data._id),
            },
          }
        );

        return {
          statusCode: 200,
          message: `TextTranslation ${IsActive ? "enabled" : "disabled"} successfully`,
        };
      } catch (error) {
        log.error("updateTextTranslationStatus error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getTextTranslation(_, { customerId }, context) {
      log.lambdaSetup(context, "TextTranslation", "getTextTranslation");
      try {
        if (!customerId) {
          log.error("Required Customer ID missing:", customerId);
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: "122",
            },
          });
        }

        verifyUserAccess(context, customerId)
        const db = await getDb();
        const textTranslationData = await db.collection(TextTranslation).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });

        if (!textTranslationData) {
          log.error("TextTranslation data not found:", customerId);
          throw new GraphQLError(TEXT_TRANSLATION_DATA_NOT_FOUND, {
            extensions: {
              code: "122",
            },
          });
        }

        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: textTranslationData.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );

        return {
          ...textTranslationData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("getTextTranslation error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
