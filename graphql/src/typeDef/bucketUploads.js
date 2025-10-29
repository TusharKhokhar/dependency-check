const typeDef = `#graphql
    type File {
        signedUrl: String,
        postSignedMeta: String,
        originalFileName: String,
        newFileName: String,
        expiryTime: String
    }
    
    input FileInput {
        fileName: String,
        extension: String,
        customization: Boolean,
        expiry: Int,
        upload: Boolean,
        customerId: String,
        contentType: String
    }

    input FileMetaData {
        fileName: String,
        extension: String,
        contentType: String
    }

    enum ServiceName {
        EmailService
        FaxService
        TranslationService
        ImportLocations
        ImportThings
        ImportDevices
        ImportAccounts
    }

    type JobListWorkflowSchema {
        OriginalFileNameWithExt: String
        NewFileNameWithExt: String
        Platform: String
        UploadedFrom: String
    }

    input JobListWorkflowInput {
        JobExpired: Boolean
        OriginalFileNameWithExt: String
        NewFileNameWithExt: String
        Platform: String
        UploadedFrom: String
    }

    type DeliveryMethodOptionsSchema {
        ThingID: ID
        EmailAddress: String
        SessionID: String
    }

    input DeliveryMethodOptionsInput {
        ThingID: ID
        EmailAddress: String
        SessionID: String
    }

    input ConfirmFileUpload {
        IsJobProcessed : Boolean,
        SourceLanguage: String,
        TargetLanguage: String,
        GenerateAudio: Boolean,
        JobList : [JobListWorkflowInput],
        Username : String,
        DeliveryMethod: DeliveryMethodOptionsInput,
    }

    type ConfirmFileUploadSchema {
        IsJobProcessed : Boolean,
        CustomerID : ID
        JobList :[JobListWorkflowSchema],
        Username : String,
        DeliveryMethod: DeliveryMethodOptionsSchema,
    }

    input NotificationInput {
        Email: String,
        Text: String,
    }

    type NotificationSchema {
        Email: String,
        Text: String,
    }

    input ConfirmFileUploadV2Input {
        Notification: NotificationInput,
        DeviceID: ID,
        DeviceName: String,
        GuestName: String,
        Username: String,
        LibraryCard: String,
        CustomerLocation: String,
        TotalCost: Float,
        CustomerID: ID,
        LocationID: ID,
        RecordID: ID,
        AutomaticDelivery: Boolean,
        ComputerName: ID,
        JobList: [JobListFieldSchemaInput]
    }

    type ConfirmFileUploadV2Schema {
        Notification: NotificationSchema,
        DeviceID: ID,
        DeviceName: String,
        GuestName: String,
        Username: String,
        LibraryCard: String,
        CustomerLocation: String,
        TotalCost: Float,
        CustomerID: ID,
        LocationID: ID,
        RecordID: ID,
        AutomaticDelivery: ID,
        ComputerName: ID,
        JobList: [JobListFieldSchema]
    }
    type confirmFileUploadV2Response {
        GuestName: String,
        Username: String,
        LibraryCard: String,
        CustomerLocation: String,
        TotalCost: Float,
        ReleaseCode: String,
        Data: [JobListFieldSchema]
    }

    type FileResponse {
        id: ID
        signedUrls: [File]
    }
    
    extend type Mutation {
        signedUrl(fileInput: FileInput): File
        uploadMultipleFiles(fileInput: [FileMetaData], customerId: ID, path: ServiceName): FileResponse
        uploadMultipleFilesV2(fileInput: [FileMetaData], customerId: ID, path: ServiceName): FileResponse
        confirmFileUpload (customerId: ID, recordId: ID, confirmFileUploadData: ConfirmFileUpload): ConfirmFileUploadSchema
        confirmFileUploadV2 (customerId: ID, recordId: ID, confirmFileUploadData: ConfirmFileUploadV2Input): confirmFileUploadV2Response
    }`

module.exports = typeDef
