const { config } = require("../configs/config");

module.exports = {
    addNetwork: {
        operationName: "AddNetwork",
        query: `mutation AddNetwork($addNetworkInput: NetworkInput) {
                addNetwork(addNetworkInput: $addNetworkInput) {
                    Server
                    Path
                    Password
                    CustomerName
                    CustomerID
                    Username
                    ThirdPartySoftwareName
                    ThirdPartySoftwareType
                    _id
                    Tags
                }
            }`,
        variables: {
            addNetworkInput: {
            "CustomerID": "640f3002990d30e56686bd77",
            "Password": config.apiTestKey,
            "IsActive": true,
            "Path": "test.org",
            "Server": "dev",
            "Username": "Sppanya",
            "ThirdPartySoftwareName": "network test",
            "ThirdPartySoftwareType": "NetworkIntegration"
        } 
        }
    },
    updateNetwork: {
    operationName: "UpdateNetwork",
    query: `mutation UpdateNetwork($customerId: ID!, $updateNetworkInput: NetworkInput) {
            updateNetwork(customerId: $customerId, updateNetworkInput: $updateNetworkInput) {
                message
                statusCode
            }
            }`,
            variables: {
                updateNetworkInput: {
                    "Path": "test.net",
                    "Server": "stage",
                    "CustomerID": "640f3002990d30e56686bd77",
                    "ThirdPartySoftwareName": "network test",
                    "ThirdPartySoftwareType": "NetworkIntegration"
                },
                customerId: "640f3002990d30e56686bd77",
            }
    },
    networkStatus: {
    operationName: "NetworkStatus",
    query: `mutation NetworkStatus($customerId: ID!, $isActive: Boolean) {
            networkStatus(customerId: $customerId, IsActive: $isActive) {
                message
                statusCode
            }
            }`,
            variables: {
                "customerId": "640f3002990d30e56686bd77",
                "isActive": true
            }
    },
    networkDeleted: {
    operationName: "DeleteNetwork",
    query: `mutation DeleteNetwork($customerId: ID!, $isDeleted: Boolean) {
            deleteNetwork(customerId: $customerId, IsDeleted: $isDeleted) {
                message
                statusCode
            }
            }`,
            variables: {
                "customerId": "640f3002990d30e56686bd77",
                "isDeleted": true
            }
        }
}
