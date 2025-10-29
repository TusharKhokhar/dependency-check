const typeDef = `#graphql
    type Version {
        _id: ID,
        CustomerID: ID,
        VersionNumber: String,
        ReleaseDate: Date,
        Enabled: Boolean,
        Disabled: Boolean,
        Release: Boolean,
        Package: String,
        ThingType: String,
        VersionDescription: String,
        Tags: [String],
        IsDeleted: Boolean,
        CreatedAt: Date,
        UpdatedAt: Date,
        IsActive: Boolean
    }

    input VersionInput {
        CustomerID: ID,
        VersionNumber: String,
        ReleaseDate: Date,
        Enabled: Boolean,
        Disabled: Boolean,
        ThingType: String,
        Release: Boolean,
        Package: String,
        VersionDescription: String,
        Tags: [String],
        IsDeleted: Boolean,
        CreatedAt: Date,
        UpdatedAt: Date,
        IsActive: Boolean
    }

    type VersionsResponse {
        version: [Version],
        total: Int
    }

    input VersionAttributes {
        contentType: String!,
        extension: String!,
        fileName: String!
    }

    type UploadVersionSchema {
        VersionType: String,
        signedUrl: String,
        path: String,
        expiryTime: String
    }

    extend type Mutation {
        addVersion(addVersionInput: VersionInput): Version
        updateVersion(updateVersionInput: VersionInput, versionId: ID!): Response
        versionDeleted(IsDeleted: Boolean, versionId: ID, customerId: ID): Response
        uploadVersion(versionUploadInput: VersionAttributes): UploadVersionSchema
        uploadVersionV2(versionUploadInput: VersionAttributes): UploadVersionSchema
    }

    extend type Query {
        getVersions(paginationInput: PaginationData, customerIds: [ID]): VersionsResponse
        getVersion(versionId: ID, customerId: ID): Version
    }
`

module.exports = typeDef