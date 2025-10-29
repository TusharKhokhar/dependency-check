module.exports = {
  addThing: {
    operationName: "AddThing",
    query: `mutation AddThing($addThingInput: ThingInput) {
                addThing(addThingInput: $addThingInput) {
                    AppVersion
                    Application
                    AreaID
                    CreatedBy
                    CustomerID
                    CustomizationID
                    Description
                    DeviceID
                    PrintUSBAsGuest
                    PrintUSBWithAccount
                    Enabled
                    IsActive
                    IsDeleted
                    Label
                    LocationID
                    OnlineStatus
                    DisplayQrCode
                    GuestCopy
                    GuestScan
                    AutomaticSoftwareUpdate
                    MultithreadPrint
                    PJLPrint
                    PdfiumPrint
                    SecondaryRegion {
                        CertificateID
                        EncryptedPrivateKey
                        PolicyName
                        ThingArn
                        ThingID
                        ThingName
                        __typename
                    }
                    LoginOptions {
                        LoginLabelText
                        LoginOptionType
                        __typename
                        ExternalCardValidation
                        ExternalCardIdp
                    }
                    PaymentOptions {
                        Class
                        CodeAccountType
                        Location
                        PaymentOptionType
                        PortNumber
                        Provider
                        Timer
                        URL
                        __typename
                    }
                    Tags
                    Thing
                    ThingType
                    Topic
                    _id
                    __typename
                    ProfileID
                    PrimaryRegion {
                        ThingArn
                        ThingName
                        ThingID
                        CertificateID
                        PolicyName
                        EncryptedPrivateKey
                    }
                    PromptForAccount
                    EmailAsReleaseCode
                    SerialNumber
                    Firmware
                    IpAddress
                    MacAddress
                    ComputerName
                }
            }`,
    variables: {
      addThingInput: {
        Thing: "Test thing 1",
        Label: "Test thing 1",
        IsActive: null,
        DisplayQrCode: null,
        Tags: ["test"],
        ThingType: "ricoh embedded",
        DefaultDevice: null,
        AutoSelectPrinter: null,
        DebugLog: null,
        ClearLogsAfter: 7,
        TimeOut: 496,
        LoginOptions: [
          {
            LoginOptionType: "Release_Code",
            LoginLabelText: "Release_Code",
            ExternalCardValidation: true,
            ExternalCardIdp: ["67d10ddf68aac01a7db12e66"]
          },
        ],
        PaymentOptions: [
          {
            PaymentOptionType: "None",
          },
        ],
        AutomaticSoftwareUpdate: true,
        MultithreadPrint: true,
        PJLPrint: null,
        PdfiumPrint: null,
        MessageBox: null,
        GuestCopy: null,
        GuestScan: null,
        PrintUSBAsGuest: null,
        PrintUSBWithAccount: null,
        SupportedIdentityProviderID: [],
        ActivationCode: null,
        ActivationStatus: null,
        PromptForAccount: true,
        EmailAsReleaseCode: null,
        SerialNumber: "11",
        Firmware: "11",
        IpAddress: "0.0.0.0",
        MacAddress: "11",
        ComputerName: "11",
      },
    },
  },
  updateThing: {
    operationName: "UpdateThing",
    query: `mutation UpdateThing($thingId: ID!, $updateThingInput: ThingInput) {
                updateThing(thingId: $thingId, updateThingInput: $updateThingInput) {
                message
                statusCode
                __typename
                }
        }`,
    variables: {
      updateThingInput: {
        Thing: "Test thing 1",
        Label: "Test thing 11",
        IsActive: null,
        DisplayQrCode: null,
        Tags: ["test"],
        ThingType: "ricoh embedded",
        DefaultDevice: null,
        AutoSelectPrinter: null,
        DebugLog: null,
        ClearLogsAfter: 7,
        TimeOut: 496,
        LoginOptions: [
          {
            LoginOptionType: "Release_Code",
            LoginLabelText: "ReleaseCode",
            ExternalCardValidation: true,
            ExternalCardIdp: ["67d10ddf68aac01a7db12e66"]
          },
        ],
        PaymentOptions: [
          {
            PaymentOptionType: "None",
          },
        ],
        AutomaticSoftwareUpdate: true,
        MultithreadPrint: true,
        PJLPrint: null,
        PdfiumPrint: null,
        MessageBox: null,
        GuestCopy: null,
        GuestScan: null,
        PrintUSBAsGuest: null,
        PrintUSBWithAccount: null,
        SupportedIdentityProviderID: [],
        ActivationCode: null,
        ActivationStatus: null,
        PromptForAccount: true,
        EmailAsReleaseCode: false,
        SerialNumber: "111",
        Firmware: "111",
        IpAddress: "0.0.0.1",
        MacAddress: "111",
        ComputerName: "112",
      },
    },
  },
};
