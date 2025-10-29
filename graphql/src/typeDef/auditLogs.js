const typeDef = `#graphql
type AuditLogs {
    Type: String,
    Date: Date,
    FileName: String,
    ReleaseCode: String,
    Mobile: String,
    ErrorMessage: String,
    CustomerID: ID,
    User: String,
    Amount: Float,
    QuotaGroupID: ID,
    GroupID: ID,
    GroupData: GroupDataSchema,
    CustomerData: CustomerDataSchema,
    QuotaGroupName: String,
    ThingName: String,
    DisconnectReason: String,
    OfflineDuration: Float,
    RetryCount: Float,
    DuplicateConnectionCount: Int,
    IPAddress: [String]
    UsageID: ID,
    Status: String,
    ThingID: ID,
    ThingLabel: String,
    ThingType: String,
    CreatedAt: Date
}

input AuditLogsInput {
    Type: String,
    Date: Date,
    FileName: String,
    ReleaseCode: String,
    ErrorMessage: String
    CustomerID: ID,
    User: String,
    Amount: Float,
    QuotaGroupID: ID,
    GroupID: ID,
    QuotaGroupName: String,
    ThingName: String,
    DisconnectReason: String,
    OfflineDuration: Float,
    ThingID: ID,
    ThingLabel: String,
    ThingType: String,
}

type AuditLogsResponse {
    audit: [AuditLogs],
    total: Int
}

extend type Mutation {
    "Add Audit logs API to store errors for printing, quota balance updates, quota reset, and conversion errors"
    addAuditLogs(addAuditLogInput: AuditLogsInput): AuditLogs
}

extend type Query {
    "API to fetch the audit logs. This api has pagination enabled."
    getAuditLogs("Get Audit logs" paginationInput: PaginationData, customerIds: [ID], typeOf: [String], dateFrom: Date, 
        dateTo: Date, message: String, timezone: String): AuditLogsResponse
}
`

module.exports = typeDef
