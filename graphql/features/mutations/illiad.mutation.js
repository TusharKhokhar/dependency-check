const { config } = require("../configs/config");

module.exports = {
  addIlliad: {
    operationName: "AddIlliad",
    query: `mutation AddIlliad($addIlliadInput: IlliadInput) {
            addIlliad(addIlliadInput: $addIlliadInput) {
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
      addIlliadInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "testing illiad",
        ThirdPartySoftwareType: "IlliadIntegration",
        Tags: ["test"],
        Server: "local",
        Path: "/Users/air/Downloads/test.html",
        Username: "SOT01",
        Password: config.apiTestKey,
        IsActive: true,
      },
    },
  },
  updateIlliad: {
    operationName: "UpdateIlliad",
    query: `mutation UpdateIlliad($customerId: ID!, $updateIlliadInput: IlliadInput) {
            updateIlliad(customerId: $customerId, updateIlliadInput: $updateIlliadInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateIlliadInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "testing illiad",
        ThirdPartySoftwareType: "IlliadIntegration",
        Tags: ["test", "111"],
        Server: "local",
        Path: "/Users/air/Downloads/test.html",
        Username: "SOT01",
        Password: config.apiTestKey,
        IsActive: true,
      },
    },
  },
  updateIlliadStatus: {
    operationName: "UpdateIlliadStatus",
    query: `mutation UpdateIlliadStatus($customerId: ID!, $isActive: Boolean) {
            updateIlliadStatus(customerId: $customerId, IsActive: $isActive) {
                message
                statusCode
                }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
  deleteIlliad: {
    operationName: "DeleteIlliad",
    query: `mutation DeleteIlliad($customerId: ID!, $isDeleted: Boolean) {
            deleteIlliad(customerId: $customerId, IsDeleted: $isDeleted) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      isDeleted: true,
    },
  },
};
