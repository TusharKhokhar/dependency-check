module.exports = {
  addAccount: {
    operationName: "AddAccount",
    query: `mutation AddAccount($addAccountInput: AccountInput) {
            addAccount(addAccountInput: $addAccountInput) {
            _id
            AccountId
            AccountName
            Description
            Tags
            CreatedBy
            IsDeleted
            CustomerID
            CustomerName
            IsActive
            }
        }`,
    variables: {
      addAccountInput: {
        AccountId: "ACC1234561",
        AccountName: "Test2 Account",
        Description: "This is a test2 account for API testing.",
        Tags: ["Finance", "Tech"],
        CustomerID: "633c4f831d56a2724c9b58d2",
        IsActive: true,
      },
    },
  },

  updateAccount: {
    operationName: "UpdateAccount",
    query: `mutation UpdateAccount($updateAccountInput: AccountInput, $accountId: ID!) {
            updateAccount(updateAccountInput: $updateAccountInput, accountId: $accountId) {
                message
                statusCode
            }
    }`,
    variables: {
      updateAccountInput: {
        AccountId: "ACC12345677",
        AccountName: "Update account test",
        Description: "Update Account description",
        Tags: ["tt"],
        IsActive: true,
        CustomerID: "",
      },
      accountId: "67d115f6bf33dfcd31630188",
    },
  },

  deleteAccount: {
    operationName: "DeleteAccount",
    query: `mutation DeleteAccount($isDeleted: Boolean, $accountId: ID) {
            deleteAccount(IsDeleted: $isDeleted, accountId: $accountId) {
            message
            statusCode
            }
    }`,
    variables: {
      accountId: "67d115f6bf33dfcd31630188",
      isDeleted: true,
    },
  },

  accountStatus: {
    operationName: "UpdateAccountStatus",
    query: `mutation UpdateAccountStatus($isActive: Boolean, $accountId: ID) {
            updateAccountStatus(IsActive: $isActive, accountId: $accountId) {
            message
            statusCode
        }
    }`,
    variables: {
      isActive: true,
      accountId: "67d115f6bf33dfcd31630188",
    },
  },
};
