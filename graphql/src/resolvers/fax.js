const { Customers, Fax } = require("../../models/collections");
const { GraphQLError } = require("graphql");
const {
  REQUIRED_ID_MISSING,
  REQUIRED_INPUT_MISSING,
  INVALID_STATUS,
  FAX_INTEGRATION_ALREADY_EXIST,
  FAX_INTEGRATION_DATA_NOT_FOUND,
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
    async addFaxIntegration(_, { addFaxIntegrationInput }, context) {
      log.lambdaSetup(context, "faxIntegration", "addFaxIntegration");
      try {
        const {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          Username,
          Password,
          Email,
          TimeOutPerPage,
          AllowedUSCanadaAreaCodes,
          AdditionalAreaCodes,
          AllowedInternationalAreaCodes,
          FaxStatusChecking,
          FaxDestinationText,
          FaxNote,
          EnableInternationalFax,
          LocalFaxButtonText,
          InternationalFaxButtonText,
          EnableCoverPage,
          CoverPageOptionText,
          EnableConfirmationReceipt,
          ConfirmationReceiptOptionText,
          ConfirmationOptions,
          FaxProcessScreenTitle,
          IsActive,
        } = addFaxIntegrationInput;

        verifyUserAccess(context, context.data.CustomerID);
        let newFax = {
          CustomerID,
          ThirdPartySoftwareName,
          ThirdPartySoftwareType,
          Tags,
          Username,
          Password,
          Email,
          TimeOutPerPage,
          FaxStatusChecking,
          FaxDestinationText,
          FaxNote,
          EnableInternationalFax,
          LocalFaxButtonText,
          InternationalFaxButtonText,
          EnableCoverPage,
          CoverPageOptionText,
          EnableConfirmationReceipt,
          ConfirmationReceiptOptionText,
          ConfirmationOptions,
          FaxProcessScreenTitle,
          IsActive,
          IsDeleted: false,
          CreatedBy: ObjectId.createFromHexString(context.data._id),
        };
        if (context?.data?.user?.TenantDomain === "admin") {
          newFax.AllowedUSCanadaAreaCodes = AllowedUSCanadaAreaCodes;
          newFax.AdditionalAreaCodes = AdditionalAreaCodes;
          newFax.AllowedInternationalAreaCodes = AllowedInternationalAreaCodes;
        }
        const db = await getDb();
        const existingFax = await db.collection(Fax).findOne({
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
        if (existingFax) {
          log.info("FaxIntegration already exists:", CustomerID);
          throw new GraphQLError(FAX_INTEGRATION_ALREADY_EXIST, {
            extensions: {
              code: "122",
            },
          });
        }

        newFax = formObjectIds(newFax);
        newFax = addCreateTimeStamp(newFax);
        newFax = await performEncryption(newFax);

        const { insertedId } = await db.collection(Fax).insertOne(newFax);
        const faxData = await db.collection(Fax).findOne({ _id: insertedId });
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: faxData?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        return {
          ...faxData,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("addFaxIntegration error ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateFaxIntegration(_, { updateFaxIntegrationInput, customerId }, context) {
      log.lambdaSetup(context, "faxIntegration", "updateFaxIntegration");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        dot.remove("CustomerID", updateFaxIntegrationInput);
        updateFaxIntegrationInput = await performEncryption(updateFaxIntegrationInput);
        const db = await getDb();
        if(context?.data?.user?.TenantDomain !== 'admin'){
          dot.remove("AllowedUSCanadaAreaCodes", updateFaxIntegrationInput);
          dot.remove("AdditionalAreaCodes", updateFaxIntegrationInput);
          dot.remove("AllowedInternationalAreaCodes", updateFaxIntegrationInput);
        }
        updateFaxIntegrationInput = addUpdateTimeStamp(updateFaxIntegrationInput);

        let updateObject = await dot.dot(updateFaxIntegrationInput);
        updateObject = formObjectIds(updateObject, true);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);

        await db.collection(Fax).updateOne(
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
        log.error("error in updateFaxIntegration ***", error);
        throw new Error(error?.message || error);
      }
    },

    async deleteFaxIntegration(_, { IsDeleted, customerId }, context) {
      log.lambdaSetup(context, "faxIntegration", "deleteFaxIntegration");
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
        await db.collection(Fax).updateOne(
          {
            CustomerID: ObjectId.createFromHexString(customerId),
            IsDeleted: false,
          },
          { $set: { IsDeleted: true } }
        );
        return { message: "Deleted Successfully", statusCode: 200 };
      } catch (error) {
        log.error("error in deleteFaxIntegration ***", error);
        throw new Error(error?.message || error);
      }
    },

    async updateFaxIntegrationStatus(_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, "faxIntegration", "updateFaxIntegrationStatus");
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
        await db.collection(Fax).updateOne(
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
        log.error("error in updateFaxIntegrationStatus ***", error);
        throw new Error(error?.message || error);
      }
    },
  },

  Query: {
    async getFaxIntegration(_, { customerId }, context) {
      log.lambdaSetup(context, "faxIntegration", "getFaxIntegration");
      try {
        verifyUserAccess(context, context.data.CustomerID);
        const db = await getDb();
        let response = await db.collection(Fax).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          IsDeleted: false,
        });
        if (!response) {
          throw new GraphQLError(FAX_INTEGRATION_DATA_NOT_FOUND, {
            extensions: {
              code: "404",
            },
          });
        }
        response = response ? await performDecryption(response) : {};
        const customerData = await db
          .collection(Customers)
          .findOne(
            { _id: response?.CustomerID },
            { projection: { _id: 1, CustomerName: 1 } }
          );
        if (!response?.AllowedUSCanadaAreaCodes || !response?.AdditionalAreaCodes || !response?.AllowedInternationalAreaCodes) {
          const dropDownFaxAreaCodes = await db.collection("Dropdowns").findOne({}, { projection: { _id: 0, FaxAreaCodes: 1 } });
          response.AllowedUSCanadaAreaCodes = response?.AllowedUSCanadaAreaCodes ? response?.AllowedUSCanadaAreaCodes : dropDownFaxAreaCodes?.FaxAreaCodes?.AllowedUSCanadaAreaCodes;
          response.AdditionalAreaCodes = response?.AdditionalAreaCodes ? response?.AdditionalAreaCodes : dropDownFaxAreaCodes?.FaxAreaCodes?.AdditionalAreaCodes;
          response.AllowedInternationalAreaCodes = response?.AllowedInternationalAreaCodes ? response?.AllowedInternationalAreaCodes : dropDownFaxAreaCodes?.FaxAreaCodes?.AllowedInternationalAreaCodes;
        }
        return {
          ...response,
          CustomerName: customerData?.CustomerName || null,
        };
      } catch (error) {
        log.error("getFaxIntegration error ***", error);
        throw new Error(error?.message || error);
      }
    },
  },
};
