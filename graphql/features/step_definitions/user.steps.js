const request = require('supertest');
const { Given, When, Then, setDefaultTimeout, BeforeAll} = require('@cucumber/cucumber');
const expect = require('chai').expect;
const {config} = require('../configs/config')
const {updateUserBalance, addUser: addUserMutation, updateUserV2, validateCardNumber, validateCardNumberPin, updateUserCardNumber} = require('../mutations/user.mutation')
const { getUser, getUsers, getUsersWithGroupNameDscSorting, getUsersWithGroupNameAscSorting, getUserOverview, findDataExisting } = require('../queries/user')
const JWT = require('jsonwebtoken')
const fs = require('fs')
const path = require("path");
const { handler } = require("../../graphql");
const { getEvent } = require("../mocks/event");
const { addUsageData } = require('../../../memoryDb/usage')

let server
let globalResponse = {}
const {addCustomer} = require("../../../memoryDb/customer");
const {addDevice} = require("../../../memoryDb/device")
const protonData = require("../../../memoryDb/proton");
const emailData = require("../../../memoryDb/email");
const smartphoneData = require("../../../memoryDb/smartphone");
const networkData = require("../../../memoryDb/network");
const {addGroup, addPermissionGroup, addQuotaGroup, updateGroup} = require("../../../memoryDb/group");
const {addUser, fetchToken, findUser, findUserById, findByIdAndUpdateUser} = require("../../../memoryDb/users");
const {addRole} = require("../../../memoryDb/roles");
const {addProfile} = require("../mutations/profile.mutation");
const {getProfile} = require("../queries/profile");
const {addUsage} = require("../mutations/usage.mutation");
const {addPublicUploadRecord} = require("../../../memoryDb/publicUploads");
const {addLicense} = require("../../../memoryDb/license");
const {UploadMultipleFiles, ConfirmFileUpload} = require("../mutations/bucket.mutation");
const { getDevice } = require('../queries/devices');
const { addAccountSync, updateAccountSync, deleteAccountSync, accountSyncStatus } = require('../mutations/accountSync.mutation');
const { getAccountSync } = require('../queries/accountSync');
const {addProton, updateProton, protonDeleted, protonStatus} = require("../mutations/proton.mutation");
const {getProton} = require("../queries/proton");
const {addEmail, emailDeleted, emailStatus, updateEmail} = require("../mutations/email.mutation");
const {getEmail} = require("../queries/email");
const {getBalance, sendTransaction, GetPay88} = require("../queries/payment");
const { addAccount, updateAccount, deleteAccount, accountStatus } = require('../mutations/account.mutation');
const {getSmartphone} = require('../queries/smartphone');
const {addSmartphone, updateSmartphone, smartphoneDeleted, smartphoneStatus} = require('../mutations/smartphone.mutation');
const {getNetwork} = require('../queries/network');
const {addNetwork, updateNetwork, networkDeleted, networkStatus} = require('../mutations/network.mutation');
const { getAccount, getAccounts } = require('../queries/account');
const { addCustomizationText } = require('../mutations/customizationTexts');
const publicKeyFilePath = path.join(__dirname, "../../config/jwtRS256.key.pub");
const publicKey = fs.readFileSync(publicKeyFilePath);
const { addPaymentConfiguration } = require("../mutations/payment.mutation");
const { AddAuthProvider } = require('../mutations/authProvider.mutation');
const { addThingData } = require('../../../memoryDb/things');
const email = require('../queries/email');
const { addPayment } = require('../../../memoryDb/payment');
const {
  addHandWriteRecognition,
  updateHandWriteRecognition,
  updateHandWriteRecognitionStatus,
  deleteHandWriteRecognition,
} = require("../mutations/handWriteRecognition.mutation");
const { getHandWriteRecognition } = require("../queries/handWriteRecognition");
const {
  addRestorePictures,
  updateRestorePictures,
  deleteRestorePictures,
  updateRestorePicturesStatus,
} = require("../mutations/restorePictures.mutation");
const { getRestorePictures } = require("../queries/restorePictures");
const {
  addIlliad,
  updateIlliad,
  deleteIlliad,
  updateIlliadStatus,
} = require("../mutations/illiad.mutation");
const { getIlliad } = require("../queries/illiad");
const {
  addFTP,
  updateFTP,
  deleteFTP,
  updateFTPStatus,
} = require("../mutations/ftp.mutation");
const { getFTP } = require("../queries/ftp");
const {
  addAbby,
  updateAbby,
  deleteAbby,
  updateAbbyStatus,
} = require("../mutations/abby.mutation");
const { getAbby } = require("../queries/abby");
const network = require('../queries/network');
const {addTextTranslation, updateTextTranslation, deleteTextTranslation} = require("../mutations/textTranslation.mutation");
const {getTextTranslation} = require("../queries/textTranslation");
const {
  addAudio,
  updateAudio,
  deleteAudio,
  updateAudioStatus,
} = require("../mutations/audio.mutation");
const { getAudio } = require("../queries/audio");
const {updateJobList} = require("../mutations/jobList.mutation");
const {addJobList} = require("../../../memoryDb/jobList");
const {addDropdowns} = require("../../../memoryDb/dropdowns");

setDefaultTimeout(100000)

server = request(config.url);
let userId;
let context = {};

BeforeAll(async () => {
    const {insertedId: customerId, ops: customerData} = await addCustomer()
    const {insertedId: jobListId, ops: jobListData} = await addJobList()
    const {insertedId: roleId} = await addRole(customerId)
    const {insertedId: groupId, ops: groupData} = await addGroup(customerId)
    const {insertedId: quotaGroupId} = await addQuotaGroup(customerId)
    const {insertedId: licenseId} = await addLicense(customerId)
    const {insertedId: groupPermissionId} = await addPermissionGroup(customerId, roleId, "Apple")
    const {insertedId: groupPermissionId2} = await addPermissionGroup(customerId, roleId, "Z")
    await addDropdowns()
    const {ops: userData} = await addUser([groupId, groupPermissionId], [
          {
              "GroupID" : quotaGroupId,
              "QuotaBalance" : 10
          }
      ],
      customerId, customerData[0].Tier, customerData[0].DomainName)
      await addUser([groupId, groupPermissionId2], [
        {
            "GroupID" : quotaGroupId,
            "QuotaBalance" : 10
        }
    ],
    customerId, customerData[0].Tier, customerData[0].DomainName)
    const {insertedId: deviceId, ops: deviceData} = await addDevice(customerId)
    await protonData.addProton(customerId)
    await emailData.addEmail(customerId)
    await smartphoneData.addSmartphone(customerId)
    await networkData.addNetwork(customerId)
    await addThingData(customerId, deviceId, '')
    config.token = await fetchToken(userData[0])
    config.domainName = customerData[0].DomainName
    config.customerId = customerId
    config.roleId = roleId
    getUser.variables.userId = userData[0]._id
    userId = userData[0]._id
    getUser.variables.customerId = customerData[0]._id
    addProfile.variables.addProfileInput.CustomerID = customerId
    addProfile.variables.addProfileInput.ProfileSetting.PrintConfigurationGroup = groupData[0]._id
    getProfile.variables.customerId = customerId
    getDevice.variables.customerId = customerId
    getDevice.variables.deviceId = deviceData[0]._id
    UploadMultipleFiles.variables.customerId = customerId
    ConfirmFileUpload.variables.customerId = customerId
    updateUserBalance.variables.updateBalance.CustomerID = customerId
    updateUserBalance.variables.updateBalance.UserID = userData[0]._id
    updateUserBalance.variables.updateBalance.AccountID = quotaGroupId
    updateUserBalance.variables.updateBalance.Username = userData[0].Username
    // usage
    addUsage.variables.addUsageInput.CustomerID = customerId
    addUsage.variables.addUsageInput.CustomerName = customerData.CustomerName
    // addUser
    addUserMutation.variables.addUserInput.CustomerID = customerId
    addUserMutation.variables.addUserInput.GroupID = [groupId, groupPermissionId, quotaGroupId]
    addUserMutation.variables.addUserInput.TenantDomain = customerData[0].DomainName
    addAccountSync.variables.addAccountSyncInput.CustomerID = customerId
    updateAccountSync.variables.updateAccountSyncInput.CustomerID = customerId
    updateAccountSync.variables.customerId = customerId
    deleteAccountSync.variables.customerId = customerId
    accountSyncStatus.variables.customerId = customerId
    getAccountSync.variables.customerId = customerId
    addProton.variables.addProtonInput.CustomerID = customerId
    updateProton.variables.updateProtonInput.CustomerID = customerId
    updateProton.variables.customerId = customerId
    protonDeleted.variables.customerId = customerId
    protonStatus.variables.customerId = customerId
    getProton.variables.customerId = customerId
    addEmail.variables.addEmailInput.CustomerID = customerId
    addSmartphone.variables.addSmartphoneInput.CustomerID = customerId
    addNetwork.variables.addNetworkInput.CustomerID = customerId
    updateEmail.variables.updateEmailInput.CustomerID = customerId
    updateSmartphone.variables.updateSmartphoneInput.CustomerID = customerId
    updateSmartphone.variables.customerId = customerId
    updateNetwork.variables.updateNetworkInput.CustomerID = customerId
    updateNetwork.variables.customerId = customerId
    updateEmail.variables.customerId = customerId
    emailDeleted.variables.customerId = customerId
    smartphoneDeleted.variables.customerId = customerId
    networkDeleted.variables.customerId = customerId
    emailStatus.variables.customerId = customerId
    smartphoneStatus.variables.customerId = customerId
    networkStatus.variables.customerId = customerId
    getEmail.variables.customerId = customerId
    getSmartphone.variables.customerId = customerId
    getNetwork.variables.customerId = customerId
    addHandWriteRecognition.variables.addHandWriteRecognitionInput.CustomerID = customerId
    updateHandWriteRecognition.variables.customerId.CustomerID = customerId
    updateHandWriteRecognition.variables.customerId = customerId
    deleteHandWriteRecognition.variables.customerId = customerId
    addTextTranslation.variables.addTextTranslationInput.CustomerID = customerId
    updateTextTranslation.variables.customerId.CustomerID = customerId
    deleteTextTranslation.variables.customerId = customerId
    getTextTranslation.variables.customerId = customerId
    updateHandWriteRecognitionStatus.variables.customerId = customerId
	  getHandWriteRecognition.variables.customerId = customerId
    // RestorePictures
    addRestorePictures.variables.addRestorePicturesInput.CustomerID = customerId
    updateRestorePictures.variables.customerId.CustomerID = customerId
    updateRestorePictures.variables.customerId = customerId
    deleteRestorePictures.variables.customerId = customerId
    updateRestorePicturesStatus.variables.customerId = customerId
	  getRestorePictures.variables.customerId = customerId
    // Illiad
    addIlliad.variables.addIlliadInput.CustomerID = customerId
    updateIlliad.variables.customerId.CustomerID = customerId
    updateIlliad.variables.customerId = customerId
    deleteIlliad.variables.customerId = customerId
    updateIlliadStatus.variables.customerId = customerId
	  getIlliad.variables.customerId = customerId
    //ftp
    addFTP.variables.addFtpInput.CustomerID = customerId
    updateFTP.variables.customerId.CustomerID = customerId
    updateFTP.variables.customerId = customerId
    deleteFTP.variables.customerId = customerId
    updateFTPStatus.variables.customerId = customerId
	  getFTP.variables.customerId = customerId
    //abby
    addAbby.variables.addAbbyInput.CustomerID = customerId
    updateAbby.variables.customerId.CustomerID = customerId
    updateAbby.variables.customerId = customerId
    deleteAbby.variables.customerId = customerId
    updateAbbyStatus.variables.customerId = customerId
	  getAbby.variables.customerId = customerId
    //audio
    addAudio.variables.addAudioInput.CustomerID = customerId
    updateAudio.variables.customerId.CustomerID = customerId
    updateAudio.variables.customerId = customerId
    deleteAudio.variables.customerId = customerId
    updateAudioStatus.variables.customerId = customerId
	  getAudio.variables.customerId = customerId
    
    getBalance.variables.getBalanceInput.CustomerId = customerId
    sendTransaction.variables.sendTransactionInput.CustomerId = customerId

    addPaymentConfiguration.variables.addPaymentInput.CustomerID = customerId
    AddAuthProvider.variables.addAuthProviderInput.CustomerID = customerId

    addAccount.variables.addAccountInput.CustomerID = customerId
    updateAccount.variables.updateAccountInput.CustomerID = customerId
    // updateUserV2
    const { insertedId: permissionGroup } = await addPermissionGroup(customerId, roleId)
    const { insertedId: quotaGroupId2 } = await addQuotaGroup(customerId)
    await updateGroup(permissionGroup, {
        AssociatedQuotaBalance: [quotaGroupId2],
    });
    await updateGroup(quotaGroupId2, {
        QuotaBalance: {
            Scheduled: false,
            MaxBalance: 30,
            Amount: 20,
            Day: "",
        },
    });
    updateUserV2.variables.CustomerID = customerId
    updateUserV2.variables.userId = userData[0]._id
    updateUserV2.variables.GroupID = [permissionGroup]
    await addPublicUploadRecord(customerId)
    // validateCardNumber
    validateCardNumber.variables.customerId = customerId
    validateCardNumber.variables.cardNumber = userData[0].CardNumber[0]
    // validateCardNumberPin
    validateCardNumberPin.variables.cardNumber = userData[0].CardNumber[0]
    validateCardNumberPin.variables.pin = "123"
    validateCardNumberPin.variables.customerId = customerId
    // getUserOverview
    getUserOverview.variables.customerId = customerId
    getUserOverview.variables.userId = userData[0]._id
    addCustomizationText.variables.addCustomizationTextInput.CustomerID = customerId
    updateJobList.variables.updateJobListInput.CustomerID = customerId
    updateJobList.variables.jobListId = jobListId
    //findDataExisting
    findDataExisting.variables.customerId = customerId
    
    const { insertedId: paymentId } = await addPayment(customerId, "Pay88");
    GetPay88.variables.pay88SignatureInput.CustomerID = customerId;
    GetPay88.variables.pay88SignatureInput.PaymentID = paymentId;
})

/**
 * Scenario: calling getUser before updating balance
 */


Given('a valid graphql query for getUser before updating balance', () => {
    return getUser.query
})

When('user provide a valid input for getUser before updating balance', () => {
    return getUser.variables
})

When('user called the getUser query before updating balance',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getUser)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.getUser = res.res;
          callback()
      });
});

Then('response should be status 200 for getUser before updating balance', () => {
    expect(globalResponse.getUser.statusCode).to.equal(200);
});


Then('we get the response of that user details before updating balance', () => {
    const user = JSON.parse(globalResponse.getUser.text).data.getUser
    console.log(user);
    expect(user.GroupQuotas[0]).to.exist
    expect(user.GroupQuotas[0].GroupID).to.exist
    expect(user.GroupQuotas[0].QuotaBalance).to.exist
    expect(user.DebitBalance).to.exist
});


/**
 * Scenario: Mutation to update a user balance
 */

Given('a valid graphql mutation for updateUserBalance', () => {
    return updateUserBalance.mutation
})

When('user provide a valid mutation input for updateUserBalance', () => {
    // updateUserBalance.variables.updateBalance.Type = "DEBIT"
    return updateUserBalance.variables.updateBalance
})

Then('response should be status 200 for updateUserBalance', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(updateUserBalance)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.updateUserBalanceResponse = res.res;
          expect(globalResponse.updateUserBalanceResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('response will update the user balance for updateUserBalance', () => {
    const updateUserBalanceResponse = JSON.parse(globalResponse.updateUserBalanceResponse.text)
    expect(updateUserBalanceResponse.data.updateUserBalance.statusCode).to.be.equals(200)
})


/**
 * Scenario: Mutation to update a user balance when type is Debit
 */


Given('a valid graphql mutation for type Debit', () => {
    return updateUserBalance.mutation
})

When('user provide a valid mutation input as Debit', function() {
    updateUserBalance.variables.updateBalance.Type = "DEBIT"
    updateUserBalance.variables.updateBalance.AccountID = "debit"
    return updateUserBalance.variables
})

Then('response should be status 200 for Type Debit', (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(updateUserBalance)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.updateUserBalanceResponse = res.res;
          expect(globalResponse.updateUserBalanceResponse.statusCode).to.equal(200);
          callback()
      });
})

Then('response will update the user balance for type as Debit', () => {
    const updateUserBalanceResponse = JSON.parse(globalResponse.updateUserBalanceResponse.text)
    expect(updateUserBalanceResponse.data.updateUserBalance.statusCode).to.be.equals(200)
})


/**
 * Scenario: It should contain the updated balance in getUser
 */


Given('a valid graphql query for getUser', () => {
    return getUser.query
})

When('user provide a valid input for getUser', () => {
    return getUser.variables
})

When('user called the getUser query to check updated balance',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getUser)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for getUser', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('we get the response of that user details', () => {
    const user = JSON.parse(globalResponse.response.text).data.getUser
    const oldUserRecord = JSON.parse(globalResponse.getUser.text).data.getUser
    expect(user.GroupQuotas[0].QuotaBalance).to.be.deep.equal((oldUserRecord.GroupQuotas[0].QuotaBalance) + 10)
    expect(user.DebitBalance).to.be.equals((oldUserRecord.DebitBalance) + 10)
});

/**
 * Scenario: It should send set password link via email in addUser
 */

Given('a valid graphql Mutation for addUser', () => {
    return addUserMutation.query
})

When('user provide a valid input for addUser', () => {
    return addUserMutation.variables
})

When('user called the addUser Mutation to add user',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(addUserMutation)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          callback()
      });
});

Then('response should be status 200 for addUser', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('user records should contain ResetPasswordToken untill password is set', async () => {
    const user = await findUser("test", config.domainName)
    expect(user).to.have.any.keys('ResetPasswordToken');
    expect(user.ResetPasswordToken).to.be.a('string');
});

/**
 * Scenario: It should contain the updated quota group in updateUserV2
 */

Given("a valid graphql mutation for updateUserV2", async () => {
    return updateUserV2.query;
  });
  
  When('user provide a valid mutation input for updateUserV2', (callback) => {
      server.post('/graphql')
        .set('apikey', config.apiTestKey)
        .set('tier', config.tier)
        .set('authorization',config.token)
        .set('subdomain', config.domainName)
        .send(updateUserV2)
        .end(function (err, res) {
            if (err) {
                callback(err);
            }
            globalResponse.response = res.res;
            globalResponse.response.GroupID = updateUserV2.variables.GroupID
            callback()
        });
  })
  
  Then('response should be status 200 for updateUserV2', () => {
      expect(globalResponse.response.statusCode).to.equal(200);
  });
  
  Then('Then response will update the user GroupQuotas for updateUserV2',async () => {
      const userData = await findUserById(userId);
      expect(userData.GroupQuotas.length).to.greaterThan(0);
      expect(userData.GroupQuotas[0]).to.have.property('QuotaBalance', 20); // to enure GroupQuotas is updated
  });

/**
 * Scenario: It should contain the Validate card number
 */

Given("a valid graphql mutation for validateCardNumber", async () => {
    return validateCardNumber.query;
});

When("user provide a valid mutation for the validate card number", (callback) => {
    server.post("/graphql")
        .set("apikey", config.apiTestKey)
        .set("tier", config.tier)
        .set("authorization", config.token)
        .set("subdomain", config.domainName)
        .send(validateCardNumber)
        .end(function (err, res) {
            
            if (err) {
                callback(err);
            }
          
            globalResponse.response = res.res;
            callback();
        });
});

Then("response should be status 200 for validateCardNumber", () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then("response should include a token with a 4-hour expiration time for validating the card number", async () => {
    const responseBody = JSON.parse(globalResponse.response.text);
    const userSession = responseBody.data.validateCardNumber;

    expect(userSession).to.have.property("Token");

    const decodedToken = await JWT.verify(userSession.Token, publicKey);
    expect(decodedToken.exp).to.be.greaterThan(Math.floor(Date.now() / 1000));
});

/**
 * Scenario: It should contain the Validate card number pin
 */

Given("a valid graphql mutation for validateCardNumberPin", async () => {
    return validateCardNumberPin.query;
});

When("user provide a valid mutation for the validate card number pin", (callback) => {
    server.post("/graphql")
        .set("apikey", config.apiTestKey)
        .set("tier", config.tier)
        .set("authorization", config.token)
        .set("subdomain", config.domainName)
        .send(validateCardNumberPin)
        .end(function (err, res) {

            if (err) {
                callback(err);
            }
          
            globalResponse.response = res.res;
            callback();
        });
});

Then("response should be status 200 for validateCardNumberPin", () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then("response should include a token with a 4-hour expiration time for validating the card number pin", async () => {
    const responseBody = JSON.parse(globalResponse.response.text);
    const userSession = responseBody.data.validateCardNumberPin;

    expect(userSession).to.have.property("Token");

    const decodedToken = await JWT.verify(userSession.Token, publicKey);
    expect(decodedToken.exp).to.be.greaterThan(Math.floor(Date.now() / 1000));
});


/**
 * Scenario: Successfully get all Users data in getUsers
 */


Given('a valid graphql query for getUsers', () => {
    return getUsers.query
})

When('user provide a valid input for getUsers', () => {
    return getUsers.variables
})

When('user called the getUsers query to get all users data',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getUsers)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          
          callback()
      });
});

Then('response should be status 200 for getUsers', () => {
    expect(globalResponse.response.statusCode).to.equal(200);
});

Then('response should always contains permission group at 0th index', () => {
    const response = JSON.parse(globalResponse.response.text).data.getUsers
    const users = response.user
    users.forEach(user => {
        if (user.GroupData.length > 0) {
            expect(user.GroupData[0].GroupType).to.equal("Permissions");
        }
    });
});


/**
* Scenario: Successfully get all Users data with groupName sorting in descending order
*/

Given('a valid graphql with pagination query for getUsers in descending order', () => {
    return getUsersWithGroupNameDscSorting.query
})

When('user provide a valid input with pagination for getUsers in descending order', () => {
    return getUsersWithGroupNameDscSorting.variables
})

When('user called the getUsers query with pagination data to get all users data in descending order',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getUsersWithGroupNameDscSorting)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          
          callback()
      });
});


Then('response should contain Sort group names in descending order, with starting with "Z" at the top', () => {
  const response = JSON.parse(globalResponse.response.text).data.getUsers;

  const users = response.user;
  if (users.length > 1) {
    // Compare first user's first GroupName with second user's first GroupName
    const firstUserGroupName =
      users[0].GroupData && users[0].GroupData[0]
        ? users[0].GroupData[0].GroupName.trim()
        : "";

    expect(firstUserGroupName).to.equal("Z");
  }
});

/**
* Scenario: Successfully get all Users data with groupName sorting in ascending order
*/

Given('a valid graphql with pagination query for getUsers in ascending order', () => {
    return getUsersWithGroupNameAscSorting.query
})

When('user provide a valid input with pagination for getUsers in ascending order', () => {
    return getUsersWithGroupNameAscSorting.variables
})

When('user called the getUsers query with pagination data to get all users data in ascending order',  (callback) => {
    server.post('/graphql')
      .set('apikey', config.apiTestKey)
      .set('tier', config.tier)
      .set('authorization',config.token)
      .set('subdomain', config.domainName)
      .send(getUsersWithGroupNameAscSorting)
      .end(function (err, res) {
          if (err) {
              callback(err);
          }
          globalResponse.response = res.res;
          
          callback()
      });
});


Then('response should contain Sort group names in ascending order, with starting with "A" at the top', () => {
  const response = JSON.parse(globalResponse.response.text).data.getUsers;

  const users = response.user;
  if (users.length > 1) {
    // Compare first user's first GroupName with second user's first GroupName
    const firstUserGroupName =
      users[0].GroupData && users[0].GroupData[0]
        ? users[0].GroupData[0].GroupName.trim()
        : "";

    expect(firstUserGroupName).to.equal("Apple");
  }
});

Given("a valid GraphQL query for getUserOverview", async () => {
  const userData = await findUserById(getUserOverview.variables.userId);

  await addUsageData("print", config.customerId, userData.Username, "Letter");
  await addUsageData("print", config.customerId, userData.Username, "A4");
  await addUsageData("add_value", config.customerId, userData.Username, "A3");
  await addUsageData(
    "add_value",
    config.customerId,
    userData.Username,
    "Legal"
  );
  return getUserOverview.query;
});

When("the user provides a valid input for getUserOverview", () => {
  return getUserOverview.variables;
});

When(
  "the user calls the getUserOverview query to fetch user data",
  async () => {
    const event = getEvent(getUserOverview);

    context = { data: { customerIdsStrings: [config.customerId] } };

    try {
      const response = await handler(event, context);
      response.body = JSON.parse(response.body);
      globalResponse.response = response;
    } catch (error) {
      console.error("Error in Lambda Handler:", error);
      throw error;
    }
  }
);

Then("the response status should be 200 for getUserOverview", () => {
  expect(globalResponse.response.statusCode).to.equal(200);
});

Then(
  "the response should contain the keys: user, transaction, and usage",
  () => {
    const requiredKeys = ["user", "transaction", "usage"];
    const isKeyPresent = requiredKeys.every(
      (key) => key in globalResponse.response?.body?.data?.getUserOverview
    );
    expect(isKeyPresent).to.be.true;
  }
);

Given(
  "a valid GraphQL query for getUserOverview to sort usage data in ascending order",
  () => {
    return getUserOverview.query;
  }
);

When(
  "the user provides a valid input for getUserOverview to sort usage data in ascending order",
  () => {
    getUserOverview.variables.usagePaginationInput.limit = 2;
    getUserOverview.variables.usagePaginationInput.pageNumber = 1;
    getUserOverview.variables.usagePaginationInput.sort = "asc";
    getUserOverview.variables.usagePaginationInput.sortKey = "Print.PaperSize";
    getUserOverview.variables.transactionFilters.reportType = "add_value";
    getUserOverview.variables.usageFilters.reportType = "print";
    return getUserOverview.variables;
  }
);

Then(`the response should contain usage data sorted in ascending order`, () => {
  const usageData =
    globalResponse.response.body.data.getUserOverview.usage.usage;
  const isSortedAscending = usageData.every((item, index, arr) => {
    return (
      index === 0 || item.Print.PaperSize >= arr[index - 1].Print.PaperSize
    );
  });

  expect(isSortedAscending).to.be.true;
});

Given(
  "a valid GraphQL query for getUserOverview to sort transaction data in descending order",
  () => {
    return getUserOverview.query;
  }
);

When(
  "the user provides a valid input for getUserOverview to sort transaction data in descending order",
  () => {
    getUserOverview.variables.transactionPaginationInput.limit = 2;
    getUserOverview.variables.transactionPaginationInput.pageNumber = 1;
    getUserOverview.variables.transactionPaginationInput.sort = "dsc";
    getUserOverview.variables.transactionPaginationInput.sortKey =
      "Print.PaperSize";
    getUserOverview.variables.transactionFilters.reportType = "add_value";
    getUserOverview.variables.usageFilters.reportType = "print";
    return getUserOverview.variables;
  }
);

Then(
  `the response should contain transaction data sorted in descending order`,
  () => {
    const transactionData =
      globalResponse.response.body.data.getUserOverview.transaction.usage;

    const isSortedDescending = transactionData.every((item, index, arr) => {
      return (
        index === 0 || item.Print.PaperSize <= arr[index - 1].Print.PaperSize
      );
    });

    expect(isSortedDescending).to.be.true;
  }
);

Given(
  "the user requests getUserOverview with pagination input for page 1 and a limit of 2",
  async () => {
    getUserOverview.variables.transactionPaginationInput.limit = 2;
    getUserOverview.variables.transactionPaginationInput.pageNumber = 1;
    getUserOverview.variables.transactionFilters.reportType = "add_value";
    getUserOverview.variables.usageFilters.reportType = "print";
    return getUserOverview.variables;
  }
);

Then("the response should contain at most 2 usages or transaction entries", () => {
  const transactionData =
    globalResponse.response.body.data.getUserOverview.transaction.usage;
  expect(transactionData.length).to.lessThanOrEqual(2);
});

Given("I have a valid user input with isActive set to true", () => {
  addUserMutation.variables.addUserInput.IsActive = true
});

When("I send a request to add user", async function () {
const event = getEvent(addUserMutation);

try {
  const response = await handler(event, context);
  response.body = JSON.parse(response.body);
  globalResponse.response = response;
} catch (error) {
  console.error("Error in Lambda Handler:", error);
  throw error;
}
});

Then(
"the response of user should have status code {int}",
function (statusCode) {
  expect(statusCode).to.equal(globalResponse.response.statusCode);
}
);

Given("I have a valid user input with existing primary email", () => {
  addUserMutation.variables.addUserInput.PrimaryEmail = "PrimaryEmail"
});

When("I send a request to create a user with a existing primary email", async function () {
const event = getEvent(addUserMutation);

try {
  const response = await handler(event, context);
  response.body = JSON.parse(response.body);
  globalResponse.response = response;
} catch (error) {
  console.error("Error in Lambda Handler:", error);
  throw error;
}
});

Then("the response should contain an error message indicating that a user already exists with the same", () => {
  const errors =
    globalResponse.response.body.errors;
     expect(errors).to.be.an("array").that.is.not.empty;
    expect(errors[0].message).to.equal("Username already exists");
});

Given("a valid graphql query for findDataExisting Thing display name", () => {
  return findDataExisting.query;
});

When(
  "the user provides a valid input for add new thing label name is {string}", async(displayName) => {
    findDataExisting.variables.validationCheckInput.collectionName = "Things";
    findDataExisting.variables.validationCheckInput.fieldName = "Label";
    findDataExisting.variables.validationCheckInput.fieldValue = displayName;

    return findDataExisting.variables;
  }
);

When("I send a request to add new thing", async function () {
  const event = getEvent(findDataExisting);

  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in Lambda Handler:", error);
    throw error;
  }
});

Then("the response should contain the message {string}", function (expectedMessage) {
  const actualMessage = globalResponse.response.body.data.findDataExisting.message;
  expect(actualMessage).to.equal(expectedMessage);
});

// Scenario: Adding first card
Given('the user has no card numbers', async () => {
    await findByIdAndUpdateUser(userId, {
      CardNumber: []
    })
});

When("I update the user with card number {string}", async (cardNumber) => {
  updateUserCardNumber.variables.userId = userId;
  updateUserCardNumber.variables.updateUserInput.CustomerID = config.customerId;
  updateUserCardNumber.variables.updateUserInput.CardNumber = cardNumber;

  const event = getEvent(updateUserCardNumber);
  try {
    const response = await handler(event, context);
    response.body = JSON.parse(response.body);
    globalResponse.response = response;
  } catch (error) {
    console.error("Error in handler:", error);
    throw error;
  }
});

Then('the user should have {string} as the main card', async (expectedCard) => {
  const user = await findUserById(userId);
  expect(user.CardNumber[0]).to.equal(expectedCard);
});

Then('the total number of cards should be {int}', async (expectedCount) => {
  const user = await findUserById(userId);
  expect(user.CardNumber.length).to.equal(expectedCount);
});

// Scenario: Adding second card when main card exists
Given("the user has {string} as the main card", async (card) => {
  await findByIdAndUpdateUser(userId, {
    CardNumber: [card]
  })
});

Then("{string} should be card 1", async (expectedCard) => {
  const user = await findUserById(userId);
  expect(user.CardNumber[1]).to.equal(expectedCard);
});

Then('{string} should be at index {int}',async function (expectedCard, index) {
  const user = await findUserById(userId);
    expect(user.CardNumber[index]).to.equal(expectedCard);
});

Given("the user has the following cards in order:", async (dataTable) => {
  const cards = dataTable.raw().map(row => row[0]);
  await findByIdAndUpdateUser(userId, {
    CardNumber: cards
  })
});

Then('{string} should be removed',async function (removedCard) {
    const user = await findUserById(userId);
    expect(user.CardNumber).to.not.include(removedCard);
});