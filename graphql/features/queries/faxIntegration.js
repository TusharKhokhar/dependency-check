module.exports = {
  getFaxIntegration: {
    operationName: "GetFaxIntegration",
    query: `query GetFaxIntegration($customerId: ID!) {
      getFaxIntegration(customerId: $customerId) {
        _id
        CustomerID
        CustomerName
        ThirdPartySoftwareName
        ThirdPartySoftwareType
        Email
        TimeOutPerPage
        IsActive
        IsDeleted
        ConfirmationOptions {
          ConfirmationType
          Enabled
          IsDefault
          Message
        }
      }
    }`,
    variables: {
      customerId: "",
    },
  },
};
