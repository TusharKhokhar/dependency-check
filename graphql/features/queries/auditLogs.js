module.exports = {
  getAuditLogsWithMessageFilter: {
    operationName: "GetAuditLogs",
    query: `query GetAuditLogs($timezone: String, $message: String, $dateTo: Date, $dateFrom: Date, $typeOf: [String], $customerIds: [ID], $paginationInput: PaginationData) {
      getAuditLogs(paginationInput: $paginationInput, typeOf: $typeOf, message: $message, timezone: $timezone, dateTo: $dateTo, dateFrom: $dateFrom, customerIds: $customerIds) {
        total
        audit {
          Amount
          User
          UsageID
          Type
          ThingType
          ThingName
          ThingLabel
          ThingID
          Status
          RetryCount
          ReleaseCode
          QuotaGroupName
          QuotaGroupID
          OfflineDuration
          GroupID
          GroupData {
            GroupName
            _id
            DebitBalancePriority
            GroupType
          }
          CreatedAt
          CustomerData {
            _id
            CustomerName
            DomainName
          }
          CustomerID
          Date
          DisconnectReason
          FileName
          ErrorMessage
        }
      }
    }`,
    variables: {
      customerIds: [],
      message: "ENOTFOUND",
      typeOf: null,
      timezone: "Asia/Calcutta",
      paginationInput: {
        pageNumber: 1,
        limit: 10,
      },
    },
  },
};
