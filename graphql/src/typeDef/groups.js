const typeDef = `#graphql
    type LMSRulesSchema {
        SubGroupName: String,
        Priority: Int,
        Enabled: Boolean,
        Field: [String],
        SingleMatch: Boolean,
        EqualTo: String,
        NotEqualto: String,
        OlderThan: Int,
        YoungerThan: Int
    }

    input LMSRulesInput {
        SubGroupName: String,
        Priority: Int,
        Enabled: Boolean,
        Field: [String],
        SingleMatch: Boolean,
        EqualTo: String,
        NotEqualto: String,
        OlderThan: Int,
        YoungerThan: Int
    }

    type PoliciesSchema {
        MaxSessionsPerday: Int,
        MaxNumberSessionsPerWeek: Int,
        MaxTimePerDay: Int,
        MaxTimePerWeek: Int,
        FutureDaysAdvance: Int,
        MaxOutstandingBookings: Int,
        MaxOutstandingTime: Int
    }

    input PoliciesInput {
        MaxSessionsPerday: Int,
        MaxNumberSessionsPerWeek: Int,
        MaxTimePerDay: Int,
        MaxTimePerWeek: Int,
        FutureDaysAdvance: Int,
        MaxOutstandingBookings: Int,
        MaxOutstandingTime: Int
    }

    type QuotaSchema {
        AddValuetoBalance: String,
        Amount: Int,
        Schedule: Boolean,
        Frequency: String,
        InitialSetup: String,
        Oncreated: Boolean,
        AddedtoGroup: Boolean
    }

    input QuotaInput {
        AddValuetoBalance: String,
        Amount: Int,
        Schedule: Boolean,
        Frequency: String,
        InitialSetup: String,
        Oncreated: Boolean,
        AddedtoGroup: Boolean
    }

    type AccessSchema {
        Location: String,
        Area: [String],
        PrintRelease: Boolean,
        PrintReleaseforOthers: Boolean,
        PrintReleaseDelete: Boolean,
        PrintReleaseOverride: Boolean,
        RePrint: Boolean,
        RePrintforOthers: Boolean,
        RePrintDelete: Boolean,
        RePrintOverride: Boolean,
        BookforSelf: Boolean,
        BookforOthers: Boolean,
        Configuration: Int,
        Reports: [String]
    }

    input AccessInput {
        Location: String,
        Area: [String],
        PrintRelease: Boolean,
        PrintReleaseforOthers: Boolean,
        PrintReleaseDelete: Boolean,
        PrintReleaseOverride: Boolean,
        RePrint: Boolean,
        RePrintforOthers: Boolean,
        RePrintDelete: Boolean,
        RePrintOverride: Boolean,
        BookforSelf: Boolean,
        BookforOthers: Boolean,
        Configuration: Int,
        Reports: [String]
    }

    type PrintConfigSchema {
        ReleaseCode: Boolean,
        GuestName: Boolean,
        Email: Boolean,
        ComputerName: Boolean,
        Username: Boolean,
        Cost: Boolean,
        MaskFileNames: Boolean
    }

    type QuotaBalanceSchema {
        Scheduled: Boolean,
        MaxBalance: Float,
        Amount: Float,
        Frequency: String,
        Day: String,
        Dates: [Date]
    }

    input QuotaBalanceInput {
        Scheduled: Boolean,
        MaxBalance: Float,
        Amount: Float,
        Frequency: String,
        Day: String,
        Dates: [Date]
    }

    input PrintConfigInput {
        ReleaseCode: Boolean,
        GuestName: Boolean,
        Email: Boolean,
        ComputerName: Boolean,
        Username: Boolean,
        Cost: Boolean,
        MaskFileNames: Boolean
    }

    type Group {
        _id: ID,
        Label: String,
        GroupName: String,
        DeviceID: [ID],
        Description: String,
        GroupType: String,
        Tags: [String],
        Priority: Int,
        Enabled: Boolean,
        RoleType: String,
        Access: AccessSchema,
        PrintConfig: PrintConfigSchema,
        LMSRules: LMSRulesSchema,
        Policies: PoliciesSchema,
        Quota: QuotaSchema,
        RulesID: [String],
        UserID: [String],
        CustomerData: CustomerDataSchema
        CustomerID: ID,
        PrintReview: Boolean,
        ModifyPrintJob: Boolean,
        PrinterGroups: Boolean,
        PrintGroups: [PrintGroupsSchema],
        QuotaBalance: QuotaBalanceSchema,
        AssociatedQuotaBalance: [ID]
        PrintConfigurationGroupID: ID,
        DebitBalancePriority: Int
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String,
        IsActive: Boolean,
        RoleData: RoleData,
        DeviceData: [DeviceData]
    }

    type PrintGroupsSchema {
        _id: ID,
        PrinterGroupName: String,
        DeviceId: [ID],
        Enabled: Boolean
        OverRideSettings: OverRideSchema
    }

    input PrintGroupsInput {
        _id: ID,
        PrinterGroupName: String,
        DeviceId: [ID],
        Enabled: Boolean
        OverRideSettings: OverRideInput 
    }

    input OverRideInput {
        OverRideCharge: Boolean,
        PromptOverRide: Boolean
        DefaultToOverRide: Boolean
    }

    type OverRideSchema {
        OverRideCharge: Boolean,
        PromptOverRide: Boolean
        DefaultToOverRide: Boolean
    }

    type RoleData {
        _id: ID,
        RoleName: String
    }

    type DeviceData {
        _id: ID,
        Device: String
    }

    input GroupInput {
        Label: String,
        GroupName: String,
        Description: String,
        DeviceID: [ID],
        GroupType: String,
        Tags: [String],
        Priority: Int,
        Enabled: Boolean,
        RoleType: String,
        Access: AccessInput,
        PrintConfig: PrintConfigInput,
        CustomerID: String,
        LMSRules: LMSRulesInput,
        PrintConfigurationGroupID: ID,
        Policies: PoliciesInput,
        Quota: QuotaInput,
        RulesID: [String],
        UserID: [String],
        PrintReview: Boolean,
        ModifyPrintJob: Boolean,
        PrinterGroups: Boolean,
        PrintGroups: [PrintGroupsInput],
        QuotaBalance: QuotaBalanceInput,
        AssociatedQuotaBalance: [ID],
        DebitBalancePriority: Int,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String,
        IsActive: Boolean
    }

    type GroupsResponse {
        group: [Group],
        total: Int
    }

    extend type Query {
        getGroups(paginationInput: PaginationData, customerIds: [ID]): GroupsResponse
        getGroup(groupId: ID, customerId: ID): Group
    }

    extend type Mutation {
        addGroup(addGroupInput: GroupInput): Group
        updateGroup(updateGroupInput: GroupInput, groupId: ID!): Response
        groupDeleted(IsDeleted: Boolean, groupId: ID, customerId: ID): Response
        groupStatus(IsActive: Boolean, groupId: ID, customerId: ID): Response
        "Reset quota balances of the users based on the parameters"
        resetQuotaBalance(amount: Float, groupId: ID, customerId: ID): Response
    }
`

module.exports = typeDef
