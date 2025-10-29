module.exports = {
    importLocation: {
        query: `query importLocation($customerId: ID) {
                importLocation(customerId: $customerId) {
                    message
                    statusCode
                }
            }`,
        variables: {
            "customerId": "62e3ff0a282f2000099bda11"
        }
    },
    getLocations: {
        query: `query GetLocations($paginationInput: PaginationData) {
                getLocations(paginationInput: $paginationInput) {
                    location {
                    Address
                    AdvancedEmails {
                        AdvancedEmailAlias {
                        AliasEmail
                        CombinationType
                        Email
                        }
                        Enabled
                    }
                    City
                    Coordinates
                    CurrencyCode
                    CustomerID
                    Customization
                    Description
                    Geolocation
                    Latitude
                    Location
                    Longitude
                    Searchable
                    ShortName
                    State
                    TimeZone
                    Zip
                    _id
                    openTimesLocationFormatted
                    }
                    total
                }
                }`,
        variables: {
                "paginationInput": {
                  "limit": 20,
                  "pageNumber": 1
                }
        },
        operationName: "GetLocations"
    }
}
