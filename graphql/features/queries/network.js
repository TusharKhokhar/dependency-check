module.exports = {
    getNetwork: {
        operationName: "GetNetwork",
        query: `query GetNetwork($customerId: ID!) {
                getNetwork(customerId: $customerId) {
                    Server
                    Path
                    Password
                    CustomerName
                    CustomerID
                    Username
                    _id
                    Tags
            }
        }`,
        variables: {
            customerId: "640f3002990d30e56686bd77"
        }
    }
}
