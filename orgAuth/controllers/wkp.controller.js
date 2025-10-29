const axios = require("axios");
const bcrypt = require("bcryptjs");

const model = require("../models/index");
const {
  generateCode,
  assignUserBalance,
  assignAuthProviderID,
  updateUser,
  parseCardNumbers,
  findOrCreateAccount,
  defaultGroupID,
  getGroupIds,
} = require("../helpers/utils");
const { STANDARD_TIER } = require("../helpers/constants");
const {
  setSuccessResponse,
  setErrorResponse,
  setErrorResponseByServer,
} = require("../services/api-handler");
const ErrorConstant = require("../helpers/error-messages");
const CustomLogger = require("../helpers/customLogger");
const { sendAuditLogs } = require("../helpers/auditLog");
const ERROR = require('../helpers/error-keys')
const log = new CustomLogger();

module.exports.wkpLogin = async (req, res, db, authProvider) => {
  try {
    const { pin } = req.body;
    const { WkpConfig } = authProvider;

    const token = await getWkpToken({
      WkpConfig,
    });

    const userData = await wkpUserDetails({
      WkpConfig,
      pin,
      token,
      db,
      req,
      authProvider,
    });

    if (!userData) {
      log.error("user not found");
      return setErrorResponse(null, ERROR.USER_NOT_FOUND, res, req);
    }
    return await getHashId(req, res, db, authProvider, userData);
  } catch (err) {
    log.error("wkpLogin catch err.........", err);
    const errorMsg =
    typeof err === "string"
      ? err
      : err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));

    await sendAuditLogs(db, req, err, {
      loginType: "WkpLogin",
      errorCode: errorMsg,
      customerId: authProvider?.CustomerID,
    });
    return setErrorResponseByServer(err, res, req);
  }
};

const getWkpToken = async ({ WkpConfig }) => {
  try {
    const {
      ClientId,
      ClientSecret,
      TokenEndpoint,
      OcpApimSubscriptionKey,
      Scope,
    } = WkpConfig;

    const additionalScope = Scope?.replaceAll(',', ' ')?.replace(/\s+/g, ' ')?.trim();

    const scope = new Set(additionalScope ? additionalScope?.split(' ') : []);

    const config = {
      headers: {
        "Ocp-Apim-Subscription-Key": OcpApimSubscriptionKey,
        "Content-Type": "application/json",
      },
    };

    const payload = {
      client_id: ClientId,
      client_secret: ClientSecret,
    };

    if (scope?.size) {
      payload["scope"] = [...scope].join(" ");
    }
    
    const response = await axios.post(TokenEndpoint, payload, config);
    if (response?.data?.token) {
      return response.data.token;
    }
    log.info("WKP Token Response data:", response?.data);
    throw new Error("Invalid token response from WKP");
  } catch (error) {
    log.error("WKP Token Response error:", error?.response?.data || error);
    log.error("WKP Token Response status:", error?.response?.status);
    let errorMsg;
    if (error?.response?.data) {
      errorMsg = formatErrors(error?.response?.data);
    }
    if (!errorMsg) {
      errorMsg = ErrorConstant.INVALID_PROVIDER_CONFIG;
    }
    throw errorMsg;
  }
};

const wkpUserDetails = async ({ WkpConfig, pin, token }) => {
  try {
    const { WkpAuthEndpoint } = WkpConfig;
    const apiURL = `${WkpAuthEndpoint}/${pin}`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(apiURL, config);
    log.info("WKP UserDetails response:", response?.data);
    return response?.data;
  } catch (error) {
    log.error("wkpUserDetails Response error:", error?.response?.data || error);
    log.error("wkpUserDetails Response status:", error?.response?.status);

    let errorMsg;
    if (error?.response?.data?.error?.details) {
      errorMsg = formatErrors(error.response.data.error.details);
    } else if (error?.response?.data) {
      errorMsg = formatErrors(error.response.data);
    } else {
      errorMsg = ErrorConstant.INVALID_LOGIN_CREDENTIALS;
    }
    if (!errorMsg) {
      errorMsg = ErrorConstant.INVALID_LOGIN_CREDENTIALS;
    }
    throw errorMsg;
  }
};

function formatErrors(errorObj) {
  if (!errorObj) return "Unknown error";

  let parsed = errorObj;
  if (typeof errorObj === "string") {
    try {
      parsed = JSON.parse(errorObj);
    } catch {
      parsed = errorObj;
    }
  }
  const errorContainer = parsed?.modelState || parsed?.errors;
  if (errorContainer && typeof errorContainer === "object") {
    const messages = Object.entries(errorContainer).map(([field, errors]) => {
      if (Array.isArray(errors)) {
        return `${field}: ${errors.join(", ")}`;
      }
      return `${field}: ${errors}`;
    });
    return messages.join(", ");
  }
  return parsed?.message || parsed?.title;
}

const getHashId = async (req, res, db, authProviderConfig, userDetails) => {
  try {
    const { headers, body } = req;
    const { orgId } = body;
    const tier = headers.tier ? headers.tier : STANDARD_TIER;
    const { Mappings, CustomerID, AssociatedIdentityProvider } = authProviderConfig;

    const mappedData = mapUserInfo(Mappings, userDetails);
    log.info("mappedData====>", JSON.stringify(mappedData));
    const username = mappedData.Username ? mappedData.Username: null;
    if (!username) {
      log.error("Username not found... check mapping fields");
      return setErrorResponse(null, ERROR.USER_NOT_FOUND, res, req);
    }
    const accountIdFromIdpRes = mappedData.Account ? mappedData.Account : null;
    const accountId = await findOrCreateAccount({
      db,
      accountIdFromIdpRes,
      customerID: CustomerID,
    });
    mappedData.AccountID = accountId

    const user = await model.users.findUserByUserName(db, username, orgId, AssociatedIdentityProvider);
    const hashId = generateCode(64);

    const idpGroupID = await getGroupIds(db, userDetails, authProviderConfig);

    let defaultGroupId;
    if (!idpGroupID?.length) {
      defaultGroupId = await defaultGroupID(db, authProviderConfig);
    }

    if (user) {
      log.info("user found ****", JSON.stringify(user));
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
        PrimaryEmail: mappedData.PrimaryEmail ? mappedData.PrimaryEmail : null,
        Username: mappedData.Username ? mappedData.Username : null,
        Email: [],
        GroupID: groupID,
        CardNumber: mappedData.CardNumber
          ? parseCardNumbers(mappedData.CardNumber)
          : null,
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
      if (mappedData.AccountID) {
        _user.AccountID = mappedData.AccountID;
      }
      assignAuthProviderID(null, _user, AssociatedIdentityProvider);
      const quotaBalance = await assignUserBalance(db, groupID);
      _user.DebitBalance = 0;
      _user.GroupQuotas = quotaBalance;
      await model.users.createUser(db, _user, orgId);
    }
    return setSuccessResponse({ hashId: hashId }, res, req);
  } catch (error) {
    log.error("WKP getHashId Error =>", error);
    throw error;
  }
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
