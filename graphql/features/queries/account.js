module.exports = {
  getAccounts: {
    operationName: "GetAccounts",
    query: `query GetAccounts($paginationInput: PaginationData, $customerIds: [ID]) {
                getAccounts(paginationInput: $paginationInput, customerIds: $customerIds) {
                accounts {
                _id
                CustomerID
                CustomerName
                AccountId
                AccountName
                Description
                Tags
                IsActive
                CreatedBy
                IsDeleted
            }
            total
        }
    }`,
    variables: {
      "paginationInput": {
        "pageNumber": 1,
        "limit": 10,
      }
    },
  },
  getAccount: {
    operationName: "GetAccount",
    query: `query GetAccount($accountId: ID!) {
                    getAccount(accountId: $accountId) {
                _id
                CustomerID
                CustomerName
                AccountId
                AccountName
                Description
                Tags
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      accountId: "ACC1234567",
    },
  },
  importAccount: {
    query: `query importAccount($customerId: ID) {
                importAccount(customerId: $customerId) {
                message
                statusCode
            }
        }`,
    variables: {
      "customerId": "62e3ff0a282f2000099bda11",
    }
  }
};
