const {getDb} = require('../publicAuth/config/db')
const collectionName = 'PublicUploads'
const moment = require("../publicAuth/node_modules/moment");

// Helper function to create the base structure of the upload record
const createBaseRecord = (customerId, fileName, releaseCode, orientation = "Landscape") => {
    return {
        "IsProcessedFileName": [
            {
                "FileName": fileName,
                "IsProcessed": true
            }
        ],
        "ExpireJobRecord": null,
        "IsJobProcessed": true,
        "AutomaticPrintDelivery": false,
        "ComputerName": null,
        "CustomerID": customerId,
        "DeviceID": null,
        "DeviceName": null,
        "Email": "",
        "GuestName": null,
        "IsDelivered": false,
        "IsPrinted": false,
        "JobExpired": false,
        "JobList": [
            {
                "Copies": 1,
                "Color": "Grayscale",
                "Duplex": false,
                "PaperSize": "Legal",
                "Orientation": orientation,
                "TotalPagesPerFile": 1,
                "PageRange": "1-1",
                "OriginalFileNameWithExt": "log.png",
                "NewFileNameWithExt": fileName,
                "UploadStatus": true,
                "IsDeleted": false,
                "IsPrinted": false,
                "PrintCounter": 0,
                "App": "",
                "Staple": "None",
                "UploadedFrom": "web"
            }
        ],
        "LibraryCard": null,
        "LocationID": null,
        "PrintCounter": 0,
        "ReleaseCode": releaseCode,
        "Text": "",
        "TotalCost": 10,
        "Username": "aakash"
    };
};

module.exports = {
    addPublicUploadRecordConfirmUpload: async () => {
        const db = await getDb()
        const {insertedId} = await db.collection(collectionName).insertOne(
          {
            "IsProcessedFileName" : [
                {
                    "FileName" : "ba7572dc-0aa2-436f-8cb5-9169921195f5.pdf",
                    "IsProcessed" : false
                }
            ],
              CreatedAt: moment().format(),
              ExpireJobRecord: new Date(),
              IsJobProcessed: false
        })
        return insertedId
    },
    addTranslationRecord: async (customerId) => {
        const db = await getDb()
        const {insertedId} = await db.collection('TranslationUploads').insertOne({
            "IsProcessedFileName" : [
                {
                    "FileName" : "5f9761a7-d692-454a-b606-0e59dbe11392.pdf",
                    "IsProcessed" : true
                }
            ],
            "CreatedAt" : new Date("2024-08-01T14:43:11.000Z"),
            "CustomerID" : customerId,
            "DeliveryMethod" : {
                "EmailAddress" : "manthan.sharma@tbsit360.com",
                "SessionID" : "sess1234"
            },
            "ExpireJobRecord" : null,
            "IsDelivered" : false,
            "IsTranslated" : true,
            "JobExpired" : false,
            "JobList" : [
                {
                    "JobExpired" : false,
                    "OriginalFileNameWithExt" : "hello.docx",
                    "NewFileNameWithExt" : "5f9761a7-d692-454a-b606-0e59dbe11392.pdf",
                    "Platform" : "graphql",
                    "UploadedFrom" : "dev",
                    "IsTranslated" : false
                }
            ],
            "SourceLanguage" : "en",
            "TargetLanguage" : "hi",
            "Username" : "matthew",
            // "TranslationStartTime" : new Date("2024-08-01T14:43:40.000Z"),
            // "TranslationStatus" : "Succeeded",
            // "TranslationTrackID" : "a6b7dcc3-16b4-45fd-8e06-e68da2a73223",
            // "TotalCharacterCharged" : 1127,
            // "TranslationEndTime" : new Date("2024-08-01T14:43:57.000Z")
        })
        return insertedId
    },
    addPublicUploadRecord: async (customerId) => {
      const db = await getDb();

      // Insert the first record with "Landscape" orientation
      const firstRecordData = createBaseRecord(
        customerId,
        "systemfilename.pdf",
        "12345678",
        "Landscape"
      );
      await db.collection(collectionName).insertOne(firstRecordData);

      // Insert the second record with "AsSaved" orientation
      const secondRecordData = createBaseRecord(
        customerId,
        "systemfilename1.pdf",
        "12345679",
        "AsSaved"
      );
      return await db.collection(collectionName).insertOne(secondRecordData);
    },
}