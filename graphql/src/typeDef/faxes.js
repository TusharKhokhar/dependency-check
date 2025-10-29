const typeDef = `#graphql

type Fax {
    _id: ID,
    FaxDetailsID: ID,
    FileName: String,
    SentStatus: String,
    AccountCode: String,
    DateQueued: Date,
    DateSent: Date,
    ToFaxNumber: String,
    Pages: Int,
    Duration: String,
    RemoteID: String,
    ErrorCode: String,
    Size: Int,
    CustomerID: ID,
    ThingID: ID,
    Thing: String,
    Location: String,
    LocationID: ID,
    UpdatedAt: Date,
    CreatedAt: Date,
    SenderEmail: String,
    FaxType: String,
    ServiceName: String,
    Platform: String,
}

input FaxInput {
    FaxDetailsID: ID,
    FileName: String,
    SentStatus: String,
    AccountCode: String,
    DateQueued: Date,
    DateSent: Date,
    ToFaxNumber: String,
    Pages: Int,
    Duration: String,
    RemoteID: String,
    ErrorCode: String,
    Size: Int,
    CustomerID: ID,
    ThingID: ID,
    Thing: String,
    LocationID: ID,
    Location: String,
    UpdatedAt: Date,
    CreatedAt: Date,
    SenderEmail: String,
    FaxType: String,
    ServiceName: ServiceNameType,
    Platform: String,
}

input FaxRequestInput {
    FileName: String,
    AccountCode: String,
    ToFaxNumber: String,
    Pages: Int,
    Duration: Int,
    Size: Int,
    CustomerID: ID,
    ThingID: ID,
    LocationID: ID,
    SenderFaxNumber: String,
    Location: String,
    Platform: String,
    SenderEmail: String,
    FaxType: String,
    SystemFileName: String,
    Body: String,
    Subject: String,
    Base64: String,
    CoverPageEnabled: Boolean
    FromCoverPage: String,
    ToCoverPage: String,
    ServiceName: ServiceNameType
}

enum ServiceNameType {
    SrFax
}

type FaxesResponse {
    fax: [Fax],
    total: Int
}

extend type Mutation {
    addFax(addFaxInput: FaxInput): Fax
    updateFax(updateFaxInput: FaxInput, FaxId: ID!): Response
    faxDeleted(IsDeleted: Boolean, FaxId: ID, customerId: ID): Response
    faxStatus(IsActive: Boolean, FaxId: ID, customerId: ID): Response
    sendSrFaxRequest(faxBody: FaxRequestInput, customerId: ID, domainName: String): Response
}

extend type Query {
    getFaxes(paginationInput: PaginationData, customerIds: [ID]): FaxesResponse
    getFax(FaxId: ID, customerId: ID): Fax
}
`

module.exports = typeDef
