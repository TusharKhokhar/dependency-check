const { Customers, Audio } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  AUDIO_ALREADY_EXIST,
  AUDIO_DATA_NOT_FOUND,
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
    async addAudio(_, { addAudioInput }, context) {
      log.lambdaSetup(context, "audio", "addAudioInput");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          AudioService,
          MicrosoftAudioVersion,
          AttachDocument,
          IsCheckAll,
          Languages,
          IsActive,
        } = addAudioInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newAudio = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          AudioService,
          MicrosoftAudioVersion,
          AttachDocument,
          IsCheckAll,
          Languages,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };

        const db = await getDb();
        const existingAudio = await db.collection(Audio).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingAudio) {
          log.info("Audio already exists:", CustomerID);
          throw new GraphQLError(AUDIO_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newAudio = formObjectIds(newAudio);
        newAudio = addCreateTimeStamp(newAudio);

        const { insertedId } = await db.collection(Audio).insertOne(newAudio);
        const audioData = await db.collection(Audio).findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: audioData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...audioData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addAudio error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAudio(_, { updateAudioInput, customerId }, context) {
      log.lambdaSetup(context, "audio", "updateAudio");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateAudioInput);
        const db = await getDb();
        updateAudioInput = addUpdateTimeStamp(updateAudioInput);

        let updateObject = await dot.dot(updateAudioInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(Audio).updateOne(
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
        log.error("error in updateAudio ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteAudio(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "audio", "deleteAudio");
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
        await db.collection(Audio).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsDeleted: true } }
        );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteAudio ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateAudioStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "audio", "updateAudioStatus");
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
        await db.collection(Audio).updateOne(
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
        log.error("error in updateAudioStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getAudio(_, { customerId }, context) {
      log.lambdaSetup(context, "audio", "getAudio");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(Audio).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(AUDIO_DATA_NOT_FOUND, {
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
        log.error("getAudio error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
