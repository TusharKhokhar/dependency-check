const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Profiles'
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');

module.exports = {
    addProfile: async (customerId, printConfigId) => {
        const db = await getDb()
        const {insertedId} = await db.collection(collectionName).insertOne(
          {
              "Profile" : faker.lorem.word(),
              "ProfileType" : "Driver",
              "CustomerID" : customerId,
              "Description" : null,
              "Tags" : [ ],
              "ProfileSetting" : {
                  "PrintConfigurationGroup" : printConfigId,
                  "PromptForPrinter" : false,
                  "AutomaticPrintDelivery" : true,
                  "DisableConfirmation" : true,
                  "Description" : "this is description"
              },
              "Priority" : null,
              "Login" : null,
              "Driver" : {
                  "ValidationType" : "GuestName",
                  "Default" : false,
                  "ConfirmationMessagedescription" : "Confirm",
                  "PromptMessage" : "Enter Guest Name",
                  "Identifier" : "Guest Name",
                  "PasswordEnabled" : null,
                  "PasswordField" : "",
                  "Location" : false,
                  "Locationprompt" : null,
                  "LocationId" : "",
                  "EditDocName" : false,
                  "RememberMeDisplay" : false,
                  "RememberMeSet" : false,
                  "LoginOption" : "",
                  "IdentitiyProviderID" : ""
              },
              "HideFromList" : false,
              "AutoUpdate" : false,
              "CreatedBy" : ObjectId.createFromHexString(),
              "CreatedAt" : moment().format(),
              "UpdatedAt" : moment().format(),
              "IsActive" : true,
              "IsDeleted" : false
          })
        return insertedId
    },
}