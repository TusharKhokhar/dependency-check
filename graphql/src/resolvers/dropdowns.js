const { getDb } = require('../../config/dbHandler')
const { Dropdowns } = require('../../models/collections')
const CustomLogger = require("../../helpers/customLogger");
const { verifyUserAccess } = require('../../helpers/util');
const log = new CustomLogger()
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter');

const permissionMapping = {
  Add_Proton: "ProtonIntegration",
  Add_Account_Sync: "AccountSyncIntegration",
  Add_Email: "EmailIntegration",
  Add_Handwrite_Recognition: "HandwriteRecognitionIntegration",
  Add_Restore_Pictures: "RestorePicturesIntegration",
  Add_Illiad: "IlliadIntegration",
  Add_Smartphone: "SmartphoneIntegration",
  Add_FTP: "FTPIntegration",
  Add_Abby: "AbbyIntegration",
  Add_Fax_Integration: "FaxIntegration",
  Add_Network: "NetworkIntegration",
  Add_Text_Translation: "TextTranslationIntegration",
  Add_Audio: "AudioIntegration",
};

const collectionMapping = {
  Add_Proton: "Protons",
  Add_Account_Sync: "AccountSync",
  Add_Email: "Emails",
  Add_Handwrite_Recognition: "HandwriteRecognition",
  Add_Restore_Pictures: "RestorePictures",
  Add_Illiad: "Illiad",
  Add_Smartphone: "Smartphones",
  Add_FTP: "FTP",
  Add_Abby: "Abby",
  Add_Fax_Integration: "Fax",
  Add_Network: "Networks",
  Add_Text_Translation: "TextTranslation",
  Add_Audio: "Audio",
};

async function getActiveRecordCount(db, collectionName, customerId) {
  return db
    .collection(collectionName)
    .countDocuments({
      CustomerID: customerId,
      IsDeleted: false,
    });
}

module.exports = {
  Query: {
    async getDropdowns (_, { customerId }, context) {
      log.lambdaSetup(context, 'dropdowns', 'getDropdowns')
      try {
        const customerObjectId = ObjectId.createFromHexString(customerId || context.data?.CustomerID);
        if (customerObjectId) {
          verifyUserAccess(context, customerObjectId);
        }
        const db = await getDb()
        const data = await db.collection(Dropdowns).findOne({});

        if (!data || !data.ThirdPartySoftwareType) {
          return data;
        }
        const userPermissions = context.data.user.Permissions || [];
        let allowThirdPartySoftwareType = userPermissions
          .map(permission => permissionMapping[permission])
          .filter(mapped => mapped && data.ThirdPartySoftwareType.includes(mapped));

        
        for (const [key, value] of Object.entries(permissionMapping)) {
          const collectionName = collectionMapping[key];
          const recordCount = await getActiveRecordCount(db, collectionName, customerObjectId);
          if (recordCount === 1) {
            allowThirdPartySoftwareType = allowThirdPartySoftwareType.filter(type => type !== value);
          }
        }

        return {
          ...data,
          ThirdPartySoftwareType: allowThirdPartySoftwareType
        };
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
