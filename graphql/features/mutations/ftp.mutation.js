const { config } = require("../configs/config");

module.exports = {
  addFTP: {
    operationName: "AddFTP",
    query: `mutation AddFTP($addFtpInput: FTPInput) {
            addFTP(addFTPInput: $addFtpInput) {
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
      addFtpInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "FTP Testing",
        ThirdPartySoftwareType: "FTPIntegration",
        Tags: ["test"],
        FTPType: "FTP",
        HostName: "test",
        PortNumber: 20,
        Username: "SOT01",
        Password: config.apiTestKey,
        IsActive: true,
      },
    },
  },
  updateFTP: {
    operationName: "UpdateFTP",
    query: `mutation UpdateFTP($customerId: ID!, $updateFtpInput: FTPInput) {
            updateFTP(customerId: $customerId, updateFTPInput: $updateFtpInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateFtpInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "FTP Testing",
        ThirdPartySoftwareType: "FTPIntegration",
        Tags: ["test", "111"],
        FTPType: "FTP",
        HostName: "test",
        PortNumber: "20",
        Username: "SOT01",
        Password: config.apiTestKey,
        IsActive: true,
      },
    },
  },
  updateFTPStatus: {
    operationName: "UpdateFTPStatus",
    query: `mutation UpdateFTPStatus($customerId: ID!, $isActive: Boolean) {
            updateFTPStatus(customerId: $customerId, IsActive: $isActive) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
  deleteFTP: {
    operationName: "DeleteFTP",
    query: `mutation DeleteFTP($customerId: ID!, $isDeleted: Boolean) {
            deleteFTP(customerId: $customerId, IsDeleted: $isDeleted) {
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
