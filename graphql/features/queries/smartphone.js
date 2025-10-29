module.exports = {
    getSmartphone: {
        operationName: "GetSmartphone",
        query: `query GetSmartphone($customerId: ID) {
                getSmartphone(customerId: $customerId) {
                    CreatedBy
                    CustomerID
                    IsActive
                    IsDeleted
                    Pin
                    Tags
                    _id
                }
            }`,
            variables: {
                customerId: "640f3002990d30e56686bd77"
            }
        }
};