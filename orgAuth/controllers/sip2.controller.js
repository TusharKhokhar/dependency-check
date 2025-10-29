const bcrypt = require("bcryptjs");

const model = require("../models/index");
const {
  setSuccessResponse,
  setErrorResponse,
  setErrorResponseByServer,
  setConnectionErrorResponse,
} = require("../services/api-handler");
const ERROR = require("../helpers/error-keys");
const SIP2 = require("../esmAdapter/loadSip2Async");
const { getDb, isolatedDatabase } = require("../config/db");
const {
  generateCode,
  getGroupIds,
  assignUserBalance,
  getMatchingGroups,
  assignAuthProviderID,
  updateUser,
  parseCardNumbers,
  findOrCreateAccount,
  defaultGroupID,
} = require("../helpers/utils");
const {
  INNOVATION_LOGIN_BARCODE_WITH_PIN,
  STANDARD_TIER,
} = require("../helpers/constants");
const { isConnectionError, connectionErrorCodes } = require("../helpers/connectionError");
const CustomLogger = require("../helpers/customLogger");
const { sendAuditLogs } = require("../helpers/auditLog");
const log = new CustomLogger()

module.exports.sip2Login = async (req, res, db, authProvider) => {
  try {
    const { Sip2Config } = authProvider;
    const { barcode, pin } = req.body;
    const client = await initializeSip2Client(Sip2Config);
    const {
      Username,
      Password,
      LoginEnabled,
      LocationCode = "",
      InstitutionID,
      LoginType,
    } = Sip2Config;

    if (LoginEnabled) {
      if (!Username || !Password) {
        log.error("Configuration error: Username or Password is missing in sip2 configuration")
        return setErrorResponse(
          null,
          ERROR.INVALID_SIP2_CONFIGURATION,
          res,
          req
        );
      }
      const loginRequest = new SIP2.LoginRequest(
        Username,
        Password,
        LocationCode
      );
      const loginResponse = await client.send(loginRequest.getMessage());
      if (!loginResponse.ok) {
        log.error("sip2 login error =>", loginResponse);
        return setErrorResponse(null, ERROR.SIP2_LOGIN_ERROR, res, req);
      }
    }
    const patronInfoRequest = new SIP2.PatronInformationRequest();
    patronInfoRequest.institutionId = InstitutionID;
    if (!barcode || (LoginType == INNOVATION_LOGIN_BARCODE_WITH_PIN && !pin)) {
      return setErrorResponse(null, ERROR.MISSING_BARCODE_OR_PIN, res, req);
    }
    patronInfoRequest.patronIdentifier = barcode;
    if (LoginType == INNOVATION_LOGIN_BARCODE_WITH_PIN) {
      patronInfoRequest.patronPassword = pin;
    }
    const patronResponse = await client.send(patronInfoRequest.getMessage());
    log.info("patronResponse====", JSON.stringify(patronResponse))
    if (!patronResponse?.validPatron) {
      const error = patronResponse?.screenMessage
        ? patronResponse?.screenMessage?.[0]
        : ERROR.INVALID_LOGIN_CREDENTIALS;
      log.error("patronInfoRequest Error...", error)
      return setErrorResponseByServer(error, res, req);
    }
    return await getHashId(req, res, db, authProvider, patronResponse);
  } catch (error) {
    log.error("catch err.........", error);
    await sendAuditLogs(db, req, error, {
      loginType: "Sip2Login",
      errorCode: error?.code,
      errorDescription: error?.code ? connectionErrorCodes[error?.code] : "",
      customerId: authProvider?.CustomerID,
    });
    if (isConnectionError(error)) {
      return setConnectionErrorResponse(res, error)
    }
    return setErrorResponse(null, error, res, req);
  }
};

const initializeSip2Client = async (authProviderConfig) => {
  try {
    const { Host, Port } = authProviderConfig;
    const options = {
      host: Host,
      port: Port,
      debug: true,
      verbose: true,
    };
    const client = new SIP2.Client(options);
    await client.connect();
    const statusRequest = new SIP2.SCStatusRequest(); // checking connection
    await client.send(statusRequest.getMessage());
    return client;
  } catch (error) {
    log.error("connectToSip2Server error => ", error);
    if (isConnectionError(error?.code)) {
      throw error.code
    }
    throw ERROR.INVALID_PROVIDER_CONFIG;
  }
};

const getHashId = async (req, res, db, authProviderConfig, patronDetails) => {
  const { headers, body } = req;
  const { orgId } = body;
  const tier = headers.tier ? headers.tier : STANDARD_TIER;
  const { Mappings, CustomerID, _id } = authProviderConfig;
  const mappedData = mapUserInfo(Mappings, patronDetails);
  const userName = mappedData.Username ? mappedData.Username : null;
  let firstName = null
  let lastName = null
  if (patronDetails?.fullName) {
      let parts = patronDetails.fullName.trim().split(',');
      firstName = parts[0];
      if (parts.length > 1) {
          lastName = parts.pop().trim();
      }
  }
  const _firstName = mappedData?.FirstName ? mappedData.FirstName : firstName
  const _lastName = mappedData?.LastName ? mappedData.LastName : lastName

  if (!db) {
    if (tier !== STANDARD_TIER) {
      db = await isolatedDatabase(requesterDomain);
    } else {
      db = await getDb();
    }
  }

  const user = await model.users.findUserByUserName(db, userName, orgId, _id);
  const hashId = generateCode(64);
  
  let idpGroupID = []
  if (Mappings['GroupName']) {
    idpGroupID = await getGroupIds(db, patronDetails, authProviderConfig );
  } else {
    idpGroupID = await getMatchingGroups(db, patronDetails, authProviderConfig);   
  }
  let defaultGroupId;
  if(!idpGroupID?.length) {
    defaultGroupId = await defaultGroupID(db, authProviderConfig)
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
    mappedData.GroupID = idpGroupID;
    mappedData.FirstName = _firstName;
    mappedData.LastName = _lastName;
    await updateUser({
      db,
      dbUser: user,
      hashId,
      mappedData,
      authProviderConfig,
    })
  } else {
    const password = generateCode(50);
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const groupID = idpGroupID?.length > 0 ? idpGroupID : defaultGroupId;

    const _user = {
      CustomerID: CustomerID,
      PrimaryEmail: mappedData.PrimaryEmail ? mappedData.PrimaryEmail : null,
      Username: userName,
      Email: [],
      GroupID: groupID,
      CardNumber: mappedData.CardNumber ? parseCardNumbers(mappedData.CardNumber) : null,
      Mobile: mappedData.Mobile ? mappedData.Mobile : null,
      Tier: tier,
      TenantDomain: orgId,
      ApiKey: null,
      Password: hashPassword,
      FirstName: _firstName,
      LastName: _lastName,
      Mfa: false,
      MfaOption: {
        Email: false,
        Mobile: false,
      },
      ApprovedUser: true,
      IsActive: true,
      Tags: [],
      IsDeleted: false,
      LoginAttemptCount: 0,
      HashID: hashId,
      GenerationTimestamp: Date.now(),
    };
    if (mappedData.AccountID){
      _user.AccountID = mappedData.AccountID
    }
    assignAuthProviderID(null, _user, authProviderConfig._id)
    const quotaBalance = await assignUserBalance(db, groupID);
    _user.DebitBalance = 0;
    _user.GroupQuotas = quotaBalance;
    await model.users.createUser(db, _user, orgId);
  }
  return setSuccessResponse({ hashId: hashId }, res, req);
};

const mapUserInfo = (Mappings, patronDetails) => {
  const result = {};
  for (const key in Mappings) {
    const attribute_key = Mappings[key];
    if (attribute_key) {
      const value = patronDetails[attribute_key];
      if (value) {
        result[key] = value;
      } else {
        result[key] = null;
      }
    } else {
      result[key] = null;
    }
  }
  return result;
};
