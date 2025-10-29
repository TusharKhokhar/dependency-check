module.exports = {
    importThing: {
        query: `query ImportThing($customerId: ID) {
                importThing(CustomerId: $customerId) {
                    message
                    statusCode
                }
            }`,
        variables: {
            "customerId": "6231ce19932e27000985ba60"
        }
    },
    getThings: {
        operationName: "GetThings",
        query: `query GetThings($customerIds: [ID], $paginationInput: PaginationData) {
                getThings(customerIds: $customerIds, paginationInput: $paginationInput) {
                thing {
                    _id
                    PrintUSBWithAccount
                    PromptForAccount
                    EmailAsReleaseCode
                    SerialNumber
                    Firmware
                    IpAddress
                    MacAddress
                    ComputerName
                    Label
                    LoginOptions {
                        ExternalCardValidation
                        ExternalCardIdp
                    }
                }
                total
            }
        }`,
        variables: {
                "paginationInput": {
                  "pageNumber": 1,
                  "limit": 10
                }
        }
    },
    getThing: {
        operationName: "GetThing",
        query: `query GetThing($thingId: ID, $customerId: ID) {
                getThing(thingId: $thingId, customerId: $customerId) {
                _id
                MacAddress
                Label
                Thing
                ThingType
                Description
                IpAddress
                ComputerName
                Firmware
                SerialNumber
                EmailAsReleaseCode
                PromptForAccount
                PrintUSBWithAccount
                LoginOptions {
                    ExternalCardValidation
                    ExternalCardIdp
                }
                }
        }`,
        variables: {
            "thingId": "67c13c667ae3e9d32b6acf1c",
            "customerId": "660da8f4d3390988e5edce04"
        }
    },
}