const { Client } = require('ldapts');
const bcrypt = require('bcryptjs');

const ERROR = require('../helpers/error-keys');
const model = require('../models/index');
const { STANDARD_TIER } = require('../helpers/constants');
const { setSuccessResponse, setErrorResponse, setConnectionErrorResponse } = require('../services/api-handler');
const { generateCode, assignUserBalance, assignAuthProviderID, updateUser,findOrCreateAccount, parseCardNumbers, defaultGroupID, processUserWithoutCreation } = require("../helpers/utils");
const {sendAuditLogs} = require("../helpers/auditLog");
const { isConnectionError, connectionErrorCodes } = require('../helpers/connectionError');
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.ldaplogin = async (req, res, db, authProvider) => {
    const { headers, body } = req;
    const { orgId, username, password } = body;
    const tier = headers.tier ? headers.tier : STANDARD_TIER;

    try {
        const { LdapConfig } = authProvider;
        
        if(LdapConfig.CaCert) {
            LdapConfig.CaCert = LdapConfig.CaCert.trim();
            //LdapConfig.CaCert = LdapConfig.CaCert.replace('-----BEGIN CERTIFICATE-----\n', '').replace('\n-----END CERTIFICATE-----', '').split("\n").join(" ");
            if(LdapConfig.CaCert.indexOf('-----BEGIN CERTIFICATE-----') == -1) {
                LdapConfig.CaCert = '-----BEGIN CERTIFICATE-----\n' + LdapConfig.CaCert;
            }
            if(LdapConfig.CaCert.indexOf('-----END CERTIFICATE-----') == -1) {
                LdapConfig.CaCert = LdapConfig.CaCert + '\n-----END CERTIFICATE-----';
            }
            LdapConfig.CaCert.split(" ").join("\n");
        }
        
        const client = await connectToLdapServer(authProvider, res, req, db);

        let user_cn = ''
        await bindAdminDN(client, LdapConfig); // Admin bind first to search for User CN dn value

        const search_res = await doSearch(client, LdapConfig, username); // Get user dn by Parse objectName and saved as the user_cn as well other variables for mapping
        if(!search_res?.length) {
            return setErrorResponse(null, ERROR.PASSWORD_DOES_NOT_MATCH, res, req); 
        }
        user_cn = search_res[0].dn
        await authenticateUser(client, LdapConfig, user_cn, password);
        await unbindLdapConnection(client);
        const searchedUser = search_res[0];
        log.info("searchedUser===", JSON.stringify(searchedUser))
        const mappedData = mapUserData(searchedUser, authProvider);
        mappedData.CustomerID = authProvider.CustomerID;
        mappedData.Tier = tier;
        mappedData.TenantDomain = orgId;
        const hashId = await getHashId(db, authProvider, mappedData, req, res);
        return setSuccessResponse({ hashId: hashId }, res, req)
    } catch (err) {
        log.error('catch err.........', err);
        await sendAuditLogs(db, req, err, {
            loginType: "LdapLogin",
            errorCode: err?.code,
            customerId: authProvider.CustomerID,
        })
        if (isConnectionError(err)) {
            return setConnectionErrorResponse(res, err)
        }
        return setErrorResponse(null, err, res, req);
    }
};

const connectToLdapServer = async (authProvider, res, req, db) => {
    try {
        const { LdapConfig } = authProvider;
        const { Protocol, Host, Port, CaCert } = LdapConfig;
        const tlsOptions = {
            ca: [CaCert],
            rejectUnauthorized: false
        };
        const clientOptions = {};
        clientOptions.url = `${Protocol}://${Host}:${Port}`;
        if(Protocol === "ldaps") {
            clientOptions.tlsOptions = tlsOptions;
        }
        const client = new Client(clientOptions);
        await client.bind('', ''); // Checking connection
        return client;
    } catch (err) {
        log.error("connectToLdapServer error => ", err);
        if (isConnectionError(err?.code)) {
            await sendAuditLogs(db, req, err, {
                loginType: "LdapLogin",
                errorCode: err.code,
                errorDescription: connectionErrorCodes[err.code],
                customerId: authProvider.CustomerID,
            })
            throw err.code
        }
        throw ERROR.INVALID_PROVIDER_CONFIG;
    }
}

const unbindLdapConnection = async(client) => {
    try {
        await client.unbind();
        log.info('unbindLdapConnection success');
    } catch (err) {
        log.error('Error while unbind = ' + err);
        throw err
    }
}

const authenticateUser = async (client, LdapConfig, user_cn, password) => {
    try {
        await client.bind(user_cn, password);
        log.info('authenticateUser success');
    } catch (err) {
        log.error('authenticateUser failed*********', err);
        await unbindLdapConnection(client);
        throw ERROR.PASSWORD_DOES_NOT_MATCH;
    }
}

const bindAdminDN = async (client, LdapConfig) => {
    try {
        await client.bind(LdapConfig.BindDn, LdapConfig.BindCredential);
        log.info("bindAdminDN success");
    } catch (err) {
        log.error("bindAdminDN error =>",err)
        throw ERROR.INVALID_BIND_CREDENTIALS;
    }
}

const doSearch = async(client, LdapConfig, username) => {
    const opts = {
        filter: `(${LdapConfig.PrimaryKey}=${username})`,
        scope: 'sub',
        attributes: ['*'],
    };
    try {
        const { searchEntries } = await client.search(LdapConfig.LdapBase, opts);
        log.info("doSearch success => ", searchEntries?.length);
        log.info("searchEntries===", searchEntries)
        return searchEntries;
    } catch (err) {
        log.error("doSearch err => ", err);
        await unbindLdapConnection(client);
        throw ERROR.INVALID_PROVIDER_CONFIG;
    }
}

const mapUserData = (searchedUser, authProvider) => {
    const mapping = authProvider.Mappings;
    log.info("mapping==", mapping)
    const result = {};
    for (const key in mapping) {
        const attribute_key = mapping[key];
        const attribute = attribute_key ? searchedUser[attribute_key] : null;
        if (attribute) {
            result[key] = attribute;
        } else {
            result[key] = null;
        }
    }
    return result;
}

const getGroupIds = async (db, authProvider, mappedData) => {
    const GroupName = mappedData.GroupName;
    if (GroupName && GroupName.length > 0) { // check length of role(string/arr)
        if (typeof GroupName == "string") {
            const roles = GroupName.split(",");
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
        } else { // means arry
            const roles = GroupName;
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

const getHashId = async (db, authProvider,  mappedData, req, res) => {
    try {
        const { _id, CustomerID, AllowUserCreation } = authProvider
        const user = await model.users.findUserByUserName(db, mappedData.Username, mappedData.TenantDomain, _id);
        const hashId = generateCode(64);
        const idpGroupID = await getGroupIds(db, authProvider, mappedData);
        let defaultGroupId;
        if(!idpGroupID?.length) {
            defaultGroupId = await defaultGroupID(db, authProvider, mappedData)
        }
        mappedData.GroupID = idpGroupID;

        if (AllowUserCreation === false) {
          mappedData.GroupID =
            idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;
          const userDetails = await processUserWithoutCreation({
            db,
            mappedData,
            authProviderConfig: authProvider,
          });
          return setSuccessResponse(userDetails, res);
        }

        const accountIdFromIdpRes = mappedData.Account ? mappedData.Account : null;
        const accountId = await findOrCreateAccount({
          db,
          accountIdFromIdpRes,
          customerID: CustomerID,
        });
        mappedData.AccountID = accountId;

        if (user) {
            log.info("user found ****", JSON.stringify(user))
            await updateUser({
                db,
                dbUser: user,
                hashId,
                mappedData,
                authProviderConfig: authProvider
            })
        } else {
            const password = generateCode(50);
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            mappedData.Password = hashPassword;
            mappedData.GenerationTimestamp = Date.now();
            mappedData.CardNumber = mappedData.CardNumber
              ? parseCardNumbers(mappedData.CardNumber)
              : null;
            mappedData.Email = [];
            mappedData.ApiKey = null;
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
            //delete mappedData.Role;
            delete mappedData.GroupName;
            mappedData.GroupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;

            const quotaBalance = await assignUserBalance(db, mappedData.GroupID)
            mappedData.DebitBalance = 0;
            mappedData.GroupQuotas = quotaBalance;
            assignAuthProviderID(null, mappedData, authProvider._id)

            await model.users.createUser(db, mappedData, mappedData.TenantDomain);
        }
        return hashId;
    } catch (error) {
        log.error("ldapLogin getHashId err => ", error);
        await sendAuditLogs(db, req, error, {
            loginType: "LdapLogin",
            errorCode: error?.code,
            customerId: authProvider?.CustomerID,
        })
    }
}