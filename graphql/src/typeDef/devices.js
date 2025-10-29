const typeDef = `#graphql
    type Device {
        Label: String,
        _id: ID,
        Device: String,
        Description: String,
        DeviceType: String,
        QrCode: String,
        Tags: [String],
        Enabled: Boolean,
        NetBiosName: String,
        MacAddress: String,
        CustomerID: ID,
        GroupID: [ID],
        CustomerData: CustomerDataSchema,
        CustomerName: String,
        LocationID: ID,
        LocationData: LocationDataSchema,
        AreaID: String,
        ThingID: String,
        ColorEnabled: Boolean,
        DuplexEnabled: Boolean,
        LayoutEnabled: Boolean,
        PaperSizesEnabled: Boolean,
        SupportedPrintOptions: Boolean
        Color: ColorDeviceSchema,
        Duplex: DuplexDeviceSchema,
        Layout: LayoutDeviceSchema,
        PaperSizes: PaperSizesDeviceSchema,
        ThingData: ThingDataSchema,
        IppPrintOptions: IppPrintOptionsSchema,
        TcpPrintOptions : TcpPrintOptionsSchema
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String
    }
    
    type ThingDataSchema {
        Thing: String,
        _id: ID,
        OnlineStatus: Boolean
    }
    
    input DeviceInput {
        Label: String,
        Device: String!,
        DeviceType: String,
        Description: String,
        Tags: [String],
        Enabled: Boolean,
        NetBiosName: String,
        QrCode: String,
        SupportedPrintOptions: Boolean,
        ColorEnabled: Boolean,
        DuplexEnabled: Boolean,
        LayoutEnabled: Boolean,
        PaperSizesEnabled: Boolean,
        MacAddress: String,
        CustomerID: String!,
        LocationID: String,
        AreaID: String,
        ThingID: String,
        Color: ColorDeviceInput,
        Duplex: DuplexDeviceInput,
        Layout: LayoutDeviceInput,
        PaperSizes: PaperSizesDeviceInput,
        IppPrintOptions: IppPrintOptionsInput,
        TcpPrintOptions : TcpPrintOptionsInput
        IsActive: Boolean = true,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type ColorDeviceSchema {
        Color: Boolean,
        GrayScale: Boolean
    }

    input ColorDeviceInput {
        Color: Boolean,
        GrayScale: Boolean
    }

    type DuplexDeviceSchema {
        OneSided: Boolean,
        TwoSided: Boolean
    }

    input DuplexDeviceInput {
        OneSided: Boolean,
        TwoSided: Boolean
    }

    type LayoutDeviceSchema {
        Portrait: Boolean,
        LandScape: Boolean
    }

    input LayoutDeviceInput {
        Portrait: Boolean,
        LandScape: Boolean
    }

    type PaperSizesDeviceSchema {
        Letter: Boolean,
        Legal: Boolean,
        Ledger: Boolean,
        Tabloid: Boolean,
        A4: Boolean,
        A3: Boolean
    }

    input PaperSizesDeviceInput {
        Letter: Boolean,
        Legal: Boolean,
        Ledger: Boolean,
        Tabloid: Boolean,
        A4: Boolean,
        A3: Boolean
    }

    type IppPrintOptionsSchema {
        IppPrint: Boolean,
        IpAddress: String,
        Port: Int,
        Username: String,
        Password: String,
        Tls: Boolean,
        PrinterUUID: String,
        PrintUrl: String,
        PrintSecureUrl: String,
        AppFormat: String,
        BaseUrl: String,
        IppVersion: String
    }

    type TcpPrintOptionsSchema {
        TcpPrint: Boolean,
        IpAddress: String,
        Port: Int
    }

    input IppPrintOptionsInput {
        IppPrint: Boolean,
        IpAddress: String,
        Port: Int,
        Username: String,
        Password: String,
        Tls: Boolean,
        AppFormat: String,
        BaseUrl: String,
        IppVersion: String
    }

    input TcpPrintOptionsInput {
        TcpPrint: Boolean,
        IpAddress: String,
        Port: Int
    }

    type DevicesResponse {
        device: [Device],
        total: Int
    }
    
    extend type Mutation {
        addDevice(addDeviceInput: DeviceInput): Device
        updateDevice(updateDeviceInput: DeviceInput, deviceId: ID!): Response
        deviceDeleted(IsDeleted: Boolean, deviceId: ID, customerId: ID): Response
        deviceStatus(IsActive: Boolean, deviceId: ID, customerId: ID): Response
        saveIppPrinterAttributes (customerId: ID!, deviceId: ID!, attributes: String!): Response
    }
    
    extend type Query {
        getDevices(paginationInput: PaginationData, customerIds: [ID], locationIds: [ID], online: Boolean, deviceIds: [ID], groupIds: [ID], isAssigned: Boolean): DevicesResponse
        getDevice(deviceId: ID, customerId: ID): Device
        importDevice(customerId: ID): Response
    }
`

module.exports = typeDef
