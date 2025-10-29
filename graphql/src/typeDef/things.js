const typeDef = `#graphql
    type Thing {
        _id: ID,
        Label: String,
        Thing: String,
        ThingType: String,
        Description: String,
        Enabled: Boolean,
        CustomerID: ID,
        CustomerData: CustomerDataSchema,
        CustomerName: String,
        LocationID: ID,
        LocationData: LocationDataSchema,
        AreaID: ID,
        DeviceID: [ID],
        CustomizationID: String,
        DeviceData: [Device],
        PrimaryRegion: IotRegionDetails,
        SecondaryRegion: IotRegionDetails,
        Topic: String,
        AppVersion:String,
        OnlineStatus: Boolean,
        DisconnectReason: String,
        ProfileID: String,
        Application: String,
        ActivationCode: String,
        ActivationStatus: String,
        AutomaticSoftwareUpdate: Boolean,
        LoginOptions: [LoginOptionsSchema],
        SupportedIdentityProviderID: [ID],
        PaymentOptions: [PaymentOptionsThings],
        RedundancySetting: RedundancySettingSchema,
        Tags: [String],
        AutoSelectPrinter: Boolean,
        DebugLog: Boolean,
        ClearLogsAfter: Int,
        TimeOut: Int,
        DefaultDevice: ID,
        CreatedBy: String,
        IsDeleted: Boolean,
        DisplayQrCode: Boolean,
        PJLPrint: Boolean,
        PdfiumPrint: Boolean,
        MultithreadPrint: Boolean,
        MessageBox: String,
        GuestCopy: Boolean,
        GuestScan: Boolean,
        IsActive: Boolean,
        PrintUSBAsGuest: Boolean,
        PrintUSBWithAccount: Boolean,
        PromptForAccount: Boolean,
        EmailAsReleaseCode: Boolean,
        SerialNumber: String,
        Firmware: String,
        IpAddress: String,
        MacAddress: String,
        ComputerName: String
    }
    
    type LocationDataSchema {
        _id: ID,
        Location: String
    }
    type CustomerDataSchema {
        _id: ID,
        CustomerName: String,
        DomainName: String
    }
    
    type IotRegionDetails {
        ThingArn: String,
        ThingName: String,
        ThingID: String,
        CertificateID: String,
        PolicyName: String,
        EncryptedPrivateKey: String
    }
    
    input ThingInput {
        Label: String,
        Thing: String!,
        ThingType: String,
        Description: String,
        Enabled: Boolean,
        CustomerID: ID!,
        LocationID: ID!,
        AreaID: ID,
        DeviceID: [ID],
        CustomizationID: String,
        ThingArn: String,
        ThingName: String,
        Topic: String,
        AppVersion:String,
        OnlineStatus: Boolean,
        ProfileID: String,
        Application: String,
        ActivationCode: String,
        ActivationStatus: String,
        Tags: [String],
        AutoSelectPrinter: Boolean,
        DebugLog: Boolean,
        ClearLogsAfter: Int,
        TimeOut: Int,
        DefaultDevice: ID,
        LoginOptions: [LoginOptionsInput],
        SupportedIdentityProviderID: [ID],
        PaymentOptions: [PaymentOptionsThingsInput],
        RedundancySetting: RedundancySettingInput,
        AutomaticSoftwareUpdate: Boolean,
        PJLPrint: Boolean,
        PdfiumPrint: Boolean,
        MultithreadPrint: Boolean,
        MessageBox: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String,
        IsActive: Boolean
        DisplayQrCode: Boolean,
        GuestCopy: Boolean,
        GuestScan: Boolean,
        PrintUSBAsGuest: Boolean,
        PrintUSBWithAccount: Boolean,
        PromptForAccount: Boolean,
        EmailAsReleaseCode: Boolean,
        SerialNumber: String,
        Firmware: String,
        IpAddress: String,
        MacAddress: String,
        ComputerName: String
    }

    type PaymentOptionsThings {
        PaymentOptionType: ThingPaymentOption
        URL: String,
        Location: String,
        Provider: String,
        CodeAccountType: String,
        TerminalID: String,
        Class: String,
        PortNumber: Int,
        Timer: Int,
        MessageBox: String,
        MediaEntry: String,
        VendMode: Boolean,
        AccountNumber: Int,
        AccountMode: String,
        AtriumEndpoint: String
    }

    input PaymentOptionsThingsInput {
        PaymentOptionType: ThingPaymentOption
        URL: String,
        Location: String,
        Provider: String,
        CodeAccountType: String,
        Class: String,
        PortNumber: Int,
        Timer: Int,
        MessageBox: String,
        MediaEntry: String,
        TerminalID: String,
        VendMode: Boolean,
        AccountNumber: Int,
        AccountMode: String,
        AtriumEndpoint: String
    }

    type RedundancySettingSchema {
        Redundancy: Boolean,
        Primary: Boolean,
        ThingsAssociated: [ID],
        PrimaryThingID: ID
    }

    input RedundancySettingInput {
        Redundancy: Boolean,
        Primary: Boolean,
        ThingsAssociated: [ID],
        PrimaryThingID: ID
    }

    enum ThingPaymentOption {
        CoinBox
        Nayax_Credit_Card
        CBORD
        Nayax_Cloud
        Atrium
        None
    }

    enum LoginOptionsEnum {
        Release_Code
        Guest_Name
        Username
        Login_from_Identity_Providers
        CardNumber
        Pin
    }

    type LoginOptionsSchema {
        LoginOptionType: LoginOptionsEnum,
        LoginLabelText: String,
        ExternalCardValidation: Boolean,
        ExternalCardIdp: [ID]
    }

    input LoginOptionsInput {
        LoginOptionType: LoginOptionsEnum,
        LoginLabelText: String,
        ExternalCardValidation: Boolean,
        ExternalCardIdp: [ID]
    }

    type CertData {
        PrivateKey: String,
        Certificate: String,
        RootCa: String,
        Endpoint: String
    }

    type ThingsResponse {
        thing: [Thing],
        total: Int
    }

    input EmailBodyInput {
        EmailAddress: [String],
        CC: [String],
        Subject: String,
        BodyMessage: String,
        Attachments: [FileAttachmentInput]
    }

    input FileAttachmentInput {
        FileName: String,
        SystemFileName: String,
    }

    enum ServiceType {
        EmailService
    }

    extend type Mutation {
        addThing(addThingInput: ThingInput): Thing
        updateThing(updateThingInput: ThingInput, thingId: ID!): Response
        thingDeleted(IsDeleted: Boolean, thingId: ID, customerId: ID): Response
        thingStatus(IsActive: Boolean, thingId: ID, customerId: ID): Response
        emailService(emailBody: EmailBodyInput, customerId: ID, serviceName: ServiceType): Response
    }
    
    extend type Query {
        getThings(paginationInput: PaginationData, customerIds: [ID], locationIds: [ID]): ThingsResponse
        getThing(thingId: ID, customerId: ID): Thing
        generateActivationCode(thingId: ID!, customerId: ID!): Response
        getThingCertificates(certId: ID): CertData
        importThing(customerId: ID): Response
    }
`

module.exports = typeDef
