module.exports = {
    updateJobList: {
        operationName: "UpdateJobList",
        query: `mutation UpdateJobList($updateJobListInput: JobListInput!, $jobListId: ID!) {
                updateJobList(updateJobListInput: $updateJobListInput, jobListId: $jobListId) {
                    message
                    statusCode
                }
                }`,
        variables: {
            "jobListId": "640f3002990d30e56686bd78",
            "updateJobListInput": {
                "CustomerID": "640f3002990d30e56686bd77",
                "ThingID": "640f3002990d30e56686bd79",
                "QrCodeEnabled": false,
                "AutomaticPrintDelivery": true,
                "ChargeForUsage": true,
                "FileRetainPeriod": 6,
                "DefaultValues": {
                    "Color": "Grayscale",
                    "Duplex": false,
                    "PaperSize": "A4",
                    "Orientation": "Portrait"
                },
                "Copies": {
                    "Enabled": true,
                    "Limit": 10
                },
                "Color": {
                    "Enabled": true,
                    "Color": true,
                    "Grayscale": false
                },
                "PaperSize": {
                    "Enabled": true,
                    "AsSaved": true,
                    "A4": {
                        "Enabled": true,
                        "Price": {
                            "Color": 11,
                            "Grayscale": 5,
                            "ColorDuplex": 7,
                            "GrayscaleDuplex": 9
                        }
                    }
                },
                IppSettings: {
                    AllowedCIDRorIPs: [
                        "0.0.0.0/0",
                        "172.16.0.0", // Allow all IPs (current default)
                        "192.168.1.0/24",      // Private network - typical home/office
                        "10.0.0.0/8",          // Private network - large enterprise
                        "172.16.0.0/12",       // Private network - medium enterprise
                        "203.0.113.0/24",      // Test network (RFC 5737)
                        "198.51.100.0/24",     // Test network (RFC 5737)
                        "192.0.2.0/24",        // Test network (RFC 5737)
                        "127.0.0.1/32",        // Localhost only
                        "10.1.1.100/32",       // Specific IP in private range
                        "192.168.0.1/32"
                    ]
                }
            }
        }
    }
};