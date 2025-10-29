const crypto = require('crypto');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const model = require('../models/index')
const ERROR = require('../helpers/error-keys')
const { generateCode, getGroupIds, assignUserBalance, assignAuthProviderID, getMatchingGroups, updateUser, parseCardNumbers, findOrCreateAccount, defaultGroupID } = require('../helpers/utils');
const { STANDARD_TIER, POLARIS_API_URL, POLARIS_PATRON_AUTHENTICATION_PATH, POLARIS_PATRON_BASIC_DETAILS} = require('../helpers/constants');
const { setSuccessResponse, setErrorResponse, setErrorResponseByServer, setConnectionErrorResponse} = require('../services/api-handler');
const { isConnectionError } = require('../helpers/connectionError');
const ErrorConstant = require('../helpers/error-messages')
const {sendAuditLogs} = require("../helpers/auditLog");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

/**
 * Polaris login
 */

module.exports.polarisLogin = async (req, res, db, authProvider) => {
    try {
        let { barcode, password, orgId, } = req.body;
        const { headers } = req;
        const tier = headers.tier ? headers.tier : STANDARD_TIER;
        const { PolarisConfig: {LoginType} } = authProvider;
        if (LoginType === 'BarcodeWithPin') {
            await loginWithCardPin(authProvider, barcode, password, orgId, db, tier, req, res)
        } else if (LoginType === 'BarcodeOnly') {
            await loginWithBarCode(authProvider, barcode, password, orgId, db, tier, req, res)
        }
    } catch (err) {
        log.error('catch error......', err);
        return setErrorResponse(null, ERROR.AUTH_LOGIN_FAILED, res, req);
    }
}

const loginWithCardPin = async (authProvider, barcode, password, orgId, db, tier, req, res) => {
    try {
        const { PolarisConfig, Mappings, CustomerID, _id} = authProvider;
        const { Host, PAPIAccessId, PAPIAccessKey } = PolarisConfig;
     
        const apiURL = `${Host}${POLARIS_API_URL}/${POLARIS_PATRON_AUTHENTICATION_PATH}`;
        const basicAPIUrl = `${Host}${POLARIS_API_URL}/${POLARIS_PATRON_BASIC_DETAILS}/${barcode}/basicdata?addresses=false&notes=false`;
        const httpMethod = 'POST';
        const date = new Date().toUTCString();
        const signature = await getPAPIHash(PAPIAccessKey, httpMethod, apiURL, date, null);
        const dataSet = await authenticatePatron(PAPIAccessId, signature, barcode, password, apiURL, date)
        const hashId = generateCode(64);
        const getSignature = await getPAPIHash(PAPIAccessKey, 'GET', basicAPIUrl, date, dataSet.AccessSecret);
        const {PatronBasicData: data} = await fetchPatronBasicData(PAPIAccessId, getSignature, barcode, dataSet.AccessSecret, basicAPIUrl, date)
        log.info("Petron Details ****", JSON.stringify(data))
        const mappedUserDetails = await mapUserInfoForPatron(data, Mappings, db, authProvider)
        const user = await model.users.findUserByUserName(db, mappedUserDetails["Username"]?.toString(), orgId, _id)
        const accountIdFromIdpRes = mappedUserDetails.AccountID ? mappedUserDetails.AccountID : null;
        const accountId = await findOrCreateAccount({
            db,
            accountIdFromIdpRes,
            customerID: CustomerID,
        });
        mappedUserDetails.AccountID = accountId;
        if (user) {
            log.info("user found ****", JSON.stringify(user))
            const _user = await generateHashForUser(hashId, db, user, authProvider, mappedUserDetails)
            return setSuccessResponse(_user, res, req)
        } else {
            const _user = await createUser(tier, orgId, hashId, mappedUserDetails, db, CustomerID, _id, authProvider)
            return setSuccessResponse(_user, res, req)
        }
    } catch (error) {
        log.error('loginWithCardPin Error.........', error);
        await sendAuditLogs(db, req, error, {
            loginType: "PolarisLogin",
            errorCode: error?.code,
            customerId: authProvider?.CustomerID,
        })
        if (ErrorConstant[error]) {
          return setErrorResponse(null, error, res);
        } else if (isConnectionError(error)) {
          return setConnectionErrorResponse(res, error);
        }
        return setErrorResponseByServer(error, res);
    }
}

const loginWithBarCode = async (authProvider, barcode, password, orgId, db, tier, req, res) => {
    try {
        const { PolarisConfig, Mappings, CustomerID, _id} = authProvider;
        const { Host, PAPIAccessId, PAPIAccessKey, Domain, Username, Password } = PolarisConfig;

        const apiURL = `${Host}/PAPIService/REST/protected/v1/1033/1/1/authenticator/staff`;
        const basicAPIUrl = `${Host}/PAPIService/REST/public/v1/1033/1/1/${barcode}/basicdata?addresses=false&notes=false`;
        const httpMethod = 'POST';
        const date = new Date().toUTCString();
        const signature = await getPAPIHash(PAPIAccessKey, httpMethod, apiURL, date, null);
        const dataSet = await authenticateStaff(PAPIAccessId, signature, barcode, Password, apiURL, date, Domain, Username)
        const hashId = generateCode(64);
        const getSignature = await getPAPIHash(PAPIAccessKey, 'GET', basicAPIUrl, date, dataSet.AccessSecret);
        const {PatronBasicData: data} = await fetchPatronBasicData(PAPIAccessId, getSignature, barcode, dataSet.AccessSecret, basicAPIUrl, date)
        log.info("Petron Details ****", JSON.stringify(data))
        const mappedUserDetails = await mapUserInfoForPatron(data, Mappings, db, authProvider)
        const user = await model.users.findUserByUserName(db, mappedUserDetails["Username"]?.toString(), orgId, _id)
        const accountIdFromIdpRes = mappedUserDetails.AccountID ? mappedUserDetails.AccountID : null;
        const accountId = await findOrCreateAccount({
            db,
            accountIdFromIdpRes,
            customerID: CustomerID,
        });
        mappedUserDetails.AccountID = accountId;
        if (user) {
            log.info("user found ****", JSON.stringify(user))
            const _user = await generateHashForUser(hashId, db, user, authProvider, mappedUserDetails)
            return setSuccessResponse(_user, res, req)
        } else {
            const _user = await createUser(tier, orgId, hashId, mappedUserDetails, db, CustomerID, _id, authProvider)
            return setSuccessResponse(_user, res, req)
        }
    } catch (error) {
        log.error("loginWithBarCode Error.........", error);
        await sendAuditLogs(db, req, error, {
            loginType: "PolarisLogin",
            errorCode: error?.code,
            customerId: authProvider?.CustomerID,
        })
        if (ErrorConstant[error]) {
          return setErrorResponse(null, error, res);
        } else if (isConnectionError(error)) {
          return setConnectionErrorResponse(res, error);
        }
        return setErrorResponseByServer(error, res);
    }
}

/**
 *
 * @param hashId
 * @param db
 * @param user
 * @param authProvider
 * @param mappedUserDetails
 * @returns {Promise<{HashID, GenerationTimestamp: number}>}
 */

const generateHashForUser = async (hashId, db, user, authProvider, mappedUserDetails) => {
  await updateUser({
    db,
    dbUser: user,
    hashId,
    mappedData: mappedUserDetails,
    authProviderConfig: authProvider,
  })
  return { hashId };
};

/**
 * create user
 * @param tier
 * @param orgId
 * @param hashId
 * @param mappedUserDetails
 * @param db
 * @param CustomerID
 * @param authProviderId
 * @returns {Promise<{HashID, GenerationTimestamp: number}>}
 */

const createUser = async (tier, orgId, hashId,mappedUserDetails, db, CustomerID, authProviderId, authProviderConfig) => {
    const password = generateCode(50);
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    mappedUserDetails["CardNumber"] = mappedUserDetails["CardNumber"]
      ? parseCardNumbers(mappedUserDetails["CardNumber"])
      : null;
    let defaultGroupId;
    if (!mappedUserDetails["GroupID"]?.length) {
      defaultGroupId = await defaultGroupID(db, authProviderConfig);
    }
    const moreDetailsUser = {
        CustomerID: CustomerID,
        Email: [],
        Tier: tier,
        TenantDomain: orgId,
        ApiKey: null,
        Password: hashPassword,
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
        GenerationTimestamp: Date.now(),
    }
    if (mappedUserDetails.AccountID){
        moreDetailsUser.AccountID = mappedUserDetails.AccountID
    }
    mappedUserDetails.GroupID = mappedUserDetails?.GroupID?.length
      ? mappedUserDetails.GroupID
      : defaultGroupId;
    assignAuthProviderID(null, moreDetailsUser, authProviderId)
    const quotaBalance = await assignUserBalance(db, mappedUserDetails.GroupID)
    moreDetailsUser.DebitBalance = 0;
    moreDetailsUser.GroupQuotas = quotaBalance;
    Object.assign(moreDetailsUser, mappedUserDetails)
    await model.users.createUser(db, moreDetailsUser, orgId);
    return  {
        hashId: hashId,
        GenerationTimestamp: Date.now()
    }
}

/**
 * Authenticate Patron
 * @param PAPIAccessId
 * @param signature
 * @param barcode
 * @param password
 * @param apiURL
 * @param date
 * @returns {Promise<unknown>}
 */

const authenticatePatron = (PAPIAccessId, signature, barcode, password, apiURL, date) => {
    return new Promise((resolve, reject) => {
        const payload = {
            Barcode: barcode,
            Password: password
        }
        let config = {
            method: 'post',
            url: apiURL,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "Authorization": `PWS ${PAPIAccessId}:${signature}`,
                "PolarisDate": `${date}`
            },
            data : JSON.stringify(payload)
        };
        axios(config).then(async (response) => {
            if(response?.data?.ErrorMessage || !response?.data?.AccessSecret) {
                log.error('authenticatePatron Error...',response.data);
                reject(ERROR.INVALID_LOGIN_CREDENTIALS)
            } else {
                log.info("authenticatePatron **", JSON.stringify(response.data))
                resolve(response.data)
            }
        }).catch(async (error) => {
            log.error('authenticatePatron Error...', error);
            log.error('authenticatePatron Error...', error?.response?.data);
            if (isConnectionError(error?.code)) {
                reject(error?.code)
            }
            reject(ERROR.INVALID_PROVIDER_CONFIG)
        });
    })
}

/**
 * Authenticate Staff
 * @param PAPIAccessId
 * @param signature
 * @param barcode
 * @param password
 * @param apiURL
 * @param date
 * @param domain
 * @param userName
 * @returns {Promise<unknown>}
 */

const authenticateStaff = (PAPIAccessId, signature, barcode, password, apiURL, date, domain, userName) => {
    return new Promise((resolve, reject) => {
        const payload = {
            Domain: domain,
            Username: userName,
            Password: password
        }
        let config = {
            method: 'post',
            url: apiURL,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "Authorization": `PWS ${PAPIAccessId}:${signature}`,
                "PolarisDate": `${date}`
            },
            data : JSON.stringify(payload)
        };
        axios(config).then(async (response) => {
            if(response?.data?.ErrorMessage || !response?.data?.AccessSecret) {
                log.error('authenticateStaff Error...', response.data);
                reject(ERROR.INVALID_PROVIDER_CONFIG)
            } else {
                log.info("authenticateStaff **", JSON.stringify(response.data))
                resolve(response.data)
            }
        }).catch(async (error) => {
            log.error('authenticateStaff Error...', error);
            log.error('authenticateStaff Error...', error?.response?.data);
            if (isConnectionError(error?.code)) {
                reject(error?.code)
            }
            reject(ERROR.INVALID_PROVIDER_CONFIG)
        });
    })
}

/**
 * Patron basic data
 * @param PAPIAccessId
 * @param signature
 * @param barcode
 * @param password
 * @param apiURL
 * @param date
 * @returns {Promise<unknown>}
 */

const fetchPatronBasicData = (PAPIAccessId, signature, barcode, password, apiURL, date) => {
    return new Promise((resolve, reject) => {
        let config = {
            method: 'get',
            url: apiURL,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "Authorization": `PWS ${PAPIAccessId}:${signature}`,
                "PolarisDate": `${date}`
            }
        };
        axios(config).then(async (response) => {
            log.info(response.data)
            if(response?.data?.ErrorMessage) {
                reject(ERROR.UNABLE_TO_FIND_USER_DETAILS)
            } else {
                log.info("fetchPatronBasicData **", JSON.stringify(response.data))
                resolve(response.data)
            }
        }).catch(async (error) => {
            log.error("fetchPatronBasicData Error...", error)
            log.error("fetchPatronBasicData Error...", error?.response?.data)
            reject(ERROR.UNABLE_TO_FIND_USER_DETAILS)
        });
    })
}

/**
 * papi hash id generator
 * @param papiAccessId
 * @param papiAccessKey
 * @param httpMethod
 * @param uri
 * @param date
 * @param patronPassword
 * @returns {Promise<string>}
 */

const getPAPIHash = async (papiAccessKey, httpMethod, uri, date, patronPassword) => {
    const data = patronPassword ? `${httpMethod}${uri}${date}${patronPassword}`: `${httpMethod}${uri}${date}`
    return crypto.createHmac('sha1', papiAccessKey)
      .update(data, 'utf8')
      .digest('base64')
}

/**
 *  map user info for patron
 * @param data
 * @param dbMappings
 * @param db
 * @param authProviderConfig
 * @returns {Promise<{CardNumber: string, Username: string, FirstName: string, PrimaryEmail: string, LastName: string, Mobile: string, GroupID: *[]}>}
 */

const mapUserInfoForPatron = async (data, dbMappings, db, authProviderConfig) => {
    let mappingsOfUser = {
        Username: '',
        PrimaryEmail: '',
        FirstName: '',
        LastName: '',
        Mobile: '',
        GroupID: [],
        CardNumber: '',
        AccountID: ''
    }
    mappingsOfUser['Username'] = data[dbMappings['Username']].toString()
    mappingsOfUser['PrimaryEmail'] = data[dbMappings['PrimaryEmail']]
    mappingsOfUser['FirstName'] = data[dbMappings['FirstName']]
    mappingsOfUser['LastName'] = data[dbMappings['LastName']]
    mappingsOfUser['Mobile'] = data[dbMappings['Mobile']]
    mappingsOfUser["GroupID"] = dbMappings["GroupName"]
      ? await getGroupIds(db, data, authProviderConfig)
      : await getMatchingGroups(db, data, authProviderConfig);
    mappingsOfUser['CardNumber'] = data[dbMappings['CardNumber']];
    mappingsOfUser['AccountID'] = data[dbMappings['Account']]
    return mappingsOfUser
}