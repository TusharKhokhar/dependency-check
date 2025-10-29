module.exports = {
  getIlliad: {
    operationName: "GetIlliad",
    query: `query GetIlliad($customerId: ID!) {
            getIlliad(customerId: $customerId) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                Server
                Path
                Username
                Password
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      customerId: "",
    },
  },
};
