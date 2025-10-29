const typeDef = `#graphql
    type PublicUpload {
        _id: ID,
        IsProcessedFileName: [IsProcessedFileNameSchema],
        AutomaticPrintDelivery: Boolean,
        Email: String,
        GuestName: String,
        FileLink: String,
        IsDelivered: Boolean,
        CustomerID: ID,
        JobExpired: Boolean,
        IsPrinted: Boolean,
        JobList: JobListFieldSchema,
        CustomerData: CustomerDataSchema,
        LocationData: LocationDataSchema,
        LibraryCard: String,
        ComputerName: String,
        ReleaseCode: String,
        Text: String,
        TotalCost: Float,
        Username: String,
        PrintCounter: Int,
        CreatedAt: Date, 
    }

    input PublicUploadInput {
        IsProcessedFileName: [IsProcessedFileNameSchemaInput],
        AutomaticPrintDelivery: Boolean,
        Email: String,
        GuestName: String,
        IsDelivered: Boolean,
        CustomerID: ID!,
        JobExpired: Boolean,
        IsPrinted: Boolean,
        JobList: [JobListFieldSchemaInput],
        LibraryCard: String,
        ComputerName: String,
        ReleaseCode: String,
        Text: String,
        TotalCost: Float,
        Username: String,
        PrintCounter: Int, 
    }

    type IsProcessedFileNameSchema {
        FileName: String,
        ErrorMessage: String,
        IsProcessed: Boolean
    }

    input IsProcessedFileNameSchemaInput {
        FileName: String,
        ErrorMessage: String,
        IsProcessed: Boolean
    }
    

    type JobListFieldSchema {
        Copies: Int,
        Color: String,
        Duplex: Boolean,
        PaperSize: String,
        Orientation: String,
        PageRange: String,
        OriginalFileNameWithExt: String,,
        NewFileNameWithExt: String,
        TotalPagesPerFile: Float,
        UploadStatus: Boolean,
        Platform: String,
        App: String,
        UploadedFrom: String,
        PrintCounter: Int,
        IsDeleted: Boolean!,
        IsPrinted: Boolean!,
        ErrorMessage: String,
        IsProcessed: Boolean,
        Staple: String
    }

    input JobListFieldSchemaInput {
        Copies: Int,
        Color: String,
        Duplex: Boolean,
        PaperSize: String,
        Orientation: String,
        PageRange: String,
        OriginalFileNameWithExt: String,
        NewFileNameWithExt: String!,
        TotalPagesPerFile: Float,
        UploadStatus: Boolean,
        Platform: String,
        App: String,
        UploadedFrom: String,
        IsDeleted: Boolean,
        IsPrinted: Boolean,
        PrintCounter: Int,
        Staple: String
    }

    type PublicUploadResponse {
        publicUpload: [PublicUpload],
        total: Int
    }
    
    input DeleteInfo {
        fileNames: [String], 
        publicUploadId: ID, 
        customerId: ID,
        releaseCode: String
    }

    extend type Mutation {
        addPublicUpload(addPublicUploadInput: PublicUploadInput): PublicUpload
        updatePublicUpload(updatePublicUploadInput: PublicUploadInput, uploadId: ID!): Response
        deleteFile(DeleteFilesInput: DeleteInfo): Response
    }

    extend type Query {
        getPublicUploads(paginationInput: PaginationData,customerIds: [ID], locationIds: [ID], releaseCode: String,
            libraryCard: String, guestName: String, email: String, text: String, 
            isProcessed: Boolean, isPrinted: Boolean, userName: String): PublicUploadResponse
        getPublicUpload(uploadId: ID, customerId: ID, fileName: String): PublicUpload
    }
`

module.exports = typeDef
