module.exports = {
    addLocation: {
        query: `mutation AddLocation($addLocationInput: LocationInput) {
                    addLocation(addLocationInput: $addLocationInput) {
                        Address
                        CurrencyCode
                        Location
                        Zip
                        TimeZone
                        CustomerID
                        _id
                        ShortName
                    }
                }`,
        variables: {
            "addLocationInput": {
            "CurrencyCode": "INR",
            "City": "Bhopal",
            "Location": "SLST",
            "Address": "Bawadia Kalan",
            "TimeZone": "Asia",
            "Tags": "testapi",
            "Zip": "test",
            "CustomerID": "633c4f831d56a2724c9b58d2",
            "ShortName": "test api",
            "Longitude": 28.5424695,
            "Latitude": 27.911111,
        }
        }
    }
}
