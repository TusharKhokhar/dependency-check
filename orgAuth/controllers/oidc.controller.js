// eslint-disable-next-line import/no-extraneous-dependencies
// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const cookie = require('cookie');
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const JsonWebToken = require('jsonwebtoken');
const QueryString = require('querystring');
const axios = require("axios");
const fs = require('fs');
const {sendAuditLogs} = require("../helpers/auditLog");
const publicKey = fs.readFileSync('./config/jwtRS256.key.pub', 'utf8');
const privateKey = fs.readFileSync('./config/jwtRS256.key', 'utf8');
const { domainName } = require('../config/config');
const { getDb, isolatedDatabase } = require("../config/db");
const { setDiscoveryDocument, setJwks, generateCode, assignUserBalance, assignAuthProviderID, updateUser, parseCardNumbers, getNonceAndHash, validateNonce, rsaEncrypt, rsaDecrypt, findOrCreateAccount, defaultGroupID } = require("../helpers/utils");
const ERROR = require('../helpers/error-keys');
const ErrorConstant = require('../helpers/error-messages')
const { handleInvalidQueryString } = require("../helpers/errorHandler");
const model = require('../models/index');
const { getOidcRedirectPayload } = require("../services/oidc.service");
const { STANDARD_TIER } = require('../helpers/constants');
const ORIGIN = `https://api.${domainName}`; // 'http://localhost:3000/public'   `https://api.${domainName}`
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

const getOidcBasicConfig = (OpenIdConfig) => {
    const oidcBasicConfig = {
        client_id: OpenIdConfig.ClientID,
        redirect_uri: `${ORIGIN}/auth/callback`
    }
    return oidcBasicConfig;
}

const getOidcState = (authId, orgId, tier)=> {
    const state = {
        authId: authId,
        orgId: orgId,
        tier: tier,
    }
    return rsaEncrypt(state);
}

const attachAdditionalParameter = (authRequest, openIdConfig) => {
  if (openIdConfig?.MaxAge !== undefined && openIdConfig?.MaxAge !== null) {
    authRequest["max_age"] = openIdConfig.MaxAge;
  }
  if (openIdConfig?.AcrValues) {
    authRequest["acr_values"] = openIdConfig.AcrValues.replaceAll(",", " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (openIdConfig?.Prompt && openIdConfig?.Prompt.length) {
    authRequest["prompt"] = openIdConfig.Prompt.join(" ");
  }
  if (openIdConfig?.Display) {
    authRequest["display"] = openIdConfig.Display;
  }
};

const attachCustomParameter = (authRequest, provider, query) => {
  log.info(
    "***** attachCustomParameter CustomFields *****",
    JSON.stringify(provider?.CustomFields)
  );
  log.info("***** attachCustomParameter query*****", query);
  if (provider?.CustomFieldsEnabled && Array.isArray(provider?.CustomFields)) {
    provider.CustomFields.forEach((field) => {
      const { FieldName, FieldValue, FieldType } = field;

      if (!FieldName) return;

      if (FieldType === "static") {
        authRequest[FieldName] = FieldValue;
      } else if (FieldType === "dynamic" && query?.[FieldValue]) {
        authRequest[FieldName] = query[FieldValue];
      }
    });
  }
}; 

const getIdpConfig = (provider) => {
  if (provider.AuthProvider === "oidc") {
    return { OpenIdConfig: provider.OpenIdConfig };
  }
  if (provider.AuthProvider === "externalCardValidation") {
    const config = provider.ExternalCardValidationConfig;
    config.ClientID = provider.ExternalCardValidationConfig.ClientId;
    config.CustomAuthorizationEndpoint =
      provider?.ExternalCardValidationConfig?.AuthorizationEndpoint || "";
    return {
      OpenIdConfig: config,
    };
  }
};

module.exports.oidcLogin = async (req, res, tier, provider, db) => {
    const { query } = req;
    const { orgId, redirectURI } = query;
    log.info("***** INIT OIDC LOGIN *****")
    try {
        const { OpenIdConfig } = getIdpConfig(provider);
        const defaultScop = "openid profile email";
        const additionalScope = OpenIdConfig?.AdditionalScope?.replaceAll(',', ' ').replace(/\s+/g, ' ').trim();

        // Combine both scopes and remove duplicates
        const scope = new Set([...defaultScop.split(' '), ...additionalScope ? additionalScope.split(' ') : []]);

        const discoveryDocument = await setDiscoveryDocument(OpenIdConfig.DiscoveryDocument);
        const { client_id, redirect_uri } = getOidcBasicConfig(OpenIdConfig);
        log.info("oidcLogin: redirect_uri => ", redirect_uri)
        const state = getOidcState(provider._id, orgId, tier);
        const { hash, nonce } = getNonceAndHash()
        const encryptedNonce = rsaEncrypt(nonce);

        const authRequest = {
            client_id: client_id,
            redirect_uri: redirect_uri,
            response_type: [ "code" ],
            scope: [...scope].join(' '),
            state: state,
        };
        if (OpenIdConfig.NonceEnabled) {
          authRequest.nonce = hash;
        }

        attachAdditionalParameter(authRequest, OpenIdConfig)
        attachCustomParameter(authRequest, provider, query)

        log.info("OIDC authRequest======***", authRequest)

        const authorizationEndpoint = OpenIdConfig?.CustomAuthorizationEndpoint
          ? OpenIdConfig.CustomAuthorizationEndpoint
          : discoveryDocument.authorization_endpoint;

        log.info("authorizationEndpoint **", authorizationEndpoint)
        
        const { redirectUri, pkceCodeVerifier } = await getOidcRedirectPayload(authRequest, authorizationEndpoint);
        log.info("oidcLogin: redirectUri => ", redirectUri)

        const encryptedData = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(pkceCodeVerifier.toString())
        );
        const pkceToken = encryptedData.toString("base64");
        const options = {
            httpOnly: true,
            maxAge: 900 // 15 minutes in seconds
        }
        const cookieList = [
            cookie.serialize("pkceToken", pkceToken, options),
            cookie.serialize("fe_redirectURI", redirectURI, options),
        ];
        if (OpenIdConfig.NonceEnabled) {
            cookieList.push(cookie.serialize("nonce", encryptedNonce, options));
        }
        res.setHeader("Set-Cookie", cookieList);
        return res.redirect(redirectUri)
    } catch (err) {
        log.error("Error in oidcLogin => ", err)
        await sendAuditLogs(db, req, err, {
            loginType: "OidcLogin",
            errorCode: err?.code,
            customerId: provider?.CustomerID,
        })
        if(redirectURI) {
            return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`);
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`)
        }
    }
};

const verifyNonce = (decodedToken, nonce) => {
  if (!decodedToken?.payload?.nonce) {
    return false;
  }
  const originalNonce = rsaDecrypt(nonce);
  const verified = validateNonce(originalNonce, decodedToken.payload.nonce);
  return verified;
};

module.exports.oidcCallback = async (req, res, db, authProviderConfig) => {
    try {
        log.info("***** INIT OIDC CALLBACK *****")
        const cookies = cookie.parse(req.headers.cookie || '');
        const pkceToken = cookies.pkceToken;
        const fe_redirectURI = cookies.fe_redirectURI;
        const nonce = cookies.nonce;
        const buf = Buffer.from(pkceToken, 'base64');
        const decryptedData = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            buf
        );
        const code_verifier = decryptedData.toString()
        
        const { query, path } = req;
        const { code, error } = query;
        const { OpenIdConfig } = getIdpConfig(authProviderConfig);
        const orgId = authProviderConfig.OrgID;
        const discoveryDocument = await setDiscoveryDocument(OpenIdConfig.DiscoveryDocument);

        log.info("oidcCallback query info:", {
            fe_redirectURI,
            path,
            error
        })

        if (path === "/callback") {
            if (error) {
                const errorResponse = handleInvalidQueryString({ error });
                log.error("Error in oidcCallback => ", errorResponse)
                if(fe_redirectURI) {
                    return res.redirect(`${fe_redirectURI}?error=${errorResponse.error}&authType=oidc`);
                } else {
                    return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${errorResponse.error}&authType=oidc`)
                }
            }
            if (code === undefined || code === null) {
                log.error("Error in oidcCallback => code not found")
                if(fe_redirectURI) {
                    return res.redirect(`${fe_redirectURI}?error=no-code&authType=oidc`);
                } else {
                    return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=no-code&authType=oidc`)
                }
            }
            await getNewJwtResponse({ req, res, db, authProviderConfig, discoveryDocument, code_verifier, fe_redirectURI, nonce });
        }
    } catch (error) {
        log.error("oidcCallback error ***", error)
        await sendAuditLogs(db, req, error, {
            loginType: "OidcLogin",
            errorCode: error?.code,
            customerId: authProviderConfig?.CustomerID,
        })
        throw error;
  }
};

const getNewJwtResponse = async ({ req, res, db, authProviderConfig, discoveryDocument, code_verifier, fe_redirectURI, nonce }) => {
    const jwks = await setJwks(discoveryDocument);
    log.info("setJwks success", jwks)
    const { OpenIdConfig } = getIdpConfig(authProviderConfig);
    const { headers, query } = req;
    const { tier, code } = query;
    const orgId = authProviderConfig.OrgID;

    try {
        const { client_id, redirect_uri } = getOidcBasicConfig(OpenIdConfig, authProviderConfig._id, orgId, tier);
        const tokenRequest = {
            client_id: client_id,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code",
            client_secret: OpenIdConfig.ClientSecret,
            code: code,
            code_verifier: code_verifier,
        }

        const { decodedToken } = await getIdAndDecodedToken(tokenRequest, discoveryDocument, req, db, authProviderConfig)
        log.info("oidc decodedToken====", JSON.stringify(decodedToken))
        if (OpenIdConfig.NonceEnabled) {
            const verified = verifyNonce(decodedToken, nonce);
            if (!verified) {
                await sendAuditLogs(db, req, "Nonce verification failed during OIDC login", {
                    loginType: "OidcLogin",
                    customerId: authProviderConfig?.CustomerID,
                })
                if (fe_redirectURI) {
                    return res.redirect(`${fe_redirectURI}?error=${ErrorConstant[ERROR.UNAUTHORIZED]}`);
                } else {
                    return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.UNAUTHORIZED]}`)
                } 
            }
        }    
        const rawPem = await jwks.keys.filter((k) => k.kid === decodedToken.header.kid)[0];
        if (rawPem === undefined) {
            log.info("unable to find expected pem in jwks keys")
            if(fe_redirectURI) {
                return res.redirect(`${fe_redirectURI}?error=unknown&authType=oidc`);
            } else {
                return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unknown&authType=oidc`)
            }
        }
        try {
            await getRedirectPayload({ req, db, authProviderConfig, decodedToken, res, fe_redirectURI });
        } catch (err) {
            log.error("getNewJwtResponse: JWT error", err)
            await sendAuditLogs(db, req, err, {
                loginType: "OidcLogin",
                errorCode: err?.code,
                customerId: authProviderConfig?.CustomerID,
            })
            if (err === undefined || err === null || err.name === undefined || err.name === null) {
                log.error('unknown named JWT error, unauthorized.', err);
                if(fe_redirectURI) {
                    return res.redirect(`${fe_redirectURI}?error=unknown&authType=oidc`);
                } else {
                    return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unknown&authType=oidc`)
                }
            }
            switch (err.name) {
                case 'TokenExpiredError':
                    log.error('token expired, redirecting to OIDC provider', err);
                    const response = getOidcRedirectPayload(req, headers); // need to correct here
                    res.redirect(response)
                    break
                case 'JsonWebTokenError':
                    log.error('jwt error, unauthorized', err)
                    if(fe_redirectURI) {
                        res.redirect(`${fe_redirectURI}?error=jwt_error&authType=oidc`);
                    } else {
                        res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=jwt_error&authType=oidc`)
                    }
                    break
                default:
                    log.error('Unauthorized. User is not permitted')
                    if(fe_redirectURI) {
                        res.redirect(`${fe_redirectURI}?error=unauthorized&authType=oidc`);
                    } else {
                        res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unauthorized&authType=oidc`)
                    }
            }
        }
    } catch (error) {
        log.error("Error in getNewJwtResponse", error)
        await sendAuditLogs(db, req, error, {
            loginType: "OidcLogin",
            errorCode: error?.code,
            customerId: authProviderConfig?.CustomerID,
        })
        if(fe_redirectURI) {
            return res.redirect(`${fe_redirectURI}?error=internal_server_error&authType=oidc`);
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=internal_server_error&authType=oidc`)
        }
    }
}

const getIdAndDecodedToken = async (tokenReq, discoveryDocument, req, db, authProvider) => {
    try {
        let tokenRequest = QueryString.stringify(tokenReq);
        const response = await axios.post(discoveryDocument.token_endpoint, tokenRequest);
        const decodedToken = JsonWebToken.decode(response.data.id_token, {
            complete: true
        })
        log.info("getIdAndDecodedToken Success", JSON.stringify(response?.data))
        return { idToken: response.data.id_token, decodedToken };
    } catch (error) {
        await sendAuditLogs(db, req, error, {
            loginType: "OidcLogin",
            errorCode: error?.response?.data?.error,
            errorDescription: error?.response?.data?.error_description,
            customerId: authProvider?.CustomerID,
        })
        log.error("Error in getIdAndDecodedToken", error)
        throw new Error(error)
    }
}
/*
// verifyJwt wraps the callback-based JsonWebToken.verify function in a promise.
async function verifyJwt(token, pem, algorithms) {
    return new Promise((resolve, reject) => {
        JsonWebToken.verify(token, pem, algorithms, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            return resolve(decoded);
        });
    });
}
*/

// getRedirectPayload gets the actual 302 redirect payload
async function getRedirectPayload({ req, db, authProviderConfig, decodedToken, res, fe_redirectURI }) {
    const { query } = req;
    const { tier } = query;
    const { payload } = decodedToken;
    log.info("*** oidcCallback:getRedirectPayload payload ****", JSON.stringify(payload))
    const { Mappings, _id, AssociatedIdentityProvider } = authProviderConfig;
    log.info("oidcCallback Mappping fields", Mappings)
    const orgId = authProviderConfig.OrgID;
    try {
    const email = Mappings.PrimaryEmail && payload[Mappings.PrimaryEmail] ? payload[Mappings.PrimaryEmail] : null;
    const _username = Mappings.Username && payload[Mappings.Username] ? payload[Mappings.Username] : null;
    const username = _username ? _username : email; //generateUsername(email);
    const accountIdFromIdpRes = Mappings.Account && payload[Mappings.Account] ? payload[Mappings.Account] : null;

    if (!username) {
        log.error("*** oidcCallback:getRedirectPayload Username not found ***")
        if(fe_redirectURI) {
            return res.redirect(`${fe_redirectURI}?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`);
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`)
        }
    }

    // Extract full name once and use it for both new and existing users
    const fullName = payload.name ? payload.name : payload.nickname;
    const fullNameArr = fullName ? fullName.split(' ') : (username ? username.split(' ') : []);
   
    const first_name = Mappings.FirstName && payload[Mappings.FirstName]
               ? payload[Mappings.FirstName]
               : (fullNameArr.length > 0 ? fullNameArr[0] : null);
   
    const last_name = Mappings.LastName && payload[Mappings.LastName]
               ? payload[Mappings.LastName]
               : (fullNameArr.length > 1 && fullNameArr[fullNameArr.length - 1] !== fullNameArr[0]
                   ? fullNameArr[fullNameArr.length - 1]
                   : null);

    if (!db) {
        log.info("Created DB again..........");
        if (tier !== STANDARD_TIER) {
            db = await isolatedDatabase(requesterDomain);
        } else {
            db = await getDb();
        }
    }
   
    let authProviderID = _id;
    if (authProviderConfig.AuthProvider === "externalCardValidation") {
      authProviderID = AssociatedIdentityProvider;
    }
    
    const user = await model.users.findUserByUserName(db, username, orgId, authProviderID)
    const idpGroupID = await getGroupIds(db, payload, authProviderConfig);
    let defaultGroupId;
    if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProviderConfig)
    }
    const hashId = generateCode(64);
    const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: authProviderConfig.CustomerID,
    });
    const mappedData = {
        PrimaryEmail: email,
        FirstName: first_name,
        LastName: last_name,
        CardNumber: Mappings.CardNumber && payload[Mappings.CardNumber] ? payload[Mappings.CardNumber] : null,
        Mobile: Mappings.Mobile && payload[Mappings.Mobile] ? payload[Mappings.Mobile] : null,
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
            CustomerID: authProviderConfig.CustomerID,
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
        if (authProviderConfig.AuthProvider === "externalCardValidation") {
            assignAuthProviderID(null, _user, authProviderConfig.AssociatedIdentityProvider)
        } else {
            assignAuthProviderID(null, _user, authProviderConfig._id)
        }
        const quotaBalance = await assignUserBalance(db, groupID)
        _user.DebitBalance = 0;
        _user.GroupQuotas = quotaBalance;
        await model.users.createUser(db, _user, orgId);
    }
    log.info("oidcCallback: user created successfully")
    if(fe_redirectURI) {
        return res.redirect(`${fe_redirectURI}?hashId=${hashId}`);
    } else {
        //res.redirect(`http://admin.localhost:4200/user/sign-in?hashId=${hashId}`);
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?hashId=${hashId}`);
    }   
    } catch (error) {
        log.error("Error getRedirectPayload ***", error)

        if(fe_redirectURI) {
            return res.redirect(`${fe_redirectURI}?error=${ErrorConstant[ERROR.BAD_REQUEST]}`);
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.BAD_REQUEST]}`)
        }
    }
}

// not in use
const getUserName = async (db, payload, mappings, orgId) => {
    const _username = payload[mappings.Username] ? payload[mappings.Username] : payload[mappings.PrimaryEmail]; //generateUsername(payload.email);
    const tempUsername = await model.users.findUserByUserName(db, _username, orgId);
    return tempUsername ? `${_username}${Math.floor(Math.random() * 3)}` : tempUsername;
}

const getGroupIds = async (db, payload, authProviderConfig) => {
    const { Mappings, CustomerID } = authProviderConfig;
    try {
        if(!Mappings.GroupName || !payload[Mappings.GroupName] || payload[Mappings.GroupName].length == 0) {
            return []
        }
        const role = payload[Mappings.GroupName];
        if (typeof role == "string") {
            const roles = role.split(',').map(r => r.trim());
            const groupIds = [];
            for (const groupName of roles) {
                const group = await model.groups.getGroup(db, CustomerID, groupName);
                if(group) {
                    if (group.PrintConfigurationGroupID) {
                        groupIds.push(group.PrintConfigurationGroupID)
                    }
                    groupIds.push(group._id)
                }
            }
            return groupIds.length > 0 ? groupIds : [];
        } else if (role.length > 0) { // if not string then it means array
            const roles = role;
            const groupIds = [];
            for (const groupName of roles) {
                const group = await model.groups.getGroup(db, CustomerID, groupName);
                if(group) {
                    if (group.PrintConfigurationGroupID) {
                        groupIds.push(group.PrintConfigurationGroupID)
                    }
                    groupIds.push(group._id)
                }
            }
            return groupIds.length > 0 ? groupIds : [];
        }
    } catch (error) {
        log.error("error found in oidc get group id",error);
        throw new Error(error)
    }
}