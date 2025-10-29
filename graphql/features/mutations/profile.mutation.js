const { faker } = require('@faker-js/faker');

module.exports = {
    addProfile: {
        operationName: "AddProfile",
        query: `mutation AddProfile($addProfileInput: ProfileInput) {
                      addProfile(addProfileInput: $addProfileInput) {
                        _id
                        Profile
                        CustomerID
                        IsActive
                        CustomerData {
                          CustomerName
                          DomainName
                        }
                        ProfileSetting {
                          PromptForPrinter
                          DisableConfirmation
                          Description
                          AutomaticPrintDelivery
                        }
                      }
                    }`,
        variables: {
            "addProfileInput": {
                "Driver": {
                    "ValidationType": "GuestName",
                    "Default": true,
                    "ConfirmationMessagedescription": "Confirm",
                    "Identifier": "Guest Name",
                    "Location": false,
                    "Locationprompt": null,
                    "EditDocName": false,
                    "RememberMeDisplay": false,
                    "RememberMeSet": false,
                    "PasswordEnabled": null,
                    "PromptMessage": "Enter Guest Name",
                },
                "ProfileSetting": {
                    "AutomaticPrintDelivery": true,
                    "DisableConfirmation": true,
                    "PrintConfigurationGroup": "633c4f831d56a2724c9b58d2",
                    "PromptForPrinter": false,
                    "Description": "heolo"
                },
                "ProfileType": "Driver",
                "Profile": faker.internet.userName(),
                "Tags": [],
                "CustomerID": "633c4f831d56a2724c9b58d2",
                "IsActive": true,
                "AutoUpdate": false,
                "HideFromList": true
            }
        }
    }
}