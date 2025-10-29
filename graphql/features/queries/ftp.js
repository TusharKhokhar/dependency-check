module.exports = {
  getFTP: {
    operationName: "GetFTP",
    query: `query GetFTP($customerId: ID!) {
            getFTP(customerId: $customerId) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                FTPType
                HostName
                PortNumber
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
