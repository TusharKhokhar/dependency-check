module.exports = {
    addCustomizationText: {
        operationName: "AddCustomizationText",
        query: `mutation AddCustomizationText($addCustomizationTextInput: customizationTextInput) {
                addCustomizationText(addCustomizationTextInput: $addCustomizationTextInput) {
                    CustomerID
                    _id
                    DecimalSeparator
                    LocationHoursSection {
                    LocationHourTitle
                    LocationHoursSectionDescription
                    LocationList
                    LocationSelectionRequired
                    OpenHoursVisibility
                    Title
                    }
                    HowToLogoSection {
                    EmailAddressAssignedGrayscale
                    }
                }
                }`,
        variables: {
            "addCustomizationTextInput": {
            "CustomerID": "640f3002990d30e56686bd77",
            "CustomEmailMessage": "testing",
            "Currency": "INR",
            "DecimalSeparator": "2",
            "LocationHoursSection": {
            "LocationHourTitle": "test",
            "LocationHoursSectionDescription": "testing purpose",
            "LocationList": true,
            "LocationSelectionRequired": false,
            "OpenHoursVisibility": true,
            "Title": "open hour test"
            },
            "HowToLogoSection": {
            "EmailAddressAssignedGrayscale": "test api"
            }
        }
        }
    }
};