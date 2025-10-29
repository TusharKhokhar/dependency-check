//const { google } = require('googleapis');
const cookie = require('cookie');
const { OAuth2Client } = require('google-auth-library');
const JsonWebToken = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {sendAuditLogs} = require("../helpers/auditLog");
const { domainName } = require('../config/config')
const model = require('../models/index')
const ErrorConstant = require('../helpers/error-messages');
const ERROR = require('../helpers/error-keys')
const { getDb, isolatedDatabase } = require("../config/db");
const {  generateCode, assignUserBalance, assignAuthProviderID, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID } = require('../helpers/utils');
const { STANDARD_TIER, GSUITE_USER_EMAIL_SCOPE, GSUITE_USER_PROFILE_SCOPE } = require('../helpers/constants');
const ORIGIN = `https://api.${domainName}`; // 'http://localhost:3000/public'   `https://api.${domainName}`
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.gsuiteLogin = async (req, res, tier, authProvider, db) => {
    try {
        log.info("***** INIT GSUITE LOGIN *****")
        const { query } = req;
        const { orgId, authId, redirectURI } = query;
        log.info("gsuiteLogin: query => ", query)
        const { GSuiteConfig } = authProvider;
        
        const CLIENT_ID = GSuiteConfig.ClientId;
        const CLIENT_SECRET = GSuiteConfig.ClientSecret;
        const REDIRECT_URL = `${ORIGIN}/auth/callback`; // /auth/gsuite/callback?orgId=${orgId}&authType=${authType}&tier=${tier}&redirectURI=${redirectURI}
        const SCOPES = [
            GSUITE_USER_EMAIL_SCOPE,
            GSUITE_USER_PROFILE_SCOPE
        ];

        const oauth2Client = new OAuth2Client( //new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URL
        );

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
            scope: SCOPES, // If you only need one scope you can pass it as a string
            prompt: 'consent' // Set the prompt parameter to consent
        });

        //google.options({auth: oauth2Client});
        const options = {
            httpOnly: true,
            maxAge: 60000 * 15 // 15 minutes in milliseconds
        }
        const relaySate = JSON.stringify({ orgId, tier, authId, feRedirectURI: redirectURI });
        res.cookie('relaySate', relaySate, options)
        log.info("url====", url);
        return res.redirect(url);
    } catch (error) {
        log.error("gsuiteLogin error =>", error)
        await sendAuditLogs(db, req, error, {
            loginType: "GsuiteLogin",
            errorCode: error?.code,
            customerId: authProvider?.CustomerID,
        })
    }
}
//module.exports.gsuiteCallback = async (req, res) => {
module.exports.gsuiteCallback = async (req, res, db, authProvider) => {
    log.info("***** INIT GSUITE CALLBACK *****")
    const { code } = req.query; // orgId, authType, tier, redirectURI, 
    const cookies = cookie.parse(req.headers.cookie || '');
    const relaySate = JSON.parse(cookies.relaySate);
    log.info("gsuiteCallback: relaySate", JSON.stringify(relaySate))
    const { orgId, tier } = relaySate;
    const redirectURI = relaySate.feRedirectURI
    
    const { GSuiteConfig } = authProvider;
    
    const CLIENT_ID = GSuiteConfig.ClientId;
    const CLIENT_SECRET = GSuiteConfig.ClientSecret;
    const REDIRECT_URL = `${ORIGIN}/auth/callback`; //?orgId=${orgId}&authType=${authType}&tier=${tier}&redirectURI=${redirectURI}

    const oauth2Client = new OAuth2Client( //new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URL
    );

    //google.options({auth: oauth2Client});

    try {
        const response = await oauth2Client.getToken(code)
        const { decodedToken } = await getIdAndDecodedToken(response.tokens);
        log.info("gsuite decodedToken ***", JSON.stringify(decodedToken))
        /*const tokenInfo = await oauth2Client.getTokenInfo(
            response.tokens.access_token
        );
        console.log(tokenInfo);*/
        //console.log(decodedToken)
        log.info("gsuiteCallback getToken success")
        await getRedirectPayload(orgId, tier, redirectURI, db, authProvider, decodedToken.payload, res)
    } catch (err) {
        await sendAuditLogs(db, req, err, {
            loginType: "GsuiteLogin",
            errorCode: err?.code,
            errorDescription: err?.response?.data?.error_description,
            customerId: authProvider?.CustomerID,
        })
        log.error("gsuiteCallback: getToken Error", err)
        return res.send(code);
    }
}

const getIdAndDecodedToken = async (tokens) => {
    const decodedToken = JsonWebToken.decode(tokens.id_token, {
        complete: true
    })
    return { idToken: tokens.id_token, decodedToken };
}

const getRedirectPayload = async (orgId, tier, feRedirectURI, db, authProviderConfig, payload, res) => {
    log.info("*** gsuiteCallback:getRedirectPayload payload ****", JSON.stringify(payload))
    const { Mappings, CustomerID, _id } = authProviderConfig;
    log.info("gsuiteCallback Mappping fields", Mappings)
    const email = Mappings.PrimaryEmail && payload[Mappings.PrimaryEmail] ? payload[Mappings.PrimaryEmail] : null;
    const _username = Mappings.Username && payload[Mappings.Username] ? payload[Mappings.Username] : null;
    const username = _username ? _username : email; //generateUsername(email);
    const fullName = payload.name ? payload.name : payload.nickname;
    const fullNameArr = fullName ? fullName.split(' ') : username.split(' ');
    const first_name = Mappings.FirstName && payload[Mappings.FirstName] ? payload[Mappings.FirstName] : fullNameArr[0];
    const last_name = Mappings.LastName && payload[Mappings.LastName] ? payload[Mappings.LastName] : (fullNameArr[fullNameArr.length - 1] == fullNameArr[0] ? null : fullNameArr[fullNameArr.length - 1]);
    const accountIdFromIdpRes = Mappings.Account && payload[Mappings.Account] ? payload[Mappings.Account] : null;

    if (!username) {
        log.error("*** gsuiteCallback:getRedirectPayload Username not found ***")
        if(feRedirectURI) {
            return res.redirect(`${feRedirectURI}?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`)
        } else {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=${ErrorConstant[ERROR.INVALID_OIDC_PROVIDER_CONFIG]}`)
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
    
    const user = await model.users.findUserByUserName(db, username, orgId, _id);
    const idpGroupID = await getGroupIds(db, payload, authProviderConfig);
    let defaultGroupId;
    if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProviderConfig)
    }
    const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: CustomerID,
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
    const hashId = generateCode(64);
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
    
    log.info("gsuiteCallback: user created successfully")
    if(feRedirectURI) {
        return res.redirect(`${feRedirectURI}?hashId=${hashId}`)
    } else {
        //res.redirect(`http://admin.localhost:4200/user/sign-in?hashId=${hashId}`);
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?hashId=${hashId}`);
    }
}

const getGroupIds = async (db, payload, authProviderConfig) => {
    const { Mappings, CustomerID } = authProviderConfig;
        if(!Mappings.GroupName || !payload[Mappings.GroupName] || payload[Mappings.GroupName].length == 0) {
            return [];
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
}
