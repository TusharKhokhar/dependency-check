module.exports = {
    addSmartphone: {
    operationName: "AddSmartphone",
    query: `mutation AddSmartphone($addSmartphoneInput: SmartphoneInput) {
    addSmartphone(addSmartphoneInput: $addSmartphoneInput) {
    CreatedBy
    _id
    Tags
    Pin
    IsActive
    CustomerID
    CustomerName
    IsDeleted
  }
}`,
    variables : {
        addSmartphoneInput: {
            "CustomerID": "640f3002990d30e56686bd77",
            "Pin": 12345,
            "Tags": "testbdd"
        }
}},
    updateSmartphone: {
    operationName: "UpdateSmartphone",
    query: `mutation UpdateSmartphone($customerId: ID!, $updateSmartphoneInput: SmartphoneInput) {
            updateSmartphone(customerId: $customerId, updateSmartphoneInput: $updateSmartphoneInput) {
                message
                statusCode
  }
}`,
    variables : {
        updateSmartphoneInput: {
            "CustomerID": "640f3002990d30e56686bd77",
            "Pin": 123455
        },
        customerId: "640f3002990d30e56686bd77"
    }
},
    smartphoneDeleted: {
    operationName: "SmartphoneDeleted",
    query: `mutation SmartphoneDeleted($customerId: ID!, $isDeleted: Boolean) {
            smartphoneDeleted(customerId: $customerId, IsDeleted: $isDeleted) {
                message
                statusCode
  }
}`,
    variables : {
        customerId: "640f3002990d30e56686bd77",
        isDeleted: true
    }
},
    smartphoneStatus: {
    operationName: "SmartphoneStatus",
    query: `mutation SmartphoneStatus($customerId: ID!, $isActive: Boolean) {
            smartphoneStatus(customerId: $customerId, IsActive: $isActive) {
                message
                statusCode
  }
}`,
    variables : {
        customerId: "640f3002990d30e56686bd77",
        isActive: true
    }
}
}