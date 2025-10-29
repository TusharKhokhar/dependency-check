const cookie = require('cookie');
const { domainName } = require('../config/config')
const model = require('../models/index')
const ErrorConstant = require('../helpers/error-messages');
const ERROR = require('../helpers/error-keys')
const { STANDARD_TIER } = require('../helpers/constants');
const { getDb, isolatedDatabase } = require("../config/db");
const { setErrorResponse } = require('../services/api-handler');
const { performDecryption } = require("./../services/edService");
const { samlLogin, samlExtract } = require("./saml.controller");
const { oidcLogin, oidcCallback } = require("./oidc.controller");
const { ldaplogin } = require("./ldap.controller");
const { aadLogin, addCallback } = require("./aad.controller");
const { gsuiteLogin, gsuiteCallback } = require("./gsuite.controller");
const { innovativeLogin } = require("./innovative.controller");
const { sirsiLogin } = require("./sirsi.controller");
const { polarisLogin } = require("./polaris.controller");
const { sip2Login } = require('./sip2.controller');
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()
const {decryptText} = require("../services/encryptDecrypt");
const {securityInterceptor} = require("../helpers/securityCheck");
const { rsaDecrypt } = require('../helpers/utils');
const { wkpLogin } = require('./wkp.controller');


module.exports.redirectLogin = async (req, res) => {
    log.lambdaSetup(req, 'redirectLogin', 'common.controller')
    log.info('redirectLogin: query ', req.query)
    const { query } = req;
    const { authId, orgId, redirectURI } = query;
    let tier = STANDARD_TIER;

    try {
        //const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(orgId);
        let db = await getDb();
        await securityInterceptor( authId, orgId, redirectURI, db, res)
        const customer = await model.customers.findCustomerByDomainName(db, orgId);
        
        if(customer.Tier !== STANDARD_TIER) {
            tier = customer.Tier;
            db = await isolatedDatabase(orgId);
        }

        const provider = await model.authProviders.getAuthProviderById(db, authId);
        //console.log(authId, provider)

        if (!provider) {
            log.info("redirectLogin: provider not found")
            if(redirectURI) {
                return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
            } else {
                return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
            }
        }

        const decryptedIDPData = await performDecryption(provider);
        //console.log(decryptedIDPData)

        switch (decryptedIDPData.AuthProvider) {
            case 'oidc':
                await oidcLogin(req, res, tier, decryptedIDPData, db);
                break;
            case 'saml':
                await samlLogin(req, res, tier, decryptedIDPData, db);
                break;
            case 'azuread':
                await aadLogin(req, res, tier, decryptedIDPData, db);
                break;
            case 'gsuite':
                await gsuiteLogin(req, res, tier, decryptedIDPData, db);
                break;
            case 'externalCardValidation':
                await oidcLogin(req, res, tier, decryptedIDPData, db);
                break;
        }
    } catch (err) {
        log.error("Error in redirectLogin => ", err)
        if(redirectURI) {
            return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        }
    }
};

const decryptConfigData = async (provider) => {
    let providerConfigKey = '';

    switch (provider.AuthProvider) {
        case 'oidc':
            providerConfigKey = 'OpenIdConfig';
            break;
        case 'saml':
            providerConfigKey = 'SamlConfig';
            break;
        case 'ldap':
            providerConfigKey = 'LdapConfig';
            break;
        case 'azuread':
            providerConfigKey = 'AadConfig';
            break;
        case 'gsuite':
            providerConfigKey = 'GSuiteConfig';
    }
    const IDPConfig = provider[providerConfigKey];
    for(let key in IDPConfig) {
        IDPConfig[key] = await decryptText(IDPConfig[key])
    }
    provider[providerConfigKey] = IDPConfig;
    return provider;
}

module.exports.loginHandler = async (req, res) => {
    log.lambdaSetup(req, 'login', 'loginHandler')
    log.info('body ', req.body)
    const { headers, body } = req;
    const { orgId, authId } = body;
    const tier = headers.tier ? headers.tier : STANDARD_TIER;
    try {
        const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(orgId);
        const provider = await model.authProviders.getAuthProviderById(db, authId);
        if (!provider) {
            return setErrorResponse(null, ERROR.AUTH_PROVIDER_NOT_CONFIGURED, res, req);
        } else {
            await securityInterceptor( authId, orgId, null, db, res)
            const decryptedIDPData = await performDecryption(provider);
            switch (decryptedIDPData.AuthProvider) {
                case 'ldap':
                    await ldaplogin(req, res, db, decryptedIDPData);
                    break;
                case 'innovative':
                    await innovativeLogin(req, res, db, decryptedIDPData);
                    break;
                case 'sirsi':
                    await sirsiLogin(req, res, db, decryptedIDPData);
                    break;
                case 'polaris':
                    await polarisLogin(req, res, db, decryptedIDPData);
                    break;    
                case 'sip2':
                    await sip2Login(req, res, db, decryptedIDPData)
                    break; 
                case 'wkp':
                    await wkpLogin(req, res, db, decryptedIDPData)
                    break;   
            }
        }
    } catch (err) {
        log.error('catch err.......', err)
        return setErrorResponse(null, ERROR.INVALID_COMMON_PROVIDER_CONFIG, res, req);
    }
};

const extractAuthParams = (req) => {
  try {
    const { query } = req;
    log.info("extractAuthParams query :", JSON.stringify(query));
    const cookies = cookie.parse(req?.headers?.cookie || "");
    log.info("extractAuthParams cookies :", JSON.stringify(cookies));

    let authId = query.authId;
    let orgId = query.orgId;
    let tier = query.tier || STANDARD_TIER;
    let redirectURI = cookies?.fe_redirectURI;

    // Attempt to parse from `state` param
    if ((!authId || !orgId) && query.state) {
      try {
        log.info("*** Attempting to parse state param ***");
        const parsedData = rsaDecrypt(query.state);
        log.info("parsedStateData: ", parsedData);

        if (typeof parsedData === "object" && parsedData.authId) {
          authId = parsedData.authId;
          orgId = parsedData.orgId;
          redirectURI = parsedData.feRedirectURI;
        }
      } catch (err) {
        log.error("Failed to parse state param", err);
      }
    }

    // Attempt to parse from relayState cookie
    if (!orgId || !authId) {
      try {
        log.info("*** Attempting to parse relayState cookie ***");
        const relaySate = JSON.parse(req?.cookies?.relaySate || "{}");
        authId = relaySate?.authId;
        orgId = relaySate?.orgId;
        redirectURI = relaySate?.feRedirectURI;
      } catch (err) {
        log.error("Failed to parse relayState cookie", err);
      }
    }
    
    return { authId, orgId, tier, redirectURI };
  } catch (error) {
    log.error("Error extracting auth params: ", error);
    throw new Error("Error extracting auth params: " + error?.message);
  }
};

module.exports.redirectCallback = async (req, res) => {
    log.lambdaSetup(req, 'redirectCallback', 'common.controller')
    let authId, orgId, tier, redirectURI;
    try {
    const params = extractAuthParams(req);
    authId = params.authId;
    orgId = params.orgId;
    tier = params.tier;
    redirectURI = params.redirectURI;

    log.info("redirectCallback info", { orgId, authId, redirectURI })
    const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(orgId);
    const provider = await model.authProviders.getAuthProviderById(db, authId);
    //console.log(authId, provider)

    if (!provider) {
        log.error("redirectCallback: provider not found")
        if(redirectURI) {
            return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        }
    }
    await securityInterceptor( authId, orgId, redirectURI, db, res)
    const decryptedIDPData = await performDecryption(provider);

    switch (decryptedIDPData.AuthProvider) {
        case 'oidc':
            await oidcCallback(req, res, db, decryptedIDPData);
            break;
        case 'azuread':
            await addCallback(req, res, db, decryptedIDPData);
            break;
        case 'gsuite':
            await gsuiteCallback(req, res, db, decryptedIDPData);
            break;
        case 'externalCardValidation':
            await oidcCallback(req, res, db, decryptedIDPData);
            break;
    }
    } catch (error) {
        log.error('catch err in redirect callback.......', error)
        
        if (!res.headersSent) {
            return res.redirect(
                redirectURI
                    ? `${redirectURI}?error=${ErrorConstant[ERROR.BAD_REQUEST]}`
                    : `https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.BAD_REQUEST]}`
            );
        }
    }
};

module.exports.samlCallbackHandler = async (req, res) => {
    log.info("***** INIT SAML CALLBACK *****")
    log.info("samlCallbackHandler req body => ", req.body)
    const { body } = req;
    const { RelayState } = body;
    const { orgId, authId, tier, redirectURI } = JSON.parse(RelayState || "{}");
    try {
    log.info("samlCallbackHandler: RelayState", JSON.stringify(RelayState || "{}"))

    const db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(orgId);
    const provider = await model.authProviders.getAuthProviderById(db, authId);
    
    if (!provider) {
        log.error("samlCallbackHandler: provider not found")
        if(redirectURI) {
            return res.redirect(`${redirectURI}?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_COMMON_PROVIDER_CONFIG]}`)
        }
    }
    await securityInterceptor( authId, orgId, redirectURI, db, res)
    const decryptedIDPData = await performDecryption(provider);
    await samlExtract(req, res, db, decryptedIDPData);
    } catch (error) {
      log.error("samlCallbackHandler: An error occurred", error);
      if (!res.headersSent) {
        return res.redirect(
          `https://${orgId}.${domainName}/user/sign-in?error=internal_server_error&authType=saml`
        );
      }
    }
};