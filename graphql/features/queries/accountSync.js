module.exports = {
  getAccountSync: {
    operationName: "GetAccountSync",
    query: `query GetAccountSync($customerId: ID!) {
                getAccountSync(customerId: $customerId) {
                  _id
                  CustomerID
                  ThirdPartySoftwareName
                  ThirdPartySoftwareType
                  APIEndpoint
                  ClientId
                  ClientSecret
                  Mappings {
                    AccountID
                    AccountName
                    Description
                  }
                  IsActive
                }
              }`,
    variables: {
      customerId: "",
    },
  },
};
