const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const { ConfidentialClientApplication, LogLevel }= require("@azure/msal-node")
const fs = require('fs');
const axios = require("axios")
const {sendAuditLogs} = require("../helpers/auditLog");
const publicKey = fs.readFileSync('./config/jwtRS256.key.pub', 'utf8');
const privateKey = fs.readFileSync('./config/jwtRS256.key', 'utf8');
const { domainName } = require('../config/config')
const model = require('../models/index')
const ErrorConstant = require('../helpers/error-messages');
const ERROR = require('../helpers/error-keys')
const { getDb, isolatedDatabase } = require("../config/db");
const {  generateCode, setPkceConfigs, assignUserBalance, isValidEmail, assignAuthProviderID, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID } = require('../helpers/utils')
const { STANDARD_TIER, AZURE_AD_AUTHORITY_HOST_URL, AZURE_AD_GRAPH_BASE_URL, AZURE_AD_FALLBACK_MAPPING } = require('../helpers/constants');
const ORIGIN = `https://api.${domainName}`; // 'http://localhost:3000/public'   `https://api.${domainName}`
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()
const scopes = ["user.read", "group.read.all"]

module.exports.aadLogin = async (req, res, tier, authProvider, db) => {
    log.info("***** INIT aadLogin *****")
  const { query } = req;
  const { orgId, authId, redirectURI } = query;
  log.info("aadLogin: query => ", query)
  try {
    const { AadConfig } = authProvider;

    const clientId = AadConfig.ClientId;
    const tenantId = AadConfig.TenantId;
    const clientSecret = AadConfig.ClientSecret;

    const redirectUri = `${ORIGIN}/auth/callback`;

    const { pkceCodeVerifier } = await setPkceConfigs();

    const encryptToken = encryptData(pkceCodeVerifier);
    const options = {
        httpOnly: true,
        maxAge: 60000 * 15 // 15 minutes in milliseconds
    }
    res.cookie("authstate", encryptToken, options);
    const relaySate = { orgId, tier, authId, feRedirectURI: redirectURI };
    res.cookie("relaySate", JSON.stringify(relaySate), options);

    const cca = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `${AZURE_AD_AUTHORITY_HOST_URL}/${tenantId}`,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            log.info(message);
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Verbose,
        },
      },
    });
    const authorizationUrl = await cca.getAuthCodeUrl({
      redirectUri: redirectUri,
      state: encryptToken,
      scopes,
    });
    log.info("authorizationUrl===", authorizationUrl)
    return res.redirect(authorizationUrl);
  } catch (error) {
    log.error("Error in aadLogin : ", error)
    await sendAuditLogs(db, req, error, {
        loginType: "AzureadLogin",
        errorCode: error?.code,
        customerId: authProvider?.CustomerID,
    })
    if (redirectURI) {
      return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_AAD_PROVIDER_CONFIG]}`);
    } else {
      return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_AAD_PROVIDER_CONFIG]}`);
    }
  }
};

const encryptData = (str) => {
    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(str.toString())
    );
    return encryptedData.toString("base64");
}

const decryptData = (str) => {
    const buf = Buffer.from(str, 'base64');
    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        buf
    );
    return decryptedData.toString();
}

module.exports.addCallback = async (req, res, db, authProvider) => {
    log.info("***** INIT AZUREAD CALLBACK *****")
    const { state, code } = req.query;

    const _state = state.replace(new RegExp(escapeRegExp(' '), 'g'), '+');

    const decryptedState = decryptData(_state);

    const decryptedAuthState = decryptData(req.cookies.authstate);

    if (decryptedAuthState !== decryptedState) {
        return res.send('error: state does not match');
    }
    const relaySate = JSON.parse(req.cookies.relaySate);
    log.info("addCallback: relaySate", JSON.stringify(relaySate))
    
    const { orgId, tier, feRedirectURI } = relaySate;

    const { AadConfig } = authProvider;
    const clientId = AadConfig.ClientId;
    const clientSecret = AadConfig.ClientSecret;
    const tenantId = AadConfig.TenantId;

    const authorityUrl = AZURE_AD_AUTHORITY_HOST_URL + '/' + tenantId;
    const redirectUri = `${ORIGIN}/auth/callback`;

    const cca = new ConfidentialClientApplication({
        auth: {
            clientId,
            clientSecret,
            authority: authorityUrl
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message, containsPii) {
                    log.info(message);
                },
                piiLoggingEnabled: false,
                logLevel: LogLevel.Verbose,
            }
        }
    });

    const tokenRequest = {
      code,
      scopes,
      redirectUri: redirectUri,
    };

    cca.acquireTokenByCode(tokenRequest)
        .then(async (response) => {
            log.info("response ***", JSON.stringify(response))
            const userInfo = await getUserInfo(response.accessToken);
            const groupInfo = await getGroupsInfo(response.accessToken)
            if (groupInfo && groupInfo.value) {
                userInfo['groups'] = groupInfo.value
            } else {
                userInfo['groups'] = []
            }
            await getRedirectPayload(orgId, tier, feRedirectURI, db, authProvider, userInfo, res);
        })
        .catch(async (error) => {
            log.error("Errror acquireTokenByCode ==>", error);
            const errorMsg = ErrorConstant[error] ? ErrorConstant[error]: error.message
            await sendAuditLogs(db, req, error, {
                loginType: "AzureadLogin",
                errorCode: error?.errorCode,
                errorDescription: errorMsg,
                customerId: authProvider?.CustomerID,
            })
            if (feRedirectURI) {
                return res.redirect(`${feRedirectURI}?error=${errorMsg}&authType=azuread`);
            } else {
                return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${errorMsg}&authType=azuread`);
            }
        });

}

const getUserInfo = async (accessToken) => {
  try {
    const response = await axios(`${AZURE_AD_GRAPH_BASE_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    log.info("response.data====", JSON.stringify(response.data))
    return response.data;
  } catch (error) {
    log.error("Error getUserInfo ====>", error);
    throw ERROR.UNABLE_TO_FIND_USER_DETAILS;
  }
};

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const getValue = (response, primaryField) => {
    const fallbackMapping = AZURE_AD_FALLBACK_MAPPING
    // Get the value from the primary field
    let value = response[primaryField];

    // If value is not found, check the fallback mapping
    if (!value && fallbackMapping[primaryField]) {
        value = response[fallbackMapping[primaryField]];
    }
    return value || null;
}

const getRedirectPayload = async (orgId, tier, feRedirectURI, db, authProviderConfig, payload, res) => {
    log.info("addCallback payload =>", JSON.stringify(payload))
    const { Mappings, CustomerID, _id } = authProviderConfig;
    log.info("addCallback Mappping fields", Mappings)

    let email = Mappings['PrimaryEmail'] ? getValue(payload, Mappings.PrimaryEmail) : null;
    const _username = Mappings["Username"] ? getValue(payload, Mappings.Username) : null;
    if (email && Mappings.PrimaryEmail === "userId" && !isValidEmail(email)) {
        email = payload.mail ? payload.mail: null
    }
    const username = _username ? _username : email;
    const accountIdFromIdpRes = Mappings.Account && payload[Mappings.Account] ? payload[Mappings.Account] : null;

    if (!username) {
        log.info("addCallback: username not found")
        if(feRedirectURI) {
            return res.redirect(`${feRedirectURI}?error=${ErrorConstant[ERROR.USER_NOT_FOUND]}`)
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.USER_NOT_FOUND]}`)
        }
    }

    if (!db) {
        log.info("Created DB again..........");
        if (tier !== STANDARD_TIER) {
            db = await isolatedDatabase(requesterDomain);
        } else {
            db = await getDb();
        }
    }

    let firstName = null
    let lastName = null
    if (payload.displayName) {
        let parts = payload.displayName.trim().split(' ');
        firstName = parts[0];
        if (parts.length > 1) {
            lastName = parts.pop();
        }
    }
    const _lastName = Mappings.LastName ? getValue(payload, Mappings.LastName) : lastName
    
    const user = await model.users.findUserByUserName(db, username, orgId, _id)
    const idpGroupID = await getGroupIds(db, payload, authProviderConfig);
    let defaultGroupId;
    if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProviderConfig)
    }
    const hashId = generateCode(64);
    const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: CustomerID,
    });
    const mappedData = {
        PrimaryEmail: email,
        FirstName: Mappings.FirstName && payload[Mappings.FirstName] ? payload[Mappings.FirstName] : firstName,
        LastName: _lastName,
        CardNumber: Mappings.CardNumber && payload[Mappings.CardNumber] ? payload[Mappings.CardNumber] : null,
        Mobile: Mappings.Mobile ? getValue(payload, Mappings.Mobile) : null,
        GroupID: idpGroupID,
        AccountID: accountId,
    }
    log.info("mappedData ****", JSON.stringify(mappedData))
    if (user) {
        log.info("user found ****", JSON.stringify(user))
        await updateUser({db, dbUser: user, hashId, mappedData, authProviderConfig});
    } else {
        const password = generateCode(50);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const groupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;

        const _user = {
            CustomerID: CustomerID,
            PrimaryEmail: mappedData.PrimaryEmail,
            Username: username,
            Email: [],
            GroupID: groupID,
            CardNumber: mappedData.CardNumber ? parseCardNumbers(mappedData.CardNumber) : null,
            Mobile: mappedData.Mobile,
            Tier: tier,
            TenantDomain: orgId,
            ApiKey: null,
            Password: hashPassword,
            FirstName: mappedData.FirstName,
            LastName: mappedData.LastName,
            Mfa: false,
            MfaOption: {
                Email: false,
                Mobile: false
            },
            ApprovedUser: true,
            IsActive: true,
            Tags: [],
            IsDeleted: false,
            LoginAttemptCount: 0,
            HashID: hashId,
            GenerationTimestamp: Date.now()
        }
        if (mappedData.AccountID){
            _user.AccountID = mappedData.AccountID
        }
        assignAuthProviderID(null, _user, _id)
        const quotaBalance = await assignUserBalance(db, groupID)
        _user.DebitBalance = 0;
        _user.GroupQuotas = quotaBalance;
        await model.users.createUser(db, _user, orgId);
    }
    log.info("addCallback: user created successfully")
    
    if(feRedirectURI) {
        return res.redirect(`${feRedirectURI}?hashId=${hashId}`)
    } else {
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?hashId=${hashId}`);
    }
}

const getGroupsInfo = async (accessToken) => {
    try {
        const response = await axios(`${AZURE_AD_GRAPH_BASE_URL}/me/memberOf`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
        });
        log.info("getGroupsInfo Success", JSON.stringify(response.data));
        return response.data;
    } catch (err) {
        log.error("Error getGroupsInfo ====>", err);
        throw ERROR.UNABLE_TO_FIND_GROUPS;
    }
}

const getGroupIds = async (db, payload, authProviderConfig) => {
    const { Mappings, CustomerID } = authProviderConfig;
    if(!Mappings.GroupName || payload.groups.length == 0) {
        return [];
    }
    const groupIds = [];
    for (const group of payload.groups) {
        const groupName = group[Mappings.GroupName]
        if (groupName) {
            const dbGroup = await model.groups.getGroup(db, CustomerID, groupName);
            if(dbGroup) {
                if (dbGroup.PrintConfigurationGroupID) {
                    groupIds.push(dbGroup.PrintConfigurationGroupID)
                }
                groupIds.push(dbGroup._id)
                break;
            }
        }
    }
    return groupIds.length > 0 ? groupIds : [];
}
