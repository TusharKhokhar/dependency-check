module.exports = {
  updateUserBalance: {
    query: `mutation UpdateUserBalance($updateBalance: updateBalanceUserInput) {
            updateUserBalance(updateBalance: $updateBalance) {
              message
              statusCode
            }
          }`,
    variables: {
      updateBalance: {
        AccountID: "64bfd0948f8640959673f48e",
        Amount: 10,
        Comment: "testing",
        CustomerID: "6231ce19932e27000985ba60",
        Name: "matthewadmin",
        Type: "QUOTA",
        UserID: "62f0faa753a07100093832b2",
        Username: "matthewadmin",
      },
    },
    operationName: "UpdateUserBalance",
  },
  addUser: {
    query: `mutation addUser($addUserInput: UserInput) {
          addUser(addUserInput: $addUserInput) {
            statusCode
            message
          }
        }`,
    variables: {
      addUserInput: {
        FirstName: "test",
        LastName: "test",
        Email: [],
        CardNumber: [],
        Username: "test",
        IsActive: true,
        Tags: ["test"],
        CustomerID: "660da8f4d3390988e5edce04",
        Tier: "standard",
        TenantDomain: "test",
        PrimaryEmail: "test@gmail.com",
        Mfa: false,
        GroupID: ["66102b267fdef3a741ce5d73"],
      },
    },
    operationName: "addUser",
  },
  updateUserV2: {
    query: `mutation updateUserV2($FirstName: String!, $LastName: String!, $Mfa: Boolean, $EmailMfa: Boolean, $MobileMfa: Boolean, $Mobile: String, $Tags: [String], $GroupID: [ID], $Email: [String], $CardNumber: [String], $userId: ID!, $PIN: String, $PrimaryEmail: String, $IsActive: Boolean, $CustomerID: ID) {
              updateUserV2(
                updateUserInput: {FirstName: $FirstName, LastName: $LastName, Mfa: $Mfa, MfaOption: {Email: $EmailMfa, Mobile: $MobileMfa}, Mobile: $Mobile, Tags: $Tags, GroupID: $GroupID, Email: $Email, PIN: $PIN, CardNumber: $CardNumber, PrimaryEmail: $PrimaryEmail, IsActive: $IsActive, CustomerID: $CustomerID}
                userId: $userId
              ) {
                message
                statusCode
                __typename
              }
            }`,
    variables: {
      FirstName: "FirstName",
      LastName: "LastName",
      userId: "userId",
      GroupID: ["GroupID"],
      CustomerID: "CustomerID",
    },
    operationName: "updateUserV2",
  },

  validateCardNumber: {
    query: `mutation validateCardNumber($cardNumber: String, $customerId: ID) {
              validateCardNumber(
                cardNumber: $cardNumber, 
                customerId: $customerId
              ) {
                Token
              }
            }`,
    variables: {
      cardNumber: "123456789",
      customerId: "CustomerID",
    },
    operationName: "validateCardNumber",
  },

  validateCardNumberPin: {
    query: `mutation validateCardNumberPin($cardNumber: String!, $pin: String!, $customerId: ID!) {
              validateCardNumberPin(
                cardNumber: $cardNumber, 
                pin: $pin,
                customerId: $customerId
              ) {
                Token
              }
            }`,
    variables: {
      cardNumber: "123456789",
      pin: "123",
      customerId: "CustomerID",
    },
    operationName: "validateCardNumberPin",
  },
  updateUserCardNumber: {
    operationName: "UpdateUser",
    variables: {
        "userId": "",
        "updateUserInput": {
            "FirstName": "test",
            "LastName": "test",
            "CardNumber": "",
            "CustomerID": ""
        }
    },
    query: "mutation UpdateUser($userId: ID!, $updateUserInput: UpdateInput, $authId: ID) {\n  updateUser(\n    userId: $userId\n    updateUserInput: $updateUserInput\n    authId: $authId\n  ) {\n    message\n    statusCode\n    __typename\n  }\n}"
  }
};
