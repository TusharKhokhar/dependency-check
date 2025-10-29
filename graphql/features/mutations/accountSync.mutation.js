module.exports = {
  addAccountSync: {
    operationName: "AddAccountSync",
    query: `mutation AddAccountSync($addAccountSyncInput: AccountSyncInput) {
              addAccountSync(addAccountSyncInput: $addAccountSyncInput) {
             _id
              APIEndpoint
              ClientId
              ClientSecret
              IsActive
              Mappings {
                AccountID
                AccountName
                Description
              }
              IsDeleted
              CreatedBy
            }
      }`,
    variables: {
      addAccountSyncInput: {
        CustomerID: "633c4f831d56a2724c9b58d2",
        ThirdPartySoftwareName: "abc",
        ThirdPartySoftwareType: "AccountSyncIntegration",
        Tags: [],
        APIEndpoint: "https://api.example.com",
        ClientId: "clientid",
        ClientSecret: "testsecret",
        Mappings: {
          AccountID: "12345",
          AccountName: "TestAccount",
          Description: "Test mapping",
        },
        IsActive: true,
      },
    },
  },

  updateAccountSync: {
    operationName: "UpdateAccountSync",
    query: `mutation UpdateAccountSync($customerId: ID!, $updateAccountSyncInput: AccountSyncInput) {
              updateAccountSync(customerId: $customerId, updateAccountSyncInput: $updateAccountSyncInput) {
                message
                statusCode
              }
      }`,
    variables: {
      updateAccountSyncInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "xyz",
        ThirdPartySoftwareType: "AccountSyncIntegration",
        ClientSecret: "updatedSecret",
        APIEndpoint: "https://api.example.com",
        ClientId: "clientid",
        ClientSecret: "testsecret",
        Mappings: {
          AccountID: "12345",
          AccountName: "TestAccount",
          Description: "Test mapping",
        },
        IsActive: true,
      },
      customerId: "633c4f831d56a2724c9b58d2",
    },
  },

  deleteAccountSync: {
    operationName: "DeleteAccountSync",
    query: `mutation DeleteAccountSync($customerId: ID!, $IsDeleted: Boolean) {
                deleteAccountSync(customerId: $customerId, IsDeleted: $IsDeleted) {
                  message
                  statusCode
                }
              }`,
    variables: {
      customerId: "633c4f831d56a2724c9b58d2",
      IsDeleted: true,
    },
  },

  accountSyncStatus: {
    operationName: "AccountSyncStatus",
    query: `mutation AccountSyncStatus($customerId: ID!, $IsActive: Boolean) {
                accountSyncStatus(customerId: $customerId, IsActive: $IsActive) {
                  message
                  statusCode
                }
              }`,
    variables: {
      customerId: "633c4f831d56a2724c9b58d2",
      IsActive: false,
    },
  },
};
