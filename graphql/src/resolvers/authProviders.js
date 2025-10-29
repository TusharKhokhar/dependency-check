const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, PROVIDER_ALREADY_EXIST, INTERNAL_PROVIDER_ALREADY_EXIST, 
  INVALID_STATUS,
  DISASSOCIATE_BEFORE_DELETION,
  AUTH_PROVIDER_NOT_FOUND
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const { AuthProviders, Customers } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { customerSecurity } = require('../../utils/validation')
const { findReference } = require('../../helpers/referenceFinder')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess, verifyKioskAndUserAccess
} = require('../../helpers/util')
const {performDecryption, performEncryption} = require("../../services/authProviders/edService");
const {domainName} = require("../../config/config");
const {buildIdPMetadata} = require("../../services/xmlGenerator");
dot.keepArray = true
const CustomLogger = require("../../helpers/customLogger");
const {atriumAuthToken} = require("../../services/payments/atrium");
const config = require("../../config/config");
const { validateAddAuthProvider, validateUpdateAuthProvider } = require('../../helpers/authProvider')
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addAuthProvider (_, { addAuthProviderInput }, context, info) {
      log.lambdaSetup(context, 'authProviders', 'addAuthProvider')
      const {
        CustomerID,
        ProviderName,
        OrgID,
        AuthProvider,
        SamlConfig,
        OpenIdConfig,
        DefaultGroupID,
        LdapConfig,
        AadConfig,
        GSuiteConfig,
        SirsiConfig,
        InnovativeConfig,
        DisplayOnPortal,
        PolarisConfig,
        InternalLoginConfig,
        ExternalCardValidationConfig,
        WkpConfig,
        AssociatedIdentityProvider,
        Mappings,
        GroupId,
        CustomerData,
        IsDeleted,
        Tags,
        LabelText,
        DefaultGroupName,
        TokenExpiry,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        AllowUserCreation,
        Sip2Config,
        IsActive,
        CustomFieldsEnabled,
        CustomFields
      } = addAuthProviderInput
      let newAuthProvider = {
        CustomerID,
        ProviderName,
        OrgID,
        AuthProvider,
        SamlConfig,
        OpenIdConfig,
        DefaultGroupID,
        LdapConfig,
        AadConfig,
        GSuiteConfig,
        SirsiConfig,
        InnovativeConfig,
        PolarisConfig,
        InternalLoginConfig,
        ExternalCardValidationConfig,
        WkpConfig,
        AssociatedIdentityProvider,
        Mappings,
        GroupId,
        CustomerData,
        IsDeleted,
        AllowUserCreation,
        Tags,
        LabelText,
        DefaultGroupName,
        TokenExpiry,
        CreatedBy,
        Sip2Config,
        DisplayOnPortal,
        CustomFields,
        IsActive,
        CustomFieldsEnabled
      }
      try {
        verifyUserAccess(context, CustomerID)
        newAuthProvider = formObjectIds(newAuthProvider)
        newAuthProvider = addCreateTimeStamp(newAuthProvider)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        await validateAddAuthProvider(db, addAuthProviderInput)
        newAuthProvider = await performEncryption(newAuthProvider)
        const { insertedId } = await db.collection(AuthProviders).insertOne(newAuthProvider)
        return await db.collection(AuthProviders).findOne({ _id: insertedId })
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateAuthProvider (_, { updateAuthProviderInput, authProviderId, customerId }, context, info) {
      log.lambdaSetup(context, 'authProviders', 'updateAuthProvider')
      try {
        verifyUserAccess(context, customerId);
        const db = await getDatabaseOneCustomer(context, customerId);
        await validateUpdateAuthProvider(db, updateAuthProviderInput);
        dot.remove('CustomerID', updateAuthProviderInput);
        updateAuthProviderInput = await performEncryption(updateAuthProviderInput);
        updateAuthProviderInput = addUpdateTimeStamp(updateAuthProviderInput);
        let updateObject = await dot.dot(updateAuthProviderInput);
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id);
        updateObject = formObjectIds(updateObject, true);
        await db.collection(AuthProviders).updateOne(
          { _id: ObjectId.createFromHexString(authProviderId) },
          {
            $set: updateObject,
          }
        );
        return {
          message: 'Updated successfully',
          statusCode: 200,
        };
      } catch (error) {
        throw new Error(error);
      }
    },

    async authProviderDeleted (_, { IsDeleted, authProviderId, customerId }, context, info) {
      log.lambdaSetup(context, 'authProviders', 'authProviderDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!authProviderId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('authProviders', authProviderId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(AuthProviders).updateOne({ _id: ObjectId.createFromHexString(authProviderId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async authProviderStatus (_, { IsActive, authProviderId, customerId }, context) {
      log.lambdaSetup(context, 'authProviders', 'authProviderStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!authProviderId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabaseOneCustomer(context, customerId)
        await db.collection(AuthProviders).updateOne({ _id: ObjectId.createFromHexString(authProviderId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getAuthProviders (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'authProviders', 'getAuthProviders')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey,
        authProviderType
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(AuthProviders)
      return await model.authProviders.getAuthProvidersInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          authProviderType,
          collection,
          customerIds
        }).then(authProviderList => {
        return authProviderList
      }).catch(err => {
        console.log(err)
        throw new Error(err)
      })
    },

    async getAuthProvider (_, { authProviderId, customerId }, context) {
      log.lambdaSetup(context, 'authProviders', 'getAuthProvider')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        let authData = await db.collection(AuthProviders).findOne({ _id: ObjectId.createFromHexString(authProviderId), IsDeleted: false })
        if (authData) {
          const customerData = await db
            .collection(Customers)
            .findOne(
              { _id: ObjectId.createFromHexString(customerId) },
              { CustomerName: 1 }
            );
          authData = updateAuthDataWithCallbackUrl(authData);
          authData.CustomerName = customerData.CustomerName;
          return await performDecryption(authData);
        } else {
          throw new GraphQLError(AUTH_PROVIDER_NOT_FOUND, {
            extensions: {
              code: "121",
            },
          });
        }
      } catch (err) {
        throw new Error(err)
      }
    },

    async getInternalAuthProvider (_, { customerId }, context) {
      log.lambdaSetup(context, 'authProviders', 'getInternalAuthProvider')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
         const val = await db.collection(AuthProviders).findOne({ CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false, AuthProvider: 'internal' })
        return !!val
      } catch (err) {
        throw new Error(err)
      }
    },

    async buildIdPMetadata (_, { customerId, authProviderId }, context) {
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        const response = await buildIdPMetadata(db)
        return {
          message: Buffer.from(response).toString('base64'),
          statusCode: 200
        }
      } catch (err) {
        log.error("buildIdPMetadata catch Error : ",err)
        throw new Error(err)
      }
    }
  }
}

const updateAuthDataWithCallbackUrl = (authData) => {
  if (['saml', 'oidc', 'azuread', 'gsuite', 'externalCardValidation'].includes(authData.AuthProvider)) {
    authData.CallbackUrl = `https://api.${domainName}/auth/callback`
  }
  return authData
}