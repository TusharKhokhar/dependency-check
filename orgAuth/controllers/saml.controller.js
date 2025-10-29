// node js version to run code => 14.17.3

const saml2 = require('saml2-js');
const bcrypt = require('bcryptjs');
// const fs = require('fs')
const { domainName } = require('../config/config')
// const spConfig_certificate = fs.readFileSync('./spConfig/sp_cert.crt')
// const spConfig_private_key = fs.readFileSync('./spConfig/sp_private.pem')
const model = require('../models/index')
const ErrorConstant = require('../helpers/error-messages');
const ERROR = require('../helpers/error-keys')
const { getDb, isolatedDatabase } = require("../config/db");
const { setErrorResponse } = require('../services/api-handler')
const { generateCode, assignUserBalance, assignAuthProviderID, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID } = require('../helpers/utils')
const { STANDARD_TIER } = require('../helpers/constants');
const {getPrivateKeyToSignCert} = require("../services/encryptDecrypt");
const {region} = require('../config/config')
const ORIGIN = `https://api.${domainName}`; // 'http://localhost:3000/public'   `https://api.${domainName}`
const AUDIENCE = ORIGIN; // 'http://localhost:3000'   ORIGIN
const CustomLogger = require("../helpers/customLogger");
const { sendAuditLogs } = require('../helpers/auditLog');
const log = new CustomLogger()

const samlConfiguration = async (idpConfig) => {
  try {
  const { SamlConfig } = idpConfig;
  const privateKey = await getPrivateKeyToSignCert(region)
  const db = await getDb()
  const {SAML_PUBLIC_CERT: spConfig_certificate} = await db.collection('Dropdowns').findOne({})
  SamlConfig.Certificate = SamlConfig.Certificate.trim().replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').split("\n").join("").split(" ").join("").trim();
  const sp_options = {
    entity_id: `${ORIGIN}`,
    assert_endpoint: `${ORIGIN}/auth/callback`,
    audience: `${AUDIENCE}`,
    private_key: privateKey,
    certificate: spConfig_certificate,
  };

  const sp = new saml2.ServiceProvider(sp_options);

  // certificates from the db should be in encrypted form we create function here in orgAuth to decrypt it and assign to idp_options
  const idp_options = {
    sso_login_url: SamlConfig.LoginUrl,
    // sso_logout_url: SamlConfig.sso_logout_url, 
    certificates: [SamlConfig.Certificate],
    nameid_format: SamlConfig.NameIdFormat,
    force_authn: false,// SamlConfig.ForceAuthn,
    sign_get_request: true, // SamlConfig.SignGetRequest,
    allow_unencrypted_assertion: false // SamlConfig.AllowUnencryptedAssertion
  };
  const idp = new saml2.IdentityProvider(idp_options);

  log.info("samlConfiguration success")
  return { sp, idp }
} catch (error) {
  log.error("Error in samlConfiguration => ", error)
  throw new Error(error)
}
}

module.exports.metaData = async (req, res) => {
  try {
  const { query } = req;
  const { orgId, authId, tier } = query;

  const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(orgId);
  const authProvider = await model.authProviders.getAuthProviderById(db, authId);
  const { sp } = await samlConfiguration(authProvider);
  
  res.type('application/xml');
  
  return res.send(sp.create_metadata());
} catch (error) {
  log.error("Error in saml metaData => ", error)
  return res.send(error)
}
}

module.exports.samlLogin = async (req, res, tier, authProvider, db) => {
  log.info("***** INIT SAML LOGIN *****")
  const { query } = req;
  const { orgId, redirectURI } = query;

  const { sp, idp } = await samlConfiguration(authProvider);

  const relaySate = { orgId, tier, authId: authProvider._id, redirectURI };

  log.info("samlLogin: relaySate", JSON.stringify(relaySate))
 
  log.info("samlLogin: relaySate", JSON.stringify(relaySate))
 
  sp.create_login_request_url(idp, { relay_state: `${JSON.stringify(relaySate)}` }, async function (err, login_url, request_id) {
    if (err != null) {
      await sendAuditLogs(db, req, err, {
        loginType: "SamlLogin",
        customerId: authProvider?.CustomerID,
      })
      log.error("Error in create_login_request_url", err)
      if(redirectURI) {
        return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
      } else {
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
      }
    }
    log.info("create_login_request_url Success:", login_url)
    return res.redirect(login_url);
  });
};

module.exports.samlExtract = async (req, res, db, authProvider) => {
  log.info("**** INIT samlExtract ****")
  const { body } = req;
  const { RelayState } = body;
  const { _id } = authProvider

  const { orgId, tier, redirectURI } = JSON.parse(RelayState || "{}");
  try {
    
    const { sp, idp } = await samlConfiguration(authProvider);
    const options = { request_body: body };

    sp.post_assert(idp, options, async function (err, saml_response) {
      log.error("post_assert err =>", err)
      log.info("post_assert saml_response =>", JSON.stringify(saml_response))
      if(err){
        let errorObject = {
          loginType: "SamlLogin",
          errorCode: err?.name,
          customerId: authProvider?.CustomerID,
        }
        if(err?.stack){
          const extracted = extractErrorCode(err?.stack);
          errorObject.errorCode = extracted?.errorCode
          errorObject['errorDescription'] = extracted?.errorDescription
        }
        await sendAuditLogs(db, req, err, errorObject)
      }
      if (err != null) {
        if(redirectURI) {
          return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
        } else {
          return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
        }
      }
      if (saml_response === undefined) {
        if(redirectURI) {
          return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
        } else {
          return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_SAML_PROVIDER_CONFIG]}&authType=saml`);
        }
      }

      let attributes = saml_response.user.attributes;
      const name_id = saml_response.user.name_id;

      log.info("samlExtract Mappping fields", authProvider.Mappings)
      const mappedData = mappingValues(attributes, authProvider.Mappings);
      const accountIdFromIdpRes = mappedData.Account ? mappedData.Account : null;
      const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: authProvider.CustomerID,
      });
      mappedData.AccountID = accountId;
      if(!mappedData.Username && !mappedData.PrimaryEmail) {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name_id)) {
          mappedData.PrimaryEmail = name_id;
          mappedData.Username = name_id;
        } else {
          mappedData.Username = name_id;
        }
      }
      const user = await model.users.findUserByUserName(db, mappedData.Username, orgId, _id);
      const hashId = generateCode(64);
      const idpGroupID = await getGroupIds(db, authProvider, mappedData);
      let defaultGroupId;
      if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProvider)
      }
      mappedData.GroupID = idpGroupID

      if (user) {
        log.info("user found ****", JSON.stringify(user))
        await updateUser({
          db,
          dbUser: user,
          hashId,
          mappedData,
          authProviderConfig: authProvider,
        });
      } else {
        const password = generateCode(50);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        mappedData.CustomerID = authProvider.CustomerID;
        mappedData.Email = [];
        mappedData.Tier = tier;
        mappedData.TenantDomain = orgId;
        mappedData.ApiKey = null;
        mappedData.Password = hashPassword;
        mappedData.Mfa = false;
        mappedData.MfaOption = {
          Email: false,
          Mobile: false
        };
        mappedData.ApprovedUser = true;
        mappedData.IsActive = true;
        mappedData.Tags = null;
        mappedData.IsDeleted = false;
        mappedData.LoginAttemptCount = 0;
        mappedData.HashID = hashId;
        mappedData.GenerationTimestamp = Date.now();
        mappedData.CardNumber = mappedData.CardNumber ? parseCardNumbers(mappedData.CardNumber): null;
        
        //delete mappedData.Role;
        delete mappedData.GroupName;
        mappedData.GroupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;

        const quotaBalance = await assignUserBalance(db, mappedData.GroupID)
        mappedData.DebitBalance = 0;
        mappedData.GroupQuotas = quotaBalance;
        assignAuthProviderID(null, mappedData, authProvider._id)
        await model.users.createUser(db, mappedData, orgId);
      }
      log.info("samlExtract: user created successfully")
      if(redirectURI) {
        return res.redirect(`${redirectURI}?hashId=${hashId}`);
      } else {
        //res.redirect(`http://admin.localhost:4200/user/sign-in?hashId=${hashId}`);
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?hashId=${hashId}`);
      }
    });
  } catch (error) {
    log.error("Error in samlExtract =>", error)
    await sendAuditLogs(db, req, error, {
      loginType: "SamlLogin",
      customerId: authProvider?.CustomerID,
    })
    return setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req);
  }
}

const mappingValues = (attributes, mapping) => {
  const result = {};
  for (const key in mapping) {
    const attribute_key = mapping[key];
    if (attribute_key && attributes[attribute_key]) {
      result[key] = attributes[attribute_key][0];
    } else {
      result[key] = null;
    }
  }
  return result;
};

// handling groupID function
const getGroupIds = async (db, authProvider, mappedData) => {
  const GroupName = authProvider.Mappings.GroupName;
  if (GroupName && mappedData.GroupName) {
    if (typeof mappedData.GroupName == "string") {
      const roles = mappedData.GroupName.split(",");
      const groupIds = [];
      for (const groupName of roles) {
          const group = await model.groups.getGroup(db, authProvider.CustomerID, groupName);
          if(group) {
            if (group.PrintConfigurationGroupID) {
              groupIds.push(group.PrintConfigurationGroupID)
            }
              groupIds.push(group._id)
          }
      }
      return groupIds.length > 0 ? groupIds : [];
    } else if (mappedData.GroupName.length > 0) {
      const roles = mappedData.GroupName;
      const groupIds = [];
      for (const groupName of roles) {
          const group = await model.groups.getGroup(db, authProvider.CustomerID, groupName);
          if(group) {
              groupIds.push(group._id)
          }
      }
      return groupIds.length > 0 ? groupIds : [];
    }
  }
  return [];
}


const extractErrorCode = (stackTrace) => {
  try {
    const errorDescriptionPattern = /:(.*)/;
    const errorCodePattern = /code: '(\S+)'/;

    let errorDescription = stackTrace?.match(errorDescriptionPattern);
    let errorCode = stackTrace?.match(errorCodePattern);

    return {
      errorDescription: errorDescription
        ? errorDescription[1]?.trim()
        : null,
      errorCode: errorCode ? errorCode[1] : "Error",
    };
  } catch (error) {
    return null;
  }
};
