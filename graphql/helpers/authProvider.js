const { GraphQLError } = require("graphql");
const { AuthProviders } = require("../models/collections");
const {
  INVALID_ASSOCIATED_IDENTITY_PROVIDER,
  REQUIRED_FIELDS_MISSING,
  PROVIDER_ALREADY_EXIST,
  INTERNAL_PROVIDER_ALREADY_EXIST,
  TOO_MANY_CUSTOM_FIELDS,
  CUSTOM_FIELDS_NOT_ALLOWED,
} = require("./error-messages");
const { getObjectId: ObjectId } = require("./objectIdConverter");

const validateCustomFields = (authProvider) => {
  const { AuthProvider, CustomFields, CustomFieldsEnabled } = authProvider;
  if (
    !["externalCardValidation", "oidc"].includes(AuthProvider) &&
    (CustomFieldsEnabled ||
      (Array.isArray(CustomFields) && CustomFields.length > 0))
  ) {
    throw new GraphQLError(CUSTOM_FIELDS_NOT_ALLOWED, {
      extensions: {
        code: "400",
      },
    });
  }
  if (
    ["externalCardValidation", "oidc"].includes(AuthProvider) &&
    CustomFields.length > 4
  ) {
    throw new GraphQLError(TOO_MANY_CUSTOM_FIELDS, {
      extensions: {
        code: "400",
      },
    });
  }
};

const validateAddAuthProvider = async (db, addAuthProviderInput) => {
  try {
    const {
      AuthProvider,
      AssociatedIdentityProvider,
      CustomerID,
      ProviderName,
    } = addAuthProviderInput;

    const internalAuthValidate = await db.collection(AuthProviders).findOne({
      AuthProvider: AuthProvider,
      CustomerID: ObjectId.createFromHexString(CustomerID),
      IsDeleted: false,
    });
    if (
      internalAuthValidate &&
      internalAuthValidate.AuthProvider === "internal"
    ) {
      throw new GraphQLError(INTERNAL_PROVIDER_ALREADY_EXIST, {
        extensions: {
          code: "400",
        },
      });
    }
    if (
      AuthProvider === "externalCardValidation" &&
      !AssociatedIdentityProvider
    ) {
      throw new GraphQLError(REQUIRED_FIELDS_MISSING, {
        extensions: {
          code: "400",
        },
      });
    }
    validateCustomFields(addAuthProviderInput);
    if (
      AuthProvider === "externalCardValidation" &&
      AssociatedIdentityProvider
    ) {
      const externalCardValidation = await db
        .collection(AuthProviders)
        .findOne({
          _id: ObjectId.createFromHexString(AssociatedIdentityProvider),
          AuthProvider: AuthProvider,
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
      if (externalCardValidation) {
        throw new GraphQLError(INVALID_ASSOCIATED_IDENTITY_PROVIDER, {
          extensions: {
            code: "400",
          },
        });
      }
    }
    const authProviderValidate = await db.collection(AuthProviders).findOne({
      ProviderName: ProviderName,
      CustomerID: ObjectId.createFromHexString(CustomerID),
      IsDeleted: false,
    });
    if (authProviderValidate) {
      throw new GraphQLError(PROVIDER_ALREADY_EXIST, {
        extensions: {
          code: "400",
        },
      });
    }
  } catch (error) {
    throw error;
  }
};

const validateUpdateAuthProvider = async (db, updateAuthProviderInput) => {
  try {
    const { AuthProvider, AssociatedIdentityProvider, CustomerID } =
      updateAuthProviderInput;

    if (
      AuthProvider === "externalCardValidation" &&
      !AssociatedIdentityProvider
    ) {
      throw new GraphQLError(REQUIRED_FIELDS_MISSING, {
        extensions: {
          code: "400",
        },
      });
    }
    validateCustomFields(updateAuthProviderInput);
    if (
      AuthProvider === "externalCardValidation" &&
      AssociatedIdentityProvider
    ) {
      const externalCardValidation = await db
        .collection(AuthProviders)
        .findOne({
          _id: ObjectId.createFromHexString(AssociatedIdentityProvider),
          AuthProvider: AuthProvider,
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false,
        });
      if (externalCardValidation) {
        throw new GraphQLError(INVALID_ASSOCIATED_IDENTITY_PROVIDER, {
          extensions: {
            code: "400",
          },
        });
      }
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { validateAddAuthProvider, validateUpdateAuthProvider };
