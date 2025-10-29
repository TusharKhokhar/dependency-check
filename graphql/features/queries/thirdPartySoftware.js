module.exports = {
    thirdPartySoftware: {
        operationName:"GetThirdPartySoftware",
        query: `query GetThirdPartySoftware($paginationInput: PaginationData, $customerIds: [ID]) {
          getThirdPartySoftware(paginationInput: $paginationInput, customerIds: $customerIds) {
            total
            thirdPartySoftware {
              _id
              CustomerID
              ThirdPartySoftwareName
              ThirdPartySoftwareType
              Tags
              IsActive
              CustomerName
            }
          }
        }`,
        variables: {
            "paginationInput": {},
            "customerIds": []
          }
    }
}