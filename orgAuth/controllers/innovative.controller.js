const axios = require('axios');
const bcrypt = require('bcryptjs');

const model = require('../models/index')
const ERROR = require('../helpers/error-keys')
const { getDb, isolatedDatabase } = require("../config/db");
const { generateCode, assignUserBalance, assignAuthProviderID, getMatchingGroups, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID, processUserWithoutCreation } = require('../helpers/utils');
const { STANDARD_TIER, INNOVATION_SERVER_PATH, INNOVATION_LOGIN_BARCODE_ONLY, INNOVATION_LOGIN_BARCODE_WITH_PIN } = require('../helpers/constants');
const { setSuccessResponse, setErrorResponse, setConnectionErrorResponse } = require('../services/api-handler');
const { isConnectionError, connectionErrorCodes } = require('../helpers/connectionError');
const {sendAuditLogs} = require("../helpers/auditLog");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.innovativeLogin = async (req, res, db, authProvider) => {
    try {
        const { InnovativeConfig } = authProvider;
        const { ClientId, ClientSecret, ServerBaseURL, LoginType } = InnovativeConfig;
        const encodedCredentials = Buffer.from(`${ClientId}:${ClientSecret}`).toString('base64');
        const requestURL = `${ServerBaseURL}${INNOVATION_SERVER_PATH}`;
        const apiURL = `${requestURL}/token`;
        const config = {
            headers: {
                Authorization: `Basic ${encodedCredentials}`
            }
        };
        if(LoginType != INNOVATION_LOGIN_BARCODE_ONLY && LoginType != INNOVATION_LOGIN_BARCODE_WITH_PIN) {
            log.error("Invalid LoginType Error", LoginType)
            return setErrorResponse(null, ERROR.INVALID_PROVIDER_CONFIG, res, req);
        }
        axios.post(apiURL, 'grant_type=client_credentials', config).then(async (response) => {
            const accessToken = response.data.access_token;
            // Use the access token to make authenticated requests to the Sierra API
            if(LoginType == INNOVATION_LOGIN_BARCODE_ONLY) {
                await loginWithBarcodeOnly(req, res, db, authProvider, requestURL, accessToken);
            } else {
                await loginWithBarcodePIN(req, res, db, authProvider, requestURL, accessToken);
            }
        })
        .catch(async (error) => {
            log.error("Innovative getAccessToken Error...", error);
            log.error("Innovative getAccessToken Error...", error?.response?.data);
            if(isConnectionError(error?.code)) {
                await sendAuditLogs(db, req, error, {
                    loginType: "InnovativeLogin",
                    errorCode: error.code,
                    errorDescription: connectionErrorCodes[error.code],
                    customerId: authProvider?.CustomerID,
                })
                return setConnectionErrorResponse(res, error.code)
            }
            await sendAuditLogs(db, req, error, {
                loginType: "InnovativeLogin",
                errorCode: error?.response?.data?.name,
                errorDescription: error?.response?.data?.description,
                customerId: authProvider?.CustomerID,
            })
            return setErrorResponse(null, ERROR.INVALID_PROVIDER_CONFIG, res, req);
        });
    } catch(err) {
        log.error('catch err.........', err);
        await sendAuditLogs(db, req, err, {
            loginType: "InnovativeLogin",
            customerId: authProvider?.CustomerID,
        })
        return setErrorResponse(null, ERROR.AUTH_LOGIN_FAILED, res, req);
    }
}

const loginWithBarcodeOnly = async (req, res, db, authProvider, requestURL, accessToken) => {
    const { barcode } = req.body;
    try {
        log.info('loginWithBarcodeOnly..........');
        const patron = await getPatron(requestURL, accessToken, barcode, db, req, authProvider?.CustomerID);
        const patronDetails = await getPatronDetails(requestURL, accessToken, patron, db, req, authProvider?.CustomerID);
        return await getHashId(req, res, db, authProvider, patronDetails);
    } catch(err) {
        log.error("loginWithBarcodeOnly Error...", err)
        return setErrorResponse(null, err, res, req);
    }
}

const loginWithBarcodePIN = async (req, res, db, authProvider, requestURL, accessToken) => {
    const { barcode, pin } = req.body;
    try {
        log.info('loginWithBarcodePIN..........');
        await validateBarcodePin(requestURL, accessToken, barcode, pin, db, req, authProvider?.CustomerID);
        const patron = await getPatron(requestURL, accessToken, barcode, db, req, authProvider?.CustomerID);
        const patronDetails = await getPatronDetails(requestURL, accessToken, patron, db, req, authProvider?.CustomerID);
        return await getHashId(req, res, db, authProvider, patronDetails);
    } catch(err) {
        log.error("loginWithBarcodePIN Error...", err)
        return setErrorResponse(null, err, res, req);
    }
}

const getPatron = async (requestURL, accessToken, barcode, db, req, customerId) => {
    return new Promise((resolve, reject) => {
        const apiURL = `${requestURL}/patrons/find?barcode=${barcode}`; ///1000001  find?barcode=11111119 //varFieldTag=b&varFieldContent=1234567809

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
        axios.get(apiURL, config).then(response => {
            //id,homeLibrary,message,moneyOwed <= Default fields
            //expirationDate,patronType,patronCodes,homeLibraryCode,blockInfo'; <= Additional default fields
            //pin <= Invalid fields (Can't query)
            log.info("getPatron **", JSON.stringify(response.data))
            resolve(response.data)
        })
        .catch(async(error) => {
            log.error("getPatron Error...", error);
            await sendAuditLogs(db, req, error, {
                loginType: "InnovativeLogin",
                customerId,
            })
            reject(ERROR.INVALID_LOGIN_CREDENTIALS);
        });
    });
}

const getPatronDetails = async (requestURL, accessToken, patron, db, req, customerId) => {
    const queryFields = 'emails,names,addresses,phones,barcodes,birthDate,uniqueIds,pMessage,langPref,fixedFields,varFields' // <= Query fields
    return new Promise((resolve, reject) => {
        const apiURL = `${requestURL}/patrons/${patron.id}?fields=${queryFields}`;

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
        axios.get(apiURL, config).then(response => {
            log.info("getPatron **", JSON.stringify(response.data))
            resolve(response.data)
        })
        .catch(async(error) => {
            log.error("getPatronDetails Error...", error);
            await sendAuditLogs(db, req, error, {
                loginType: "InnovativeLogin",
                customerId,
            })
            reject(ERROR.UNABLE_TO_FIND_USER_DETAILS);
        });
    });
}

const validateBarcodePin = async (requestURL, accessToken, barcode, pin, db, req, customerId) => {
    return new Promise((resolve, reject) => {
        const apiURL = `${requestURL}/patrons/validate`;

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        const payload = {
            barcode: barcode,
            pin: pin
        }
        axios.post(apiURL, payload, config).then(response => {
            log.info("validateBarcodePin success", JSON.stringify(response.data));
            resolve(response.data)
        })
        .catch(async(error) => {
            log.error("validateBarcodePin Error...", error);
            await sendAuditLogs(db, req, error, {
                loginType: "InnovativeLogin",
                customerId,
            })
            reject(ERROR.INVALID_LOGIN_CREDENTIALS);
        });
    });
}

const getHashId = async (req, res, db, authProviderConfig, patronDetails) => {
    const { headers, body } = req;
    const { orgId, barcode } = body;
    const tier = headers.tier ? headers.tier : STANDARD_TIER;
    const { Mappings, CustomerID, _id, AllowUserCreation } = authProviderConfig;
    log.info("Mappings====>", Mappings);

    const mappedData = await getFieldValues(Mappings, patronDetails);
    const accountIdFromIdpRes = mappedData.Account ? mappedData.Account : null;
    const accountId = await findOrCreateAccount({
        db,
        accountIdFromIdpRes,
        customerID: CustomerID,
    });
    mappedData.AccountID = accountId
    const _username = mappedData.Username ? mappedData.Username : null;
    const username = _username ? _username : barcode;
    const email = mappedData.PrimaryEmail;

    if (!db) {
        log.info("Created DB again..........");
        if (tier !== STANDARD_TIER) {
            db = await isolatedDatabase(requesterDomain);
        } else {
            db = await getDb();
        }
    }

    let idpGroupID = []
    if (Mappings['GroupName']) {
        idpGroupID = await getGroupIds(db, mappedData.GroupName, authProviderConfig);
    } else {
        idpGroupID = await getMatchingGroups(db, patronDetails, authProviderConfig);   
    }
    let defaultGroupId;
    if(!idpGroupID?.length) {
        defaultGroupId = await defaultGroupID(db, authProviderConfig)
    }
    
    if (AllowUserCreation === false) {
      mappedData.GroupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;
      mappedData.Username = username;
      const userDetails = await processUserWithoutCreation({
        db,
        mappedData,
        authProviderConfig,
      });
      return setSuccessResponse(userDetails, res);
    }

    const user = await model.users.findUserByUserName(db, username, orgId, _id)
    const hashId = generateCode(64);
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
    //await setSuccessResponse(patronDetails, res, req);
    return setSuccessResponse({ hashId: hashId }, res, req);
}

const getFieldValues = async (Mappings, patronDetails) => {
    const result = {};
 
    for (const key in Mappings) {
      const attribute_key = Mappings[key];

      if (attribute_key) {
        const keyTreeArr = attribute_key.split('.');

        if(keyTreeArr.length == 1) {
            const value = patronDetails[keyTreeArr[0]];

            if(value) {
                if(typeof value == "string" || typeof value == "number") {
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
            const parentValue = patronDetails[keyTreeArr[0]];

            if(typeof parentValue == "object" && parentValue.length == undefined) { // means object
                const value = parentValue[keyTreeArr[1]];

                if(value) {
                    if(typeof value == "string" || typeof value == "number") {
                        result[key] = value ? value : null;
                    } else {
                        const _value = value.value;
                        result[key] = _value ? _value : null;
                    }
                } else {
                    result[key] = null;
                }
            } else if (typeof parentValue == "object" && parentValue.length != undefined) { // means array
                const value = parentValue.find((item) => item.fieldTag == keyTreeArr[1]);

                if(value) {
                    if(typeof value == "string" || typeof value == "number") {
                        result[key] = value ? value : null;
                    } else {
                        const _value = value.content;
                        result[key] = _value ? _value : null;
                    }
                } else {
                    result[key] = null;
                }
            }
        }
      } else {
        result[key] = null;
      }
    }
    return result;
}

const getGroupIds = async (db, GroupName, authProviderConfig) => {
    if (!GroupName) {
        return [];
    } 
    const { CustomerID } = authProviderConfig;
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
                    groupIds.push(group._id)
                }
            }
            return groupIds.length > 0 ? groupIds : [];
        }
}
