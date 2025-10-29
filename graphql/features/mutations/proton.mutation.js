module.exports = {
    addProton: {
        operationName: "AddProton",
        query: `mutation AddProton($addProtonInput: ProtonInput) {
                    addProton(addProtonInput: $addProtonInput) {
                        _id
                        CustomerID
                        ThirdPartySoftwareName
                        ThirdPartySoftwareType
                        Tags
                        OcpApimSubscriptionKey
                        ClientId
                        ClientSecret
                        TokenAPIEndpoint
                        TransactionServicesAPIEndpoint
                        Enabled
                    }
             }`,
        variables: {
            "addProtonInput": {
                "CustomerID": "633c4f831d56a2724c9b58d2",
                "ThirdPartSoftwareName": "abc",
                "ThirdPartySoftwareType": "ProtonIntegration",
                "Tags": [],
                "OcpApimSubscriptionKey": "aa",
                "ClientId": "clientid",
                "ClientSecret": "testsec",
                "TokenAPIEndpoint": "https://anc.com",
                "TransactionServicesAPIEndpoint": "https://anc.com/auth",
                "Enabled": true
            }
        }
    },
    updateProton: {
        operationName: "UpdateProton",
        query: `mutation UpdateProton($customerId: ID!, $updateProtonInput: ProtonInput) {
                  updateProton(customerId: $customerId, updateProtonInput: $updateProtonInput) {
                    message
                    statusCode
                  }
                }`,
        variables: {
            "updateProtonInput": {
                "CustomerID": "",
                "ThirdPartSoftwareName": "abc",
                "ThirdPartySoftwareType": "ProtonIntegration",
                "ClientSecret": "testsec"
            },
            "customerId": "633c4f831d56a2724c9b58d2"
        }
    },
    protonDeleted: {
        operationName: "ProtonDeleted",
        query: `mutation ProtonDeleted($IsDeleted: Boolean, $customerId: ID!) {
                  protonDeleted(IsDeleted: $IsDeleted, customerId: $customerId) {
                    message
                    statusCode
                  }
                }`,
        variables: {
            "customerId": "",
            "IsDeleted": true
        }
    },
    protonStatus: {
        operationName: "ProtonStatus",
        query: `mutation ProtonStatus($customerId: ID!, $isActive: Boolean) {
                  protonStatus(customerId: $customerId, IsActive: $isActive) {
                    message
                    statusCode
                  }
                }`,
        variables: {
            "customerId": "",
            "IsActive": false
        }
    },

}

