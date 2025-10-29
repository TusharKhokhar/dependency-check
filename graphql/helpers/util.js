const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const { ObjectId: mongoObjectId } = require('mongodb');
const crypto = require('crypto')
const Joi = require('joi');
const { 
  STANDARD_TIER, 
  PAYMENT_TYPE: { 
    EGHL,
    BRAINTREE,
    STRIPE,
    HEARTLAND,
    AUTHORIZENET,
    XENDIT,
    MONERIS,
    IPAY88,
    PORTONE
  },
  PAYMENT_GATEWAYS_WEBHOOKS,
  ACCOUNT_SYNC_INTEGRATION,
  THIRD_PARTY_PROTON,
  THIRD_PARTY_EMAIL,
  THIRD_PARTY_ILLIAD,
  THIRD_PARTY_FTP,
  THIRD_PARTY_FAX,
  NETWORK_INTEGRATION
} = require('./constants')
const { getDb, isolatedDatabase } = require('../config/dbHandler')
const {GraphQLError, parse} = require("graphql");
const {UNAUTHORIZED, INSUFFICIENT_PERMISSION} = require("./error-messages");
const {encryptText, decryptText} = require("./encryptDecrypt");
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { domainName, apiKey: configApiKeys } = require("../config/config");
const { permissionMapping, adminDomainRestrictedAPIs, publicAPIs, apiUsedByKiosk } = require('./apiPermissions');
const randomString = (length) => [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

const formObjectIds = (data, updateFlat = false) => {
  if (updateFlat){
    for (const key in data) {
      if (mongoObjectId.isValid(data[key]) && typeof data[key] !== 'number') {
        data[key] = ObjectId.createFromHexString(data[key])
      }
      if (Array.isArray(data[key])) {
        if (key.includes('GroupQuotas')) {
          let finalArray = []
          data[key].forEach(gr => {
            gr.GroupID = ObjectId.createFromHexString(gr.GroupID)
            finalArray.push(gr)
          })
          data[key] =  finalArray
        }
        if (key.includes('DeviceID')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('AssociatedQuotaBalance')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('GroupID')) {
          data.GroupID = data.GroupID.map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('GroupId')) {
          let finalArray = []
          data[key].forEach(gr => {
            finalArray.push({id: ObjectId.createFromHexString(gr.id),
              name: gr.name})
          })
          data[key] = finalArray
        }
        if (key.includes('GroupQuotas')) {
          let finalArray = []
          data[key].forEach(gr => {
            finalArray.push({GroupID: ObjectId.createFromHexString(gr.GroupID),
              QuotaBalance: gr.QuotaBalance})
          })
          data[key] = finalArray
        }
        if (key.includes('Sso')) {
          let finalArray = []
          data[key].forEach(gr => {
            finalArray.push({IdentityProviderID: ObjectId.createFromHexString(gr.IdentityProviderID),
              IdentifyName: gr.IdentifyName})
          })
          data[key] = finalArray
        }
        if (key.includes('ThingsAssociated')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('SupportedIdentityProviderID')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('MobileConfiguration.LocationConfiguration')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
        if (key.includes('MobileConfiguration.MultipleLocationConfiguration')) {
          data[key] = data[key].map(gr => ObjectId.createFromHexString(gr))
        }
      }
    }
    return data
  }
  if (data.CustomerID) {
    data.CustomerID = ObjectId.createFromHexString(data.CustomerID)
  }
  if (data.AssociatedIdentityProvider) {
    data.AssociatedIdentityProvider = ObjectId.createFromHexString(data.AssociatedIdentityProvider)
  }
  if(data.LoginOptions){
    data.LoginOptions.forEach(option => {
      if (Array.isArray(option?.ExternalCardIdp)) {
        option.ExternalCardIdp = option.ExternalCardIdp.map(ObjectId.createFromHexString);
      }
    });
  }
  if (data.GroupQuotas) {
    if (Array.isArray(data.GroupQuotas)) {
      let finalArray = []
      data.GroupQuotas.forEach(gr => {
        gr.GroupID = ObjectId.createFromHexString(gr.GroupID)
        finalArray.push(gr)
      })
      data.GroupQuotas =  finalArray
    }
  }
  if (data?.ProfileSetting?.PrintConfigurationGroup) {
    data.ProfileSetting.PrintConfigurationGroup = ObjectId.createFromHexString(data.ProfileSetting.PrintConfigurationGroup)
  }
  if (data.RoleType) {
    data.RoleType = ObjectId.createFromHexString(data.RoleType)
  }
  if (data.LocationID) {
    data.LocationID = ObjectId.createFromHexString(data.LocationID)
  }
  if (data.AreaID) {
    data.AreaID = ObjectId.createFromHexString(data.AreaID)
  }
  if (data.NavigationPermissionID) {
    data.NavigationPermissionID = ObjectId.createFromHexString(data.NavigationPermissionID)
  }
  if (data.DefaultGroupID) {
    data.DefaultGroupID = ObjectId.createFromHexString(data.DefaultGroupID)
  }
  if (data.DeviceID) {
    if (Array.isArray(data.DeviceID)) {
      data.DeviceID = data.DeviceID.map(gr => ObjectId.createFromHexString(gr))
    } else {
      data.DeviceID = ObjectId.createFromHexString(data.DeviceID)
    }
  }
  if (data.AssociatedQuotaBalance) {
    if (Array.isArray(data.AssociatedQuotaBalance)) {
      data.AssociatedQuotaBalance = data.AssociatedQuotaBalance.map(gr => ObjectId.createFromHexString(gr))
    } else {
      data.AssociatedQuotaBalance = ObjectId.createFromHexString(data.AssociatedQuotaBalance)
    }
  }
  if (data.ThingID) {
    data.ThingID = ObjectId.createFromHexString(data.ThingID)
  }
  if (data.DefaultDevice) {
    data.DefaultDevice = ObjectId.createFromHexString(data.DefaultDevice)
  }
  if (data.GroupID) {
    if (Array.isArray(data.GroupID)) {
      data.GroupID = data.GroupID.map(gr => ObjectId.createFromHexString(gr))
    } else {
      data.GroupID = ObjectId.createFromHexString(data.GroupID)
    }
  }
  if (data.GroupId) {
    if (Array.isArray(data.GroupId)) {
      let finalArray = []
      data.GroupId.forEach(gr => {
        finalArray.push({id: ObjectId.createFromHexString(gr.id),
        name: gr.name})
      })
      data.GroupId = finalArray
    } else {
      data.GroupId = ObjectId.createFromHexString(data.GroupId)
    }
  }
  if (data.GroupQuotas) {
    if (Array.isArray(data.GroupQuotas)) {
      let finalArray = []
      data.GroupQuotas.forEach(gr => {
        finalArray.push({GroupID: ObjectId.createFromHexString(gr.GroupID),
          QuotaBalance: gr.QuotaBalance})
      })
      data.GroupQuotas = finalArray
    } else {
      data.GroupQuotas = ObjectId.createFromHexString(data.GroupQuotas)
    }
  }
  if (data.CustomizationID) {
    data.CustomizationID = ObjectId.createFromHexString(data.CustomizationID)
  }
  if (data.SignUpGroup) {
    data.SignUpGroup = ObjectId.createFromHexString(data.SignUpGroup)
  }
  if (data.RulesID) {
    data.RulesID = ObjectId.createFromHexString(data.RulesID)
  }
  if (data.DefaultAutomaticDeliveryLocation) {
    data.DefaultAutomaticDeliveryLocation = ObjectId.createFromHexString(data.DefaultAutomaticDeliveryLocation)
  }
  if (data.PrintConfigurationGroupID) {
    data.PrintConfigurationGroupID = ObjectId.createFromHexString(data.PrintConfigurationGroupID)
  }
  if (data?.SupportedIdentityProviderID?.length > 0) {
    data.SupportedIdentityProviderID = data?.SupportedIdentityProviderID?.map(idp => ObjectId.createFromHexString(idp))
  }
  if (data.DefaultLmsValidateThing) {
    data.DefaultLmsValidateThing = ObjectId.createFromHexString(data.DefaultLmsValidateThing)
  }
  if (data.Driver && data.Driver.IdentityProviderID) {
    data.Driver.IdentityProviderID = ObjectId.createFromHexString(data.Driver.IdentityProviderID)
  }
  if (data.MobileConfiguration && data.MobileConfiguration.LocationConfiguration) {
    data.MobileConfiguration.LocationConfiguration = ObjectId.createFromHexString(data.MobileConfiguration.LocationConfiguration)
  }
  if (data.MobileConfiguration && data.MobileConfiguration.MultipleLocationConfiguration) {
    data.MobileConfiguration.MultipleLocationConfiguration = data.MobileConfiguration.MultipleLocationConfiguration.map(ob => ObjectId.createFromHexString(ob))
  }
  if(data.Sso && Array.isArray(data.Sso)){
    let finalArray = []
    data.Sso.forEach(gr => {
      finalArray.push({IdentityProviderID: ObjectId.createFromHexString(gr.IdentityProviderID),
        IdentifyName: gr.IdentifyName})
    })
    data.Sso = finalArray
  }
  if(data?.RedundancySetting?.ThingsAssociated && Array.isArray(data.RedundancySetting.ThingsAssociated)){
    data.RedundancySetting.ThingsAssociated = data.RedundancySetting.ThingsAssociated.map(gr => ObjectId.createFromHexString(gr))
  }
  if(data?.RedundancySetting?.PrimaryThingID){
    data.RedundancySetting.PrimaryThingID = ObjectId.createFromHexString(data.RedundancySetting.PrimaryThingID)
  }
  if (data.FaxID) {
    data.FaxID = ObjectId.createFromHexString(data.FaxID)
  }
  return data
}

const addUpdateTimeStamp = (data) => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  data.UpdatedAt = new Date(nowUtc)
  return data
}

const addCreateTimeStamp = (data, creater) => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  data.CreatedAt = new Date(nowUtc)
  data.UpdatedAt = new Date(nowUtc)
  data.IsActive = data.IsActive === true
  data.IsDeleted = false
  // eslint-disable-next-line no-unused-expressions
  creater ? data.CreatedBy = creater : creater
  return data
}
const getDatabase = async (context) => {
  return await getDb()
}

const utcDateGet = () => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  return new Date(nowUtc)
}

const capitalCaseValues = (data) => {
  if(data?.Print?.PaperSize) {
    data.Print.PaperSize = data.Print.PaperSize.charAt(0).toUpperCase() + data.Print.PaperSize.slice(1)
  }
  if(data?.Print?.ColorType) {
    data.Print.ColorType = data.Print.ColorType.charAt(0).toUpperCase() + data.Print.ColorType.slice(1)
  }
  return data
}

const validateInputUsage = (data) => {
  if(data?.Print?.JobType){
    if(['Copy', 'Print', 'Scan'].includes(data.Print.JobType)) {
      return data
    } else {
      throw  new Error(`${data.Print.JobType} is not a valid Job Type`)
    }
  } else {
    return data
  }
}

const getDatabaseCurrentLogin = async (context) => {
  const requesterDomain = context.headers.subdomain
  const tier = context.headers.tier
  return tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(requesterDomain)
}

const getDualDb = async (context, customerId) => {
  let db = await getDb()
  let commonDb
  const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1, ParentCustomer: 1 })
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    commonDb = db
    db = await isolatedDatabase(customerData.DomainName)
  }
  commonDb  = commonDb ? commonDb : db
  return { db, commonDb }
}

const getDatabaseForGetAllAPI = async (context, customerIds) => {
  let db = await getDb()
  if (customerIds && Array.isArray(customerIds) && customerIds.length === 1) {
    const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerIds[0]) }, { DomainName: 1, Tier: 1 })
    if (customerData && customerData.Tier !== STANDARD_TIER) {
      db = await isolatedDatabase(customerData.DomainName)
    }
  }
  return db
}

const getDatabaseOneCustomer = async (context, customerId) => {
  let db = await getDb()
  const customerData = customerId ? await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 }) : null
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    db = await isolatedDatabase(customerData.DomainName)
  }
  return db
}

const verifyUserAccess = (context, customerId) => {
  const allowedIds = context.data.customerIdsStrings
  const tenantDomain = context.data.TenantDomain
  if((tenantDomain === 'admin' || allowedIds.includes(customerId.toString()))  && context.data && context.data.isKiosk === false) {
    verifyUserPermissions(context)
    return true
  } else {
    throw new GraphQLError(UNAUTHORIZED, {
      extensions: {
        code: '403'
      }
    })
  }
}

const verifyKioskAndUserAccess = (context, customerId) => {
  const allowedIds = context.data.customerIdsStrings
  const tenantDomain = context.data.TenantDomain
  if ((tenantDomain === 'admin' || allowedIds.includes(customerId.toString())) && context.data && context.data.isKiosk === true) {
    return true
  } else {
    throw new GraphQLError(UNAUTHORIZED, {
      extensions: {
        code: '403'
      }
    })
  }
}

const verifyUserPermissions = (context) => {
  const permissions = context.data?.user?.Permissions || [];
  const tenantDomain = context.data?.TenantDomain;
  const operationName = context?.operationName || '';
  
  log.info("*** operationName ***", operationName)

  // Flatten admin domain restricted APIs
  const adminRestrictedAPIs = [
    ...adminDomainRestrictedAPIs.query,
    ...adminDomainRestrictedAPIs.mutation,
  ];

  // Flatten public APIs
  const publicApis = [...(publicAPIs.query || []), ...(publicAPIs.mutation || [])];
  const kioskApis = [...(apiUsedByKiosk.query || []), ...(apiUsedByKiosk.mutation || [])];

  // Allow if the requested API is a public API or used by Kiosk or embeded
  if (publicApis.includes(operationName) || kioskApis.includes(operationName)) return true;

  // Check if the operation is part of admin-restricted APIs and tenantDomain is "admin"
  if (tenantDomain === "admin" && adminRestrictedAPIs.includes(operationName)) {
    return true; // Allow access without checking permissions
  }

  // Map all required permissions for operations
  const requiredPermissions = {
    ...permissionMapping.query,
    ...permissionMapping.mutation,
  };

  // Fetch the permissions required for the current operation
  const operationPermission = requiredPermissions[operationName] || [];

  if (!operationPermission.length) {
    log.info({
      operationName,
      message: "Operation not exist in requiredPermissions"
    })
    throw new GraphQLError(INSUFFICIENT_PERMISSION, {
      extensions: { code: "403" },
    });
  }

  // Check if the user has at least one of the required permissions
  const hasPermission = operationPermission.some((perm) => permissions.includes(perm));

  if (!hasPermission) {
    // Log for debugging purposes
    log.info({
      message: "insufficient permission",
      operationName,
      userID: context.data?.user?._id,
      requiredPermissions: operationPermission,
      userPermissions: permissions,
      missingPermissions: operationPermission.filter((perm) => !permissions.includes(perm)),
    });

    throw new GraphQLError(INSUFFICIENT_PERMISSION, {
      extensions: { code: "403" },
    });
  }

  return true; // User has the necessary permissions
};


const performEncryption = async (data) => {
  if (data.PaymentType === BRAINTREE && data.Braintree.PrivateKey && data.Braintree.PublicKey && data.Braintree.MerchantId) {
    data.Braintree.PrivateKey = await encryptText(data.Braintree.PrivateKey)
    data.Braintree.PublicKey = await encryptText(data.Braintree.PublicKey)
    data.Braintree.MerchantId = await encryptText(data.Braintree.MerchantId)
    return data
  }
  
  if (data.PaymentType === STRIPE && data.Stripe.SecretKey) {
    data.Stripe.PublicKey = data.Stripe?.PublicKey ? await encryptText(data.Stripe.PublicKey) : null
    data.Stripe.SecretKey = await encryptText(data.Stripe.SecretKey)
    data.Stripe.WebhookSecret = data.Stripe?.WebhookSecret ? await encryptText(data.Stripe.WebhookSecret) : null
    return data;
  }

  if (data.PaymentType === AUTHORIZENET && data.AuthorizeNet.TransactionKey && data.AuthorizeNet.ApiLogin) {
    data.AuthorizeNet.TransactionKey = await encryptText(data.AuthorizeNet.TransactionKey)
    data.AuthorizeNet.ApiLogin = await encryptText(data.AuthorizeNet.ApiLogin)
    return data
  }

  if (data.PaymentType === EGHL && data.eGHL.ServiceId && data.eGHL.Password) {
    data.eGHL.ServiceId = await encryptText(data.eGHL.ServiceId)
    data.eGHL.Password = await encryptText(data.eGHL.Password)
    return data
  }
  
  if (data.PaymentType === HEARTLAND && data.Heartland.MerchandID && data.Heartland.SharedSecret) {
    data.Heartland.MerchandID = await encryptText(data.Heartland.MerchandID)
    data.Heartland.SharedSecret = await encryptText(data.Heartland.SharedSecret)
    return data
  }

  if (data.PaymentType === XENDIT && data.Xendit.SecretKey) {
    data.Xendit.SecretKey = await encryptText(data.Xendit.SecretKey)
    return data
  }

  if (data.PaymentType === PORTONE && data.PortOne.SecretKey) {
    data.PortOne.SecretKey = await encryptText(data.PortOne.SecretKey)
    return data
  }

  if (data.PaymentType === MONERIS && data.Moneris.ApiToken && data.Moneris.StoreId && data.Moneris.CheckoutId) {
    data.Moneris.ApiToken = await encryptText(data.Moneris.ApiToken)
    data.Moneris.StoreId = await encryptText(data.Moneris.StoreId)
    data.Moneris.CheckoutId = await encryptText(data.Moneris.CheckoutId)
    return data
  }

  if (data.ThirdPartySoftwareType === ACCOUNT_SYNC_INTEGRATION && data.ClientSecret) {
    data.ClientSecret = await encryptText(data.ClientSecret)
    return data
  }

  if (data.ThirdPartySoftwareType === NETWORK_INTEGRATION && data.Password) {
    data.Password = await encryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_PROTON && data.ClientSecret) {
    data.ClientSecret = await encryptText(data.ClientSecret)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_EMAIL && data.Password) {
    data.Password = await encryptText(data.Password)
    return data
  }
  
  if (data.ThirdPartySoftwareType === THIRD_PARTY_ILLIAD && data.Password) {
    data.Password = await encryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_FTP && data.Password) {
    data.Password = await encryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_FAX && data.Password) {
    data.Password = await encryptText(data.Password)
    return data
  }
  
  if (data.PaymentType === IPAY88 && data.Pay88?.SecretKey) {
    data.Pay88.SecretKey = await encryptText(data.Pay88.SecretKey)
    return data
  }

  return data
}

const performDecryption = async (data) => {
  if (data.PaymentType === BRAINTREE && data.Braintree.PrivateKey && data.Braintree.PublicKey && data.Braintree.MerchantId) {
    data.Braintree.PrivateKey = await decryptText(data.Braintree.PrivateKey)
    data.Braintree.PublicKey = await decryptText(data.Braintree.PublicKey)
    data.Braintree.MerchantId = await decryptText(data.Braintree.MerchantId)
    return data
  }

  if (data.PaymentType === STRIPE && data.Stripe.SecretKey) {
    data.Stripe.PublicKey = data.Stripe?.PublicKey ? await decryptText(data.Stripe.PublicKey) : null
    data.Stripe.SecretKey = await decryptText(data.Stripe.SecretKey)
    data.Stripe.WebhookSecret = data.Stripe?.WebhookSecret ? await decryptText(data.Stripe.WebhookSecret) : null
    return data;
  }
  
  if (data.PaymentType === AUTHORIZENET && data.AuthorizeNet.TransactionKey && data.AuthorizeNet.ApiLogin) {
    data.AuthorizeNet.TransactionKey = await decryptText(data.AuthorizeNet.TransactionKey)
    data.AuthorizeNet.ApiLogin = await decryptText(data.AuthorizeNet.ApiLogin)
    return data
  }
  
  if (data.PaymentType === EGHL && data.eGHL.ServiceId && data.eGHL.Password) {
    data.eGHL.ServiceId = await decryptText(data.eGHL.ServiceId)
    data.eGHL.Password = await decryptText(data.eGHL.Password)
    return data
  }

  if (data.PaymentType === HEARTLAND && data.Heartland.MerchandID && data.Heartland.SharedSecret) {
    data.Heartland.MerchandID = await decryptText(data.Heartland.MerchandID)
    data.Heartland.SharedSecret = await decryptText(data.Heartland.SharedSecret)
    return data
  }

  if (data.PaymentType === XENDIT && data.Xendit.SecretKey) {
    data.Xendit.SecretKey = await decryptText(data.Xendit.SecretKey)
    return data
  }

  if (data.PaymentType === PORTONE && data.PortOne.SecretKey) {
    data.PortOne.SecretKey = await decryptText(data.PortOne.SecretKey)
    return data
  }

  if (data.PaymentType === MONERIS && data.Moneris.ApiToken && data.Moneris.StoreId && data.Moneris.CheckoutId) {
    data.Moneris.ApiToken = await decryptText(data.Moneris.ApiToken)
    data.Moneris.StoreId = await decryptText(data.Moneris.StoreId)
    data.Moneris.CheckoutId = await decryptText(data.Moneris.CheckoutId)
    return data
  }

  if (data.ThirdPartySoftwareType === ACCOUNT_SYNC_INTEGRATION && data.ClientSecret) {
    data.ClientSecret = await decryptText(data.ClientSecret)
    return data
  }

  if (data.ThirdPartySoftwareType === NETWORK_INTEGRATION && data.Password) {
    data.Password = await decryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_PROTON && data.ClientSecret) {
    data.ClientSecret = await decryptText(data.ClientSecret)
    return data
  }

  if (data.PaymentType === IPAY88 && data.Pay88?.SecretKey) {
    data.Pay88.SecretKey = await decryptText(data.Pay88.SecretKey)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_EMAIL && data.Password) {
    data.Password = await decryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_ILLIAD && data.Password) {
    data.Password = await decryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_FTP && data.Password) {
    data.Password = await decryptText(data.Password)
    return data
  }

  if (data.ThirdPartySoftwareType === THIRD_PARTY_FAX && data.Password) {
    data.Password = await decryptText(data.Password)
    return data
  }
  
  return data
}

const checkValidUser = async (context) => {
  return context.data.user.IsPartner || context.data.user.TenantDomain === 'admin';
}

// A function to compare if two arrays have the same elements regardless of their order
const ignoreOrderCompare = (a, b) => {
  if (a.length !== b.length) return false;
  const elements = new Set([...a, ...b]);
  for (const x of elements) {
    const count1 = a.filter(e => e === x).length;
    const count2 = b.filter(e => e === x).length;
    if (count1 !== count2) return false;
  }
  return true;
}

const getUtcTime = () => {
  let utc = new Date(new Date().toUTCString());
  return utc.toISOString();
};

const validateInputs = (inputData, schema) => {
  const { error, value } = Joi.object(schema).validate(inputData);
  if (error) {
    throw new Error(`${error.details[0].message}`);
  }

  return value;
}

const validatePaymentFields = (inputData, paymentSchema) => {
  const { error, value } = paymentSchema.validate(inputData, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join('; ');
    throw new Error(errorMessage);
  } else {
    return value;
  }
}

const getConfig = async (db, paymentId, customerId, collectionName) => {
  const data = await db.collection(collectionName || 'Payments').findOne({ 
    _id: ObjectId.createFromHexString(paymentId),
    CustomerID: ObjectId.createFromHexString(customerId),
    IsActive: true,
    IsDeleted: false
  })

  if (!data) throw new Error('Config not found')
  return data
}

const getUser = async (db, collectionName, customerId, userId) => {
  const user = await db.collection(collectionName || 'Users').findOne({
    _id: ObjectId.createFromHexString(userId),
    CustomerID: ObjectId.createFromHexString(customerId),
    IsActive: true,
    IsDeleted: false,
  })
  
  if (!user) throw new Error('User not found.')
  return user
}

const addWebhookUrl = (data) => {
  if (data.payment && data.payment.length > 0) {
    data.payment.forEach((gateway) => {
      addWebhookUrlToGateway(gateway)
    });
  }
  if(data.PaymentType && data.PaymentType.length > 1) {
    addWebhookUrlToGateway(data)
  }
  return data;
}

const addWebhookUrlToGateway = (gateway) => {
  const paymentType = gateway?.PaymentType
  const selectedWebhookUrl = PAYMENT_GATEWAYS_WEBHOOKS[paymentType?.toUpperCase()]
  gateway[paymentType].WebhookURL = `${selectedWebhookUrl}/${gateway?.CustomerID}`
}

const getNayaxSecretKey = async (region, stage, domainName) => {
  const secretName = `${stage}/${domainName}/nayax`;
  const client = new SecretsManagerClient({ region });
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);

    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      throw new Error('SecretString not found in data');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};


const getIamCredentials = async (region, stage, domainName) => {
  const secretName = `${stage}/${domainName}/iam`
  const client = new SecretsManagerClient({region: region});
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);

    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      throw new Error('SecretString not found in data');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

const getStoredSecret = async (region, stage) => {
  const secretName = `${stage}/${domainName}/secrets`
  const client = new SecretsManagerClient({ region });
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await client.send(command);

    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      throw new Error('SecretString not found in data');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

const getAuthorizeNetSessionId = () => {
  return crypto.randomBytes(64).toString('hex').slice(0, 20)
}

const getFragmentOperation = (query) => {
  try {
    if (query) {
      const parsedQuery = parse(query);
      const fragments = parsedQuery.definitions
        .filter((def) => def.kind === "FragmentDefinition")
        .map((op) => op.name?.value || null)
        .filter(Boolean);
      return fragments.join("_");
    }
  } catch (err) {
    console.error('Failed to parse GraphQL query:', err.message);
    throw new Error('Invalid GraphQL query');
  }
};

function toPascalCase(input) {
  if (!input || typeof input !== "string") {
      return ""; // Return an empty string for invalid input
  }
  return input
      .replace(/[_\s-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : '')) // Replace delimiters with uppercase letters
      .replace(/^(.)/, (_, char) => char.toUpperCase()); // Capitalize the first character
}

const attachUserLoginProvider = async (users) => {
  const usersByTenant = {};

  // Group users by TenantDomain
  for (const user of users) {
    const { TenantDomain } = user;
    if (!TenantDomain) continue;
    if (!usersByTenant[TenantDomain]) {
      usersByTenant[TenantDomain] = [];
    }
    usersByTenant[TenantDomain].push(user);
  }

  // Process each TenantDomain in parallel
  await Promise.all(
    Object.entries(usersByTenant).map(async ([tenant, tenantUsers]) => {
      const anyUser = tenantUsers.find(u => u.CustomerID);
      if (!anyUser) return;

      const db = await getDatabaseOneCustomer(null, anyUser.CustomerID);

      // Collect all unique AuthProviderIDs and CustomerIDs
      const authProviderIDs = new Set();
      const customerIDs = new Set();

      for (const user of tenantUsers) {
        if (user.AuthProviderID) {
          authProviderIDs.add(user.AuthProviderID.toString());
        }
        if (user.CustomerID) {
          customerIDs.add(user.CustomerID.toString());
        }
      }

      // Query all needed AuthProviders in one go
      const allProviders = await db.collection("AuthProviders").find({
        $or: [
          { _id: { $in: [...authProviderIDs].map(id => ObjectId.createFromHexString(id)) } },
          {
            CustomerID: { $in: [...customerIDs].map(id => ObjectId.createFromHexString(id)) },
            IsActive: true,
            IsDeleted: false,
            AuthProvider: "internal",
          },
        ],
      }).toArray();

      // Build lookup map
      const providerById = new Map();
      const defaultInternalByCustomer = new Map();

      for (const provider of allProviders) {
        providerById.set(provider._id.toString(), provider);
        if (
          provider.AuthProvider === "internal" &&
          provider.IsActive &&
          !provider.IsDeleted
        ) {
          defaultInternalByCustomer.set(provider.CustomerID.toString(), provider);
        }
      }

      // Attach AuthProvider data
      for (const user of tenantUsers) {
        const authId = user.AuthProviderID?.toString();
        const customerId = user.CustomerID?.toString();
        let authProvider = null;

        if (authId && providerById.has(authId)) {
          authProvider = providerById.get(authId);
        }

        if (!authProvider && customerId && defaultInternalByCustomer.has(customerId)) {
          authProvider = defaultInternalByCustomer.get(customerId);
        }

        if (authProvider) {
          user.AuthProvideData = {
            AuthProviderID: authProvider._id,
            ProviderName: authProvider.ProviderName,
            AuthProvider: authProvider.AuthProvider,
          };
        }
      }
    })
  );

  return users;
};

const currencyCodeMap = {
  USDC: "USD",
};

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const normalizeValue = (value) => {
  const pattern = value.trim().replace(/\s+/g, "\\s*");
  return new RegExp(`^${pattern}$`, "i");
};

const getApiKeyName = (apiKey) => {
  if (!apiKey) {
    return "undefined";
  }
  return (
    Object.keys(configApiKeys).find((key) => configApiKeys[key] === apiKey) ||
    "unknown"
  );
};

const logGraphQLOperation = (operationName, apiKey, requesterDomain) => {
  const keyName = getApiKeyName(apiKey);

  log.info(
    `GraphQL Operation: ${operationName}, apiKeyName: ${keyName}, RequesterDomain: ${requesterDomain}`
  );
};

module.exports = {
  randomString,
  formObjectIds,
  getDatabase,
  getDualDb,
  addUpdateTimeStamp,
  addCreateTimeStamp,
  getDatabaseForGetAllAPI,
  getDatabaseOneCustomer,
  getDatabaseCurrentLogin,
  performEncryption,
  performDecryption,
  verifyUserAccess,
  checkValidUser,
  verifyKioskAndUserAccess,
  getUtcTime,
  ignoreOrderCompare,
  validateInputs,
  validatePaymentFields,
  getConfig,
  getUser,
  capitalCaseValues,
  validateInputUsage,
  addWebhookUrl,
  getNayaxSecretKey,
  getIamCredentials,
  utcDateGet,
  getStoredSecret,
  getAuthorizeNetSessionId,
  getFragmentOperation,
  verifyUserPermissions,
  toPascalCase,
  attachUserLoginProvider,
  currencyCodeMap,
  escapeRegex,
  normalizeValue,
  getApiKeyName,
  logGraphQLOperation
}
