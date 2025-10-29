module.exports = {
    getDevice: {
        query: `query GetDevice($deviceId: ID, $customerId: ID) {
                getDevice(deviceId: $deviceId, customerId: $customerId) {
                 CustomerName
                }
            }`,
        variables: {
            "deviceId": "664dc4e57ec49d343c3084f9",
            "customerId": "6231ce19932e27000985ba60"
        }
    },
    importDevice: {
        query: `query Importdevice($customerId: ID) {
                importDevice(CustomerId: $customerId) {
                    message
                    statusCode
                }
            }`,
        variables: {
            "customerId": "62ed3f8c4f58d900097fc9f8"
        }
    }
}
