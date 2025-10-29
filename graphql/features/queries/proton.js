module.exports = {
    getProton: {
        operationName: "GetProton",
        query: `query GetProton($customerId: ID) {
                  getProton(customerId: $customerId) {
                    _id
                    CustomerID
                    ThirdPartySoftwareName
                    ThirdPartySoftwareType
                    ClientSecret
                    ClientId
                    TokenAPIEndpoint
                    TransactionServicesAPIEndpoint
                  }
                }`,
        variables: {
            "customerId": ""
        }
    },
}