// prepareConfigGlobals sets up all the lambda globals if they are not already set.

const axios = require("axios")
const Crypto = require("crypto")
const Base64Url = require("base64url")
const fs = require('fs');
const publicKey = fs.readFileSync('./config/jwtRS256.key.pub', 'utf8');
const privateKey = fs.readFileSync('./config/jwtRS256.key', 'utf8');

const { getDb, isolatedDatabase } = require("../config/db");
const model = require('../models/index')
const { STANDARD_TIER } = require('./constants');
const CustomLogger = require("../helpers/customLogger");
const models = require("../models/index");
const log = new CustomLogger()


async function prepareConfigGlobals(authType, orgId, tier) {
    const { db, authProviderConfig } = await setConfig(authType, orgId, tier);
    const { OpenIdConfig } = authProviderConfig;
    const discoveryDocument = await setDiscoveryDocument(OpenIdConfig.DiscoveryDocument);
    return { db, authProviderConfig, discoveryDocument }
}

const getStateBase64 = async () => {
    const pkceCodeVerifier = generatePkceCodeVerifier(40);
    const base64CryptoHash = await generatePkceCodeChallenge(pkceCodeVerifier);
    return base64CryptoHash;
}

// sets PKCE code verifier and code challenge values
const setPkceConfigs = async () => {
    const pkceCodeVerifier = generatePkceCodeVerifier();
    const pkceCodeChallenge = await generatePkceCodeChallenge(pkceCodeVerifier);
    return { pkceCodeVerifier, pkceCodeChallenge }
}

const generatePkceCodeChallenge = async (codeVerifier) => {
    const hash = Crypto.createHash('sha256').update(codeVerifier).digest();
    return Base64Url.encode(hash);
}

const generatePkceCodeVerifier = (size = 43) => {
    return Crypto
        .randomBytes(size)
        .toString('hex')
        .slice(0, size)
}

// setJwks sets the jwks object if it wasn't already set.
const setJwks = async (discoveryDocument) => {
    if (discoveryDocument &&
        (discoveryDocument.jwks_uri === undefined || discoveryDocument.jwks_uri === null)
    ) {
        throw new Error('Unable to find JWK in discovery document');
    }
    return (await axios.get(discoveryDocument.jwks_uri)).data;
}

const setDiscoveryDocument = async (discoveryDocument) => {
    try {
        return (await axios.get(discoveryDocument)).data;
    } catch (error) {
        log.error("setDiscoveryDocument Error=> ", error)
        throw new Error(error);
    }
}

// getNonceAndHash gets a nonce and hash.
const getNonceAndHash = () => { // not in use
    const nonce = Crypto.randomBytes(32).toString('hex');
    const hash = Crypto.createHmac('sha256', nonce).digest('hex'); // not in use
    return { nonce, hash };
}

// validateNonce validates a nonce.
const validateNonce = (nonce, hash) => { // not in use
    const other = Crypto.createHmac('sha256', nonce).digest('hex');
    return other === hash;
}

/**
 * Encrypts a string or JSON object using the RSA public key.
 * @param {string|Object} data - Data to encrypt (string or object).
 * @returns {string} - Base64-encoded encrypted string.
 */
function rsaEncrypt(data) {
  const payload =
    typeof data === 'string' ? data : JSON.stringify(data);

  const bufferData = Buffer.from(payload, 'utf8');

  const encryptedData = Crypto.publicEncrypt(
    {
      key: publicKey,
      padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    bufferData
  );

  return encryptedData.toString('base64');
}

/**
 * Decrypts a base64-encoded string using the RSA private key.
 * Tries to parse JSON, falls back to string.
 * @param {string} encryptedBase64 - Encrypted base64 string.
 * @returns {string|Object} - Decrypted result (parsed JSON or string).
 */
function rsaDecrypt(encryptedBase64) {
  const bufferData = Buffer.from(encryptedBase64, 'base64');

  const decryptedBuffer = Crypto.privateDecrypt(
    {
      key: privateKey,
      padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    bufferData
  );

  const decryptedString = decryptedBuffer.toString('utf8');

  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
}


// setConfig sets the config object to the value from SecretsManager if it wasn't already set.
const setConfig = async (authType, orgId, tier) => {
    if (!tier || tier === STANDARD_TIER) {
        const db = await getDb()
        const authProviderConfig = await model.authProviders.getAuthProvider(db, authType, orgId);
        return { db, authProviderConfig }
    } else {
        const db = await isolatedDatabase(orgId)
        const authProviderConfig = await model.authProviders.getAuthProvider(db, authType, orgId)
        return { db, authProviderConfig }
    }
}

const generateCode = (size) => {
    return Crypto.randomBytes(Math.ceil(size / 2)).toString('hex').slice(0, size);
}

const createAzureADAuthorizationUrl = (templateAuthzUrl, state) => {
    return templateAuthzUrl.replace('<state>', state);
}

const assignUserBalance = async (db, groupIds) => {
    const groupData = await db.collection('Groups').findOne({_id: {$in: groupIds}, GroupType: 'Permissions'})
    const userBalances = groupData && groupData.AssociatedQuotaBalance && groupData.AssociatedQuotaBalance.length > 0 ?
        await db.collection('Groups').find({_id: {$in: groupData.AssociatedQuotaBalance}}).toArray() : []
    let userBalancesFinal = []
    userBalances.forEach(bal => {
        userBalancesFinal.push({
            GroupID: bal._id,
            QuotaBalance: bal.QuotaBalance.Amount
        })
    })
    return userBalancesFinal
}

const getGroupIds = async (db, payload, authProviderConfig) => {
  const { Mappings, CustomerID } = authProviderConfig;
  if(!Mappings.GroupName || !payload[Mappings.GroupName] || payload[Mappings.GroupName].length == 0) {
    return [];
  }
  const role = payload[Mappings.GroupName];
  if (typeof role == "string") {
    const roles = role.split(",").map((r) => r.trim());
    const groupIds = [];
    for (const groupName of roles) {
      const group = await model.groups.getGroup(db, CustomerID, groupName);
      if (group) {
        if (group.PrintConfigurationGroupID) {
          groupIds.push(group.PrintConfigurationGroupID);
        }
        groupIds.push(group._id);
      }
    }
    return groupIds.length > 0 ? groupIds : [];
  } else if (role.length > 0) {
    // if not string then it means array
    const roles = role;
    const groupIds = [];
    for (const groupName of roles) {
      const group = await model.groups.getGroup(db, CustomerID, groupName);
      if (group) {
        if (group.PrintConfigurationGroupID) {
          groupIds.push(group.PrintConfigurationGroupID);
        }
        groupIds.push(group._id);
      }
    }
    return groupIds.length > 0 ? groupIds : [];
  }
};

const getMatchingGroups = async (db, payload, authProviderConfig, hashId, EasybookingRuleTest) => {
  try {
    log.info("** INIT getMatchingGroups **");
    log.info("** payload **", JSON.stringify(payload));

    const allEasyBookingGroups = await db
      .collection("Groups")
      .find({
        GroupType: "EasyBooking",
        IsActive: true,
        IsDeleted: false,
        CustomerID: authProviderConfig.CustomerID,
      })
      .toArray();

    let groupIds = [];
    let allEvaluatedGroups = [];
    let matchedGroup = null;

    if (
      allEasyBookingGroups &&
      Array.isArray(allEasyBookingGroups) &&
      allEasyBookingGroups.length > 0
    ) {
      // Sort groups by priority first (lowest priority number = highest priority)
      const sortedGroups = allEasyBookingGroups.sort(
        (a, b) => a.Priority - b.Priority
      );

      for (const group of sortedGroups) {
        if (!group.IsActive) continue;

        const { GroupName, EasyBooking, Priority, _id } = group;
        log.info("EasyBooking Group ID =>", _id);
        const { EasyBookingGroups: subsets } = EasyBooking || {};

        if (!Array.isArray(subsets) || subsets?.length === 0) {
          continue;
        }

        let groupMatched = false;
        const subsetEvaluations = [];

        for (const subset of subsets) {
          if (!subset.IsActive) continue;

          const { Conditions, EasyBookingGroupName } = subset;
          let allRulesMatch = true;
          const conditionResults = [];

          for (const condition of Conditions) {
            const { Field, Condition, Value, SingleMatch } = condition;
            log.info("Condition =>", condition);
            let responseValue = payload[Field];
            
            let result = {
              Field,
              Condition,
              ExpectedValue: Value,
              ActualValue: responseValue ?? null,
              SingleMatch,
              Matched: false,
            };

            // Rule fails if responseValue not found
            if (responseValue === undefined || responseValue === null) {
              allRulesMatch = false;
              result.Reason = "Field not found in idp response";
              conditionResults.push(result);
              break;
            }

            log.info("responseValue =>", responseValue);

            const responseValueType = getDataType(responseValue);

            if (responseValueType === "string") {
              responseValue = responseValue.split(",").map((val) => val.trim());
            }

            const valuesToCheck = Array.isArray(responseValue)
              ? responseValue
              : [responseValue];

            log.info("valuesToCheck =>", valuesToCheck);

            let ruleMatched = false;

            if (SingleMatch === true) {
              // Only check the first value in the array
              ruleMatched = checkCondition(valuesToCheck[0], Condition, Value);
            } else if (SingleMatch === false) {
              // Check all values in the array, return true if any value matches
              for (const val of valuesToCheck) {
                if (checkCondition(val, Condition, Value)) {
                  ruleMatched = true;
                  break;
                }
              }
            }

            result.Matched = ruleMatched;
            // If any rule doesn't match, break out of the loop
            if (!ruleMatched) {
              allRulesMatch = false;
              result.Reason = `Expected ${Field} to ${Condition} '${Value?.join(", ")}', but got '${result.ActualValue}'`;
              conditionResults.push(result);
              break;
            }
            conditionResults.push(result);
          }

          subsetEvaluations.push({
            SubsetName: EasyBookingGroupName,
            Matched: allRulesMatch,
            ConditionResults: conditionResults,
          });

          // If all rules in the subGroup match, we found our highest priority match
          if (allRulesMatch) {
            groupMatched = true;
            break; // Break out of subset loop since we found a match in this group
          }
        }

        allEvaluatedGroups.push({
          EasyBookingGroupName: GroupName,
          EasyBookingGroupId: _id,
          Priority,
          SubsetEvaluations: subsetEvaluations,
        });

        // If this group matched, get the group data and stop processing
        if (groupMatched) {
          log.info("Group Matched =>", groupMatched);
          const { CustomerID } = authProviderConfig;
          const groupData = await model.groups.getGroup(
            db,
            CustomerID,
            GroupName
          );
          log.info("EasyBooking Group =>", groupData);
          if (groupData) {
            const permissionGroup =
              await model.groups.getPermissionGroupByEasyBookingId(
                db,
                CustomerID,
                groupData._id
              );
            log.info("Permission Group =>", permissionGroup);
            if (permissionGroup) {
              groupIds.push(permissionGroup._id);
              if (permissionGroup.PrintConfigurationGroupID) {
                groupIds.push(permissionGroup.PrintConfigurationGroupID);
              }
              log.info("matching group found =>", {
                groupName: GroupName,
                priority: Priority,
                groupId: _id,
              });
              matchedGroup = {
                EasyBookingGroupName: GroupName,
                EasyBookingGroupId: _id,
                Priority,
                PermissionGroupId: permissionGroup._id,
                PrintConfigurationGroupId: permissionGroup?.PrintConfigurationGroupID || null,
              };
              break; // Break out of main group loop - we found our highest priority match
            }
          }
        }
      }
    }

    const easybookingRuleTestLogs = {
      // Type: "EasyBookingGroupMatching",
      HashID: hashId,
      CustomerID: authProviderConfig.CustomerID,
      TenantDomain: authProviderConfig.OrgID,
      AuthProviderID: authProviderConfig._id,
      RawData: {
        UserPayload: payload,
        MatchedGroup: matchedGroup,
        EvaluatedGroups: allEvaluatedGroups,
      },
      Message: getMatchReason(matchedGroup && matchedGroup?.PermissionGroupId, allEvaluatedGroups),
    };

    if (EasybookingRuleTest === true) {
      console.log("AuditLog =>", JSON.stringify(easybookingRuleTestLogs, null, 2));
      await db.collection("EasybookingRuleTestLogs").insertOne(easybookingRuleTestLogs);
    }

    

    log.info("groupIds => ", JSON.stringify(groupIds));
    return groupIds;
  } catch (error) {
    log.error("matchGroup Error => ", error);
    return [];
  }
};

const getMatchReason = (isMatched, allEvaluatedGroups) => {
  if (!isMatched) {
    return "No EasyBooking group matched any conditions"
  }

  let matchedSubset = null;
  for (const group of allEvaluatedGroups) {
    const { EasyBookingGroupName, EasyBookingGroupId, Priority, SubsetEvaluations } = group;
    if (!Array.isArray(SubsetEvaluations)) continue;

    for (const subset of SubsetEvaluations) {
      if (subset.Matched === true) {
        matchedSubset = {
          EasyBookingGroupName,
          EasyBookingGroupId,
          Priority,
          SubsetName: subset.SubsetName,
          ConditionResults: subset.ConditionResults || [],
        }
      }
    }
  }

  if (matchedSubset) {
    const { EasyBookingGroupName, Priority, SubsetName, ConditionResults } = matchedSubset;
    const toReadable = val => {
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      if (val === undefined || val === null) return 'null';
      return val.toString();
    };
  
    const conditionTexts = ConditionResults?.map(cond => {
      const { Field, Condition, ExpectedValue, ActualValue } = cond;
      const expectedStr = Array.isArray(ExpectedValue)
        ? ExpectedValue.join(', ')
        : ExpectedValue;
      const actualStr = toReadable(ActualValue);
      return `- ${Field} ${Condition.replace(
        /_/g,
        ' '
      )} ${expectedStr} (actual: ${actualStr})`;
    }).join('\n');
  
    return `${EasyBookingGroupName} (Priority: ${Priority}) matched under '${SubsetName}' because:\n${conditionTexts}`;
  }
};

// Function to check conditions
function checkCondition(responseValue, condition, value) {
  if (!Array.isArray(value) || value.length === 0) return false;

  let numVal, numResp;
  switch (condition) {
    case "greater_than":
      numVal = Number(value[0]);
      numResp = Number(responseValue);
      if (isNaN(numVal) || isNaN(numResp)) return false;
      return numResp > numVal;

    case "less_than":
      numVal = Number(value[0]);
      numResp = Number(responseValue);
      if (isNaN(numVal) || isNaN(numResp)) return false;
      return numResp < numVal;

    case "between":
      if (value.length < 2) return false;
      const [min, max] = value.map((v) => Number(v));
      numResp = Number(responseValue);
      if (isNaN(min) || isNaN(max) || isNaN(numResp)) return false;
      return numResp >= min && numResp <= max;

    case "equal":
      if (!responseValue) return false;
      const responseStr = responseValue?.toString()?.toLowerCase();
      // Check if responseValue matches any value in the array
      return value.some(val => val?.toString()?.toLowerCase() === responseStr);

    case "not_equal":
      if (!responseValue) return false;
      const responseStrNe = responseValue?.toString()?.toLowerCase();
      // Check if responseValue does NOT match any value in the array
      return !value.some(val => val?.toString()?.toLowerCase() === responseStrNe);

    case "starts_with":
      if (!responseValue || !value[0]) return false;
      const str = responseValue.toString().toLowerCase();
      const prefix = value[0].toString().toLowerCase();
      return str.startsWith(prefix);

    default:
      return false;
  }
}

function getDataType(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  const type = typeof value;
  if (type === "object" && value === null) {
    return "null";
  }
  return type;
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const assignAuthProviderID = (dbUserObject, userObject, authProviderID) => {
  if (dbUserObject?.AuthProviderID) return;
  userObject.AuthProviderID = authProviderID;
};

/**
 * Parses the input card number(s) into an array of strings.
 * 
 * @param {string | number | string[] | number[]} cardNumber - The card number(s) to be processed.
 * @returns {Array<string>} An array of parsed card numbers as strings.
 */
function parseCardNumbers(cardNumber) {
  if (Array.isArray(cardNumber)) {
    return cardNumber
      .filter(cn => cn != null && cn.toString().trim() !== "")
      .map(cn => cn.toString().trim());
  }

  if (typeof cardNumber === "string") {
    return cardNumber
      .split(",")
      .map(num => num.trim())
      .filter(num => num !== "");
  }

  if (cardNumber != null && cardNumber.toString().trim() !== "") {
    return [cardNumber.toString().trim()];
  }

  return [];
}

async function updateUser({
  db,
  mappedData,
  hashId,
  authProviderConfig,
  dbUser,
}) {
  try {
    log.info("updateUser: mappedData ***", mappedData);
    const _user = {
      HashID: hashId,
      GenerationTimestamp: Date.now(),
    };

    if (mappedData?.PrimaryEmail) {
      const existingEmailUser = await models.users.findUserByEmail(
        db,
        mappedData?.PrimaryEmail,
        authProviderConfig?.OrgID,
        authProviderConfig?._id
      );
      _user.PrimaryEmail = mappedData.PrimaryEmail;
      if (existingEmailUser) {
        log.info(`existingEmailUser******: ${existingEmailUser?.PrimaryEmail} already exists`);
        _user.PrimaryEmail = dbUser.PrimaryEmail;
      }
    }

    if (mappedData?.FirstName) {
      _user.FirstName = mappedData.FirstName
    }

    if (mappedData?.LastName) {
      _user.LastName = mappedData.LastName
    }

    if (mappedData?.Mobile) {
      _user.Mobile = mappedData.Mobile
    }

    if (mappedData?.CardNumber) {
      _user.CardNumber = parseCardNumbers(mappedData.CardNumber)
    }

    if (mappedData?.GroupID?.length) {
      _user.GroupID = mappedData.GroupID
    }

    if (mappedData?.AccountID) {
      _user.AccountID = mappedData?.AccountID;
    }
    if (
      authProviderConfig.AuthProvider === "externalCardValidation" ||
      authProviderConfig.AuthProvider === "wkp"
    ) {
      assignAuthProviderID(
        dbUser,
        _user,
        authProviderConfig.AssociatedIdentityProvider
      );
    } else {
      assignAuthProviderID(dbUser, _user, authProviderConfig._id);
    }
    log.info("updateUser: _user ***", _user);
    await model.users.update(db, _user, dbUser._id);
    log.info("*** user updated successfully ***");
  } catch (error) {
    log.error("updateUser Error => ", error);
    throw error;
  }
}

async function findOrCreateAccount({
  db,
  accountIdFromIdpRes,
  customerID,
}) {
  try {
    let accountId = null;
    if (accountIdFromIdpRes) {
      const accountDetails = await db
        .collection("Accounts")
        .findOne({
          AccountId: accountIdFromIdpRes,
          CustomerID: customerID,
          IsActive: true,
          IsDeleted: false,
        });
      if (!accountDetails) {
        await db.collection("Accounts").insertOne({
          CustomerID: customerID,
          AccountId: accountIdFromIdpRes,
          AccountName: "",
          Description: "",
          Tags: [],
          IsDeleted: false,
          IsActive: true,
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        });
        accountId = accountIdFromIdpRes;
      } else {
        accountId = accountDetails.AccountId;
      }
    }
    return accountId;
  } catch (error) {
    log.error("findOrCreateAccount Error => ", error);
    throw error;
  }
}

const defaultGroupID = async (db, authProviderConfig) => {
  const { DefaultGroupID } = authProviderConfig;
  const defaultGroupSettings = [DefaultGroupID];
  const defaultGroupDetails = await db
    .collection("Groups")
    .findOne({ _id: DefaultGroupID });
  if (defaultGroupDetails.PrintConfigurationGroupID) {
    defaultGroupSettings.push(defaultGroupDetails.PrintConfigurationGroupID);
  }
  return defaultGroupSettings;
};

const processUserWithoutCreation = async ({ db, authProviderConfig, mappedData, hashId, EasybookingRuleTest }) => {
  try {
    log.info("**** INIT processUserWithoutCreation ****", JSON.stringify(mappedData))
    let groups = [];
    if (mappedData.GroupID?.length) {
      const groupData = await db
        .collection("Groups")
        .find({ _id: { $in: mappedData.GroupID } })
        .toArray();

      groups = groupData?.map((group) => {
        return {
          _id: group._id,
          GroupName: group.GroupName,
          GroupType: group.GroupType,
        };
      });
    }
    const userData = {
      CustomerID: authProviderConfig?.CustomerID,
      TenantDomain: authProviderConfig?.OrgID,
      PrimaryEmail: mappedData?.PrimaryEmail,
      Username: mappedData?.Username,
      Group: groups,
      FirstName: mappedData?.FirstName ? mappedData.FirstName : null,
      LastName: mappedData?.LastName ? mappedData.LastName : null,
      CardNumber: mappedData?.CardNumber
        ? parseCardNumbers(mappedData.CardNumber)
        : null,
      Mobile: mappedData?.Mobile ? mappedData.Mobile : null,
    };
    if (EasybookingRuleTest) {
      userData.HashID = hashId;
    }
    return userData
  } catch (error) {
    log.error("Error in processUserWithoutCreation => ", error);
    throw error;
  }
};

module.exports = { prepareConfigGlobals, setDiscoveryDocument, setJwks, getStateBase64, setPkceConfigs,
  generateCode, createAzureADAuthorizationUrl, assignUserBalance, getGroupIds, isValidEmail, assignAuthProviderID, getMatchingGroups, updateUser, parseCardNumbers, getNonceAndHash, validateNonce, rsaEncrypt, rsaDecrypt, findOrCreateAccount, defaultGroupID,
  processUserWithoutCreation
}
