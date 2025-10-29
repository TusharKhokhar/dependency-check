const axios = require('axios');
const bcrypt = require('bcryptjs');

const model = require('../models/index')
const ERROR = require('../helpers/error-keys')
const { getDb, isolatedDatabase } = require("../config/db");
const { generateCode, assignUserBalance, assignAuthProviderID, getMatchingGroups, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID } = require('../helpers/utils');
const { STANDARD_TIER, SIRSI_RESOURCE_USER, SIRSI_PATRON_LOGIN_END_POINT, SIRSI_STAFF_LOGIN_END_POINT, SIRSI_LOGIN_TYPE_PATRON, SIRSI_LOGIN_TYPE_STAFF, INNOVATION_LOGIN_BARCODE_WITH_PIN, INNOVATION_LOGIN_BARCODE_ONLY } = require('../helpers/constants');
const { setSuccessResponse, setErrorResponse, setConnectionErrorResponse } = require('../services/api-handler');
const ErrorConstant = require('../helpers/error-messages');
const { isConnectionError, connectionErrorCodes } = require('../helpers/connectionError');
const CustomLogger = require("../helpers/customLogger");
const { sendAuditLogs } = require('../helpers/auditLog');
const log = new CustomLogger()

module.exports.sirsiLogin = async (req, res, db, authProvider) => {
    try {
        const { barcode, password } = req.body;
        const { SirsiConfig } = authProvider;
        const { ClientId, AppId, ServerBaseURL, LoginType, Username, Password } = SirsiConfig;
        const resourceURL = `${ServerBaseURL}${SIRSI_RESOURCE_USER}`;

        if(LoginType != SIRSI_LOGIN_TYPE_PATRON && LoginType != INNOVATION_LOGIN_BARCODE_WITH_PIN && LoginType != INNOVATION_LOGIN_BARCODE_ONLY && LoginType != SIRSI_LOGIN_TYPE_STAFF) {
            log.error("Invalid LoginType Error", LoginType)
            return setErrorResponse(null, ERROR.INVALID_PROVIDER_CONFIG, res, req);
        }
        
        const apiURL = `${resourceURL}${(LoginType == SIRSI_LOGIN_TYPE_PATRON || LoginType == INNOVATION_LOGIN_BARCODE_WITH_PIN) ? SIRSI_PATRON_LOGIN_END_POINT : SIRSI_STAFF_LOGIN_END_POINT}`;
        const config = {
            headers: {
                "sd-originating-app-id": AppId,
                "x-sirs-clientId": ClientId
            }
        };
        
        let payload = {
            barcode: '',
            password: ''
        }
        if(LoginType == INNOVATION_LOGIN_BARCODE_ONLY) {
            payload.barcode = Username;
            payload.password = Password;
        } else {
            payload.barcode = barcode;
            payload.password = password;
        }

        axios.post(apiURL, payload, config).then(async (response) => {
            const { sessionToken, patronKey } = response.data;
            if(LoginType == INNOVATION_LOGIN_BARCODE_ONLY) {
                const searchData = await searchPatron(resourceURL, barcode, AppId, ClientId, sessionToken);
                const patronData = await getPatron(resourceURL, searchData.key, AppId, ClientId, sessionToken);
                await getHashId(req, res, db, authProvider, patronData);
            } else {
                const patronData = await getPatron(resourceURL, patronKey, AppId, ClientId, sessionToken);
                await getHashId(req, res, db, authProvider, patronData);
            }
        })
        .catch(async (error) => {
            log.error("sirsi login api error....", error);
            log.error("sirsi login api error....", error?.response?.data);
            if(error?.response) {
                const { data } = error.response;
                const code = data?.messageList?.[0]?.code || ""
                await sendAuditLogs(db, req, error, {
                    loginType: "SirsiLogin",
                    errorCode: error?.response?.data?.messageList?.[0]?.code,
                    errorDescription: error?.response?.data?.messageList?.[0]?.message,
                    customerId: authProvider?.CustomerID,
                })
                switch (code) {
                    case "badClientID":
                        return setErrorResponse(null, ERROR.SIRSI_INVALID_CLIENT_ID, res, req);
                    case "unableToLogin":
                        if(LoginType == INNOVATION_LOGIN_BARCODE_ONLY) {
                            return setErrorResponse(null, ERROR.SIRSI_INVALID_USERNAME_OR_PASSWORD, res, req);
                        } else {
                            return setErrorResponse(null, ERROR.INVALID_LOGIN_CREDENTIALS, res, req);
                        }
                    default:
                        return setErrorResponse(null, ERROR.AUTH_LOGIN_FAILED, res, req);
                }
            } else if (ErrorConstant[error]) {
                return setErrorResponse(null, error, res, req);
            } else if (isConnectionError(error?.code)) {
                await sendAuditLogs(db, req, error, {
                    loginType: "SirsiLogin",
                    errorCode: error?.code,
                    errorDescription: connectionErrorCodes[error.code],
                    customerId: authProvider?.CustomerID,
                })
                return setConnectionErrorResponse(res, error.code)
            }
            return setErrorResponse(null, ERROR.AUTH_LOGIN_FAILED, res, req);
        });
    } catch(err) {
        await sendAuditLogs(db, req, err, {
            loginType: "SirsiLogin",
            errorCode: err?.code,
            customerId: authProvider?.CustomerID,
        })
        log.error('catch err.........', err);
        return setErrorResponse(null, ERROR.AUTH_LOGIN_FAILED, res, req);
    }
}

const getPatron = async (resourceURL, patronKey, AppId, ClientId, sessionToken) => {
    return new Promise((resolve, reject) => {
        const apiURL = `${resourceURL}/patron/key/${patronKey}?includeFields=*,blockList{*},circRecordList{*}`;
        const config = {
            headers: {
                "sd-originating-app-id": AppId,
                "x-sirs-clientId": ClientId,
                "x-sirs-sessionToken": sessionToken
            }
        };
        axios.get(apiURL, config).then((response) => {
            log.info("getPatron info =>", JSON.stringify(response.data))
            resolve(response.data)
        })
        .catch(async (error) => {
            log.error("getPatron error =>", error);
            log.error("getPatron error =>", error?.response?.data);
            reject(ERROR.UNABLE_TO_FIND_USER_DETAILS);
        });
    });
}

const searchPatron = async (resourceURL, barcode, AppId, ClientId, sessionToken) => {
    return new Promise((resolve, reject) => {
        const apiURL = `${resourceURL}/staff/barcode/${barcode}`;
        const config = {
            headers: {
                "sd-originating-app-id": AppId,
                "x-sirs-clientId": ClientId,
                "x-sirs-sessionToken": sessionToken
            }
        };
        axios.get(apiURL, config).then((response) => {
            log.info("searchPatron====>", JSON.stringify(response.data))
            resolve(response.data)
        })
        .catch(async (error) => {
            log.error("searchPatron error =>", error);
            log.error("searchPatron error =>", error?.response?.data);
            reject(ERROR.USER_NOT_FOUND);
        });
    });
}

const getHashId = async (req, res, db, authProviderConfig, patronDetails) => {
    const { headers, body } = req;
    const { orgId, barcode } = body;
    const tier = headers.tier ? headers.tier : STANDARD_TIER;
    const { Mappings, CustomerID, _id } = authProviderConfig;

    const mappedData = await getFieldValues(Mappings, patronDetails.fields);
    log.info("mappedData====>", JSON.stringify(mappedData))
    const _username = mappedData.Username ? mappedData.Username : null;
    const username = _username ? _username : barcode;
    const email = mappedData.PrimaryEmail;
    const accountIdFromIdpRes = mappedData.Account ? mappedData.Account : null;
    const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: CustomerID,
    });
    mappedData.AccountID = accountId;
    if (!db) {
        log.info("Created DB again..........");
        if (tier !== STANDARD_TIER) {
            db = await isolatedDatabase(requesterDomain);
        } else {
            db = await getDb();
        }
    }

    const user = await model.users.findUserByUserName(db, username, orgId, _id)
    const hashId = generateCode(64);

    let idpGroupID = []

    if (Mappings['GroupName']) {
        idpGroupID = await getGroupIds(db, mappedData.GroupName, authProviderConfig);
    } else {
        idpGroupID = await getMatchingGroups(db, patronDetails?.fields, authProviderConfig);   
    }
    let defaultGroupId;
    if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProviderConfig)
    }
    if (user) {
        log.info("user found ****", JSON.stringify(user))
        mappedData.GroupID = idpGroupID;
        await updateUser({
          db,
          dbUser: user,
          hashId,
          mappedData,
          authProviderConfig,
        });
    } else {
        const password = generateCode(50);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const groupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;

        const _user = {
            CustomerID: CustomerID,
            PrimaryEmail: email,
            Username: username,
            Email: [],
            GroupID: groupID,
            CardNumber: mappedData.CardNumber ? parseCardNumbers(mappedData.CardNumber) : null,
            Mobile: mappedData.Mobile ? mappedData.Mobile : null,
            Tier: tier,
            TenantDomain: orgId,
            ApiKey: null,
            Password: hashPassword,
            FirstName: mappedData.FirstName ? mappedData.FirstName : null,
            LastName: mappedData.LastName ? mappedData.LastName : null,
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
    return setSuccessResponse({ hashId: hashId }, res, req);
}

const getFieldValues = async (Mappings, patronDetails) => {
    const result = {};
 
    for (const key in Mappings) {
      const attribute_key = Mappings[key];

      if (attribute_key) {
        const value = patronDetails[attribute_key];

        if(value) {
            if(typeof value == "string" || typeof value == "number" || Array.isArray(value)) {
                result[key] = value ? value : null;
            } else {
                if(typeof value[0] == "object" && value[0].length == undefined) { // means object
                    result[key] = value[0].number ? value[0].number : null;
                } else {
                    result[key] = value[0] ? value[0] : null;
                }
            }
        } else {
            result[key] = null;
        }
      } else {
        result[key] = null;
      }
    }
    return result;
}

const getGroupIds = async (db, GroupName, authProviderConfig) => {
    const { CustomerID } = authProviderConfig;
    if (!GroupName) {
        return [];
    }
        const role = GroupName;
        if (typeof role == "string") {
            const roles = role.split(',').map(r => r.trim());
            const groupIds = [];
            for (const groupName of roles) {
                const group = await model.groups.getGroup(db, CustomerID, groupName);
                if (group) {
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
                if (group) {
                    if (group.PrintConfigurationGroupID) {
                        groupIds.push(group.PrintConfigurationGroupID)
                    }
                    groupIds.push(group._id)
                }
            }
            return groupIds.length > 0 ? groupIds : [];
        }
}
