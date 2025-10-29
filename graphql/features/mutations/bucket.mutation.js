const { faker } = require('@faker-js/faker');

module.exports = {
    UploadMultipleFiles: {
        "operationName":"uploadMultipleFiles",
        query: `mutation uploadMultipleFiles($customerId: ID, $path: ServiceName, $fileInput: [FileMetaData]) {
          uploadMultipleFiles(customerId: $customerId, path: $path, fileInput: $fileInput) {
            id
            signedUrls {
              signedUrl
              originalFileName
              newFileName
              postSignedMeta
              expiryTime
            }
          }
        }`,
        variables: {
            "customerId": "6231ce19932e27000985ba60",
            "path": "TranslationService",
            "fileInput": [
                {
                    "fileName": "helloworld",
                    "extension": "docx"
                }
            ]
        }
    },
    ConfirmFileUpload: {
        query: `mutation ConfirmFileUpload($customerId: ID, $recordId: ID, $confirmFileUploadData: ConfirmFileUpload) {
          confirmFileUpload(customerId: $customerId, recordId: $recordId, confirmFileUploadData: $confirmFileUploadData) {
            CustomerID
            DeliveryMethod {
              EmailAddress
              SessionID
              ThingID
            }
            IsJobProcessed
            JobList {
              NewFileNameWithExt
              OriginalFileNameWithExt
              Platform
              UploadedFrom
            }
            Username
          }
        }`,
        variables: {
          "customerId":  "6231ce19932e27000985ba60",
          "recordId": "",
          "confirmFileUploadData": {
            "DeliveryMethod": {
              "SessionID": "sess1234",
              "EmailAddress": "sppanya.mishra@tbsit360.com",
              "ThingID": "62e2a0cd925f2a00098750ca"
            },
            "IsJobProcessed": true,
            "JobList": [
              {
                "JobExpired": false,
                "NewFileNameWithExt": "",
                "OriginalFileNameWithExt": "hello.docx",
                "Platform": "graphql",
                "UploadedFrom": "dev"
              }
            ],
            "SourceLanguage": "en",
            "TargetLanguage": "hi",
            "Username": faker.internet.userName(),
          }
        }
    }
}