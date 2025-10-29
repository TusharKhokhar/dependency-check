const typeDef = `#graphql

    type SessionTypeSchema {
        Device: Boolean,
        Future: Boolean,
        Queuing: Boolean
    }

    input SessionTypeInput {
        Device: Boolean,
        Future: Boolean,
        Queuing: Boolean
    }

    type SettingsSchema {
        InitialSessionLength: Int,
        MinimumSessionTime: Int,
        Extensions: Boolean,
        AutoExtendSession: Boolean,
        ExtensionIncrements: Int,
        NumberOfExtensions: Int
    }

    input SettingsInput {
        InitialSessionLength: Int,
        MinimumSessionTime: Int,
        Extensions: Boolean,
        AutoExtendSession: Boolean,
        ExtensionIncrements: Int,
        NumberOfExtensions: Int
    }

    type WarningMessagesIntervalSchema {
        Interval1: String,
        Interval2: String,
        Interval3: String,
        Interval4: String,
        Interval5: String
    }

    input WarningMessagesIntervalInput {
        Interval1: String,
        Interval2: String,
        Interval3: String,
        Interval4: String,
        Interval5: String
    }

    type BusyTimeInfoSchema {
        Days: [String],
        Time: [String]
    }

    input BusyTimeInfoInput {
        Days: [String],
        Time: [String]
    }

    type RelaxedTimeWhenSchema {
        Days: [String],
        Time: [String]
    }

    input RelaxedTimeWhenInput {
        Days: [String],
        Time: [String]
    }

    type ExtentionsSchema {
        AutomaticExtensions: Boolean,
        ExtentionTime: Int
    }

    input ExtentionsInput {
        AutomaticExtensions: Boolean,
        ExtentionTime: Int
    }

    type BusyTimeSchema {
        BusyTimeType: String,
        LessThanXPCsAvailable: Int,
        BusyTimeInfo: BusyTimeInfoSchema,
        InitalSession: Int,
        Extentions: ExtentionsSchema,
        LoginWaitTimeBusyTime: Int
    }

    input BusyTimeInput {
        BusyTimeType: String,
        LessThanXPCsAvailable: Int,
        BusyTimeInfo: BusyTimeInfoInput,
        InitalSession: Int,
        Extentions: ExtentionsInput,
        LoginWaitTimeBusyTime: Int
    }

    type RelaxedTimeSchema {
        RelaxedTimeType: String,
        MoreThanXPCsAvailable: Int,
        RelaxedTimeWhen: RelaxedTimeWhenSchema,
        InitialSession: Int,
        Extensions: ExtentionsSchema,
        ExtentionTime: Int,
        LoginWaitTimeRelaxedTime: Int
    }


    input RelaxedTimeInput {
        RelaxedTimeType: String,
        MoreThanXPCsAvailable: Int,
        RelaxedTimeWhen: RelaxedTimeWhenInput,
        InitialSession: Int,
        Extensions: ExtentionsInput,
        ExtentionTime: Int,
        LoginWaitTimeRelaxedTime: Int
    }

    type ClosingMessageSchema {
        MessageID: String
    }


    input ClosingMessageInput {
        MessageID: String
    }

    type EndOfDaySchema {
        Value: Boolean,
        NoSessionMinBeforeClosing: Int,
        ClosingMessage: [ClosingMessageSchema],
        Shutdown: Boolean,
        ShutDownMinutesAfterClosing: Int
    }

    input EndOfDayInput {
        Value: Boolean,
        NoSessionMinBeforeClosing: Int,
        ClosingMessage: [ClosingMessageInput],
        Shutdown: Boolean,
        ShutDownMinutesAfterClosing: Int
    }

    type ValidationSchema {
        LMSValidation: Boolean,
        InternalUser: Boolean
    }

    input ValidationInput {
        LMSValidation: Boolean,
        InternalUser: Boolean
    }

    type ChargeableSchema {
        ChargeAmount: String,
        ChargeTime: Boolean,
        ChargeSession: Boolean
    }

    input ChargeableInput {
        ChargeAmount: String,
        ChargeTime: Boolean,
        ChargeSession: Boolean
    }

    type DayHoursSchema {
        Day: String,
        OpenTimes: String,
        CloseTimes: String,
        Enable: Boolean
    }

    input DayHoursInput {
        Day: String,
        OpenTimes: String,
        CloseTimes: String,
        Enable: Boolean
    }

    type OpenTimesSchema {
        Label: String,
        OpenTimeName: String,
        Description: String,
        Tags: [String],
        DayHours: [DayHoursSchema]
    }


    input OpenTimesInput {
        Label: String,
        OpenTimeName: String,
        Description: String,
        Tags: [String],
        DayHours: [DayHoursInput]
    }

    type MessageSchema {
        MessageID: String,
    }


    input MessageInput {
        MessageID: String,
    }


    type DeviceUsagePolicySchema {
        DeviceUsagePolicyURL: String
    }

    type RuleSchema {
        Priority: Int,
        SessionType: SessionTypeSchema,
        Settings: SettingsSchema,
        NoReturnTime: Int,
        LoginWaitTime: Int,
        InactivityTimeout: Int,
        LockTimeout: Int,
        BlockBookingPersistence: Boolean,
        WelcomeMessage: MessageSchema,
        DeviceUsagePolicy: DeviceUsagePolicySchema,
        StaffFutureBooking: Int,
        WarningMessagesInterval: WarningMessagesIntervalSchema,
        BusyTime: BusyTimeSchema,
        RelaxedTime: RelaxedTimeSchema,
        EndOfDay: EndOfDaySchema,
        Validation: ValidationSchema,
        AllowsGuest: Boolean,
        Chargeable: ChargeableSchema,
        OpenTimes: OpenTimesSchema
    }

    input DeviceUsagePolicyInput {
        DeviceUsagePolicyURL: String
    }


    input RuleInput {
        Priority: Int,
        SessionType: SessionTypeInput,
        Settings: SettingsInput,
        NoReturnTime: Int,
        LoginWaitTime: Int,
        InactivityTimeout: Int,
        LockTimeout: Int,
        BlockBookingPersistence: Boolean,
        WelcomeMessage: MessageInput,
        DeviceUsagePolicy: DeviceUsagePolicyInput,
        StaffFutureBooking: Int,
        WarningMessagesInterval: WarningMessagesIntervalInput,
        BusyTime: BusyTimeInput,
        RelaxedTime: RelaxedTimeInput,
        EndOfDay: EndOfDayInput,
        Validation: ValidationInput,
        AllowsGuest: Boolean,
        Chargeable: ChargeableInput,
        OpenTimes: OpenTimesInput
    }

    type Location {
        _id: ID
        Label: String,
        Location: String,
        Description: String,
        Address: String,
        City: String,
        State: String,
        Zip: String,
        Longitude: Float,
        Latitude: Float,
        Coordinates: [Float],
        Geolocation: String,
        ShortName: String,
        TimeZone: String,
        CustomerID: String,
        CustomerData: CustomerDataSchema,
        AdvancedEmails: AdvancedEmailAliasSchema,
        AreaIDs: [String],
        Customization: [String],
        Rule: RuleSchema,
        Tags: [String],
        CreatedBy: String,
        IsDeleted: Boolean,
        IsActive: Boolean
        Searchable: Boolean,
        CurrencyCode: String,
        openTimesLocationFormatted: [String]
    }

    type AdvancedEmailAliasSchema {
        AdvancedEmailAlias: [AdvancedEmailSupportSchema]
        Enabled: Boolean
    }

    input AdvancedEmailAliasInput {
        AdvancedEmailAlias: [AdvancedEmailSupport]
        Enabled: Boolean
    }

    input LocationInput {
        Label: String,
        Location: String,
        Description: String,
        Address: String,
        City: String,
        State: String,
        Zip: String,
        Geolocation: String,
        ShortName: String,
        TimeZone: String,
        Longitude: Float,
        Latitude: Float,
        CustomerID: String,
        AreaIDs: [String],
        Customization: [String],
        AdvancedEmails: AdvancedEmailAliasInput,
        Rule: RuleInput,
        Tags: [String],
        UpdatedBy: String,
        DeletedAt: Date,
        IsActive: Boolean,
        Searchable: Boolean,
        CurrencyCode: String
    }

    type LocationsResponse {
        location: [Location],
        total: Int
    }

    extend type Mutation {
        addLocation(addLocationInput: LocationInput): Location
        updateLocation(updateLocationInput: LocationInput, locationId: ID!): Response
        locationDeleted(IsDeleted: Boolean, locationId: ID, customerId: ID): Response
        locationStatus(IsActive: Boolean, locationId: ID, customerId: ID): Response
        generateEmailForLocation (customerId: ID!, combination: AdvanceEmailOptions!, locationId: ID!): Response
    }

    extend type Query {
        getLocations(paginationInput: PaginationData, customerIds: [ID]): LocationsResponse
        getLocation(locationId: ID, customerId: ID): Location
        getLocationsByCustomerID(customerId: ID): [Location]
        importLocation(customerId: ID): Response
    }
`

module.exports = typeDef
