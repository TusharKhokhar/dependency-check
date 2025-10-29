module.exports = {
    getUser: {
        query: `query GetUser($userId: ID, $customerId: ID) {
            getUser(userId: $userId, customerId: $customerId) {
              GroupQuotas {
                GroupID
                QuotaBalance
              }
              DebitBalance
            }
          }`,
        variables: {
            "userId": "62f0faa753a07100093832b2",
            "customerId": "6231ce19932e27000985ba60"
        },
        operationName: "GetUser"
    },
    getUsers : {
      query: `query GetUsers($paginationInput: PaginationData) {
                getUsers(paginationInput: $paginationInput) {
                  user {
                    _id
                    UserType
                    Username
                    GroupData {
                      GroupName
                      _id
                      DebitBalancePriority
                      GroupType
                    }
                  }
                  total
                }
              }`,
      variables: {
        "paginationInput": {
          "limit": 10,
          "pageNumber": 1
        }
      },
      operationName: "GetUsers"
  },
  getUsersWithGroupNameDscSorting : {
    query: `query GetUsers($paginationInput: PaginationData) {
              getUsers(paginationInput: $paginationInput) {
                user {
                  _id
                  UserType
                  Username
                  GroupData {
                    GroupName
                    _id
                    DebitBalancePriority
                    GroupType
                  }
                }
                total
              }
            }`,
    variables: {
      "paginationInput": {
        "pageNumber": 1,
        "limit": 100,
        "pattern": "",
        "sort": "dsc",
        "sortKey": "GroupData.GroupName",
      }
    },
    operationName: "GetUsers"
  },
  getUsersWithGroupNameAscSorting : {
    query: `query GetUsers($paginationInput: PaginationData) {
              getUsers(paginationInput: $paginationInput) {
                user {
                  _id
                  UserType
                  Username
                  GroupData {
                    GroupName
                    _id
                    DebitBalancePriority
                    GroupType
                  }
                }
                total
              }
            }`,
    variables: {
      "paginationInput": {
        "pageNumber": 1,
        "limit": 100,
        "pattern": "",
        "sort": "asc",
        "sortKey": "GroupData.GroupName",
      }
    },
    operationName: "GetUsers"
  },
  getUserOverview: {
    query:`query GetUserOverview($customerId: ID, $userId: ID, $transactionFilters: FilterUsage, $usageFilters: FilterUsage, $transactionPaginationInput: PaginationData, $usagePaginationInput: PaginationData) {
      getUserOverview(customerId: $customerId, userId: $userId, transactionFilters: $transactionFilters, usageFilters: $usageFilters, transactionPaginationInput: $transactionPaginationInput, usagePaginationInput: $usagePaginationInput) {
        user {
          CustomerID
          CustomerData {
            _id
            CustomerName
            DomainName
          }
          ApprovedUser
          AuthProvideData {
            AuthProviderID
            ProviderName
            AuthProvider
          }
          CustomerName
          DebitBalance
          FirstName
          FullName
          GroupData {
            GroupName
            _id
            DebitBalancePriority
            GroupType
          }
          GroupID
          GroupQuotas {
            GroupID
            GroupName
            QuotaBalance
          }
          IsActive
          IsDeleted
          Label
          MfaOption {
            Email
            Mobile
          }
          Mobile
          PrimaryEmail
          TenantDomain
          Tier
          UserRole
          UserType
          Username
          _id
        }
        usage {
          total
          usage {
            _id
            Type
            TransactionDate
            TransactionStartTime
            TransactionEndTime
            TransactionID
            TimeZone
            Customer
            CustomerID
            CurrencyCode
            Location
            LocationID
            Area
            AreaID
            Thing
            ThingID
            UserType
            BarcodeNumber
            FullName
            EmailAddress
            Group
            Print {
              PaperSize
            }
            GroupID
            Username
            UserID
            ReleaseCode
            BillingAccountId
            BillingAccountName
            createdAt
            createdBy
            updatedAt
            updatedBy
            deletedAt
            IsDeleted
            deletedBy
          }
        }
        transaction {
          total
          usage {
            _id
            Type
            TransactionDate
            TransactionStartTime
            TransactionEndTime
            TransactionID
            TimeZone
            Customer
            CustomerID
            CurrencyCode
            Location
            LocationID
            Area
            AreaID
            Print {
              PaperSize
            }
            Thing
            ThingID
            UserType
            BarcodeNumber
            FullName
            EmailAddress
            Group
            GroupID
            Username
            UserID
            ReleaseCode
            BillingAccountId
            BillingAccountName
            createdAt
            createdBy
            updatedAt
            updatedBy
            deletedAt
            IsDeleted
            deletedBy
          }
        }
      }
    }`,
    variables: {
      "customerId": "test",
      "userId": "test",
      "transactionFilters": {},
      "usageFilters": {},
      "transactionPaginationInput": {},
      "usagePaginationInput": {}
    },
    operationName: "GetUserOverview"

  },

  findDataExisting: {
    query: `query FindDataExisting($customerId: ID, $validationCheckInput: ValidationCheckInput) {
            findDataExisting(customerId: $customerId, ValidationCheckInput: $validationCheckInput) {
              message
              statusCode
            }
    }`,
    variables: {
      customerId: "test",
      validationCheckInput: {
        collectionName: "",
        fieldName: "",
        fieldValue: "",
      },
    },
    operationName: "FindDataExisting",
  }
}