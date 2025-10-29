const typeDef = `#graphql
    type User {
        _id: ID
        Label: String,
        BarcodeNumber: Int,
        PIN: String,
        UserType: String,
        Username: String,
        FullName: String,
        Email: [String],
        PrimaryEmail: String,
        GroupData: [GroupDataSchema],
        CustomerData: CustomerDataSchema,
        CustomerName: String,
        MfaOption: OptionsMfaSchema,
        Balance: BalanceSchema,
        LMSInformation: LMSInformationSchema,
        PhoneNumber: String,
        Notes: String,
        Tags: [String],
        CustomerID: String,
        GroupOverride: String,
        GroupID: [String],
        GroupQuotas: [GroupQuotaSchema],
        DebitBalance: Float
        EbBlocked: EBBlockedSchema,
        EbExpiryDate: Date,
        FirstName: String,
        LastName: String,
        Tier: String,
        UserRole: String,
        TenantDomain: String,
        ApprovedUser: String,
        CardNumber: [String],
        IsActive: Boolean,
        ApiKey: String,
        Mfa: Boolean,
        Mobile: String,
        IsDeleted: Boolean,
        AuthProvideData: AuthProvideDataSchema
    }

    type AuthProvideDataSchema {
        AuthProviderID: ID,
        ProviderName: String,
        AuthProvider : String
    }

    type GroupQuotaSchema {
        GroupID: ID,
        GroupName: String,
        QuotaBalance: Float
    }

    input GroupQuotaInput {
        GroupID: ID,
        QuotaBalance: Float
    }
        
    type BalanceSchema {
        DebitBalancelabel: String,
        DebitBalanceName: String,
        DebitBalanceAmount: Int,
        QuotaBalancelabel: String,
        QuotaBalanceName: String,
        QuotaBalanceAmount: String,
    }
    
    input BalanceInputUser {
        DebitBalancelabel: String,
        DebitBalanceName: String,
        DebitBalanceAmount: Int,
        QuotaBalancelabel: String,
        QuotaBalanceName: String,
        QuotaBalanceAmount: String,
    }
    
    type LMSInformationSchema {
        LMSFineAmount: Int,
        LMSOverdueItems: [String],
        LMSStatusMessages: [String],
        LMSExpiryDate: Date,
        LMSBirthday: Date,
        LMSPhoneNumber: [String]
    }
    
    input LMSInformationInput {
        LMSFineAmount: Int,
        LMSOverdueItems: [String],
        LMSStatusMessages: [String],
        LMSExpiryDate: Date,
        LMSBirthday: Date,
        LMSPhoneNumber: [String]
    }
    
    type EBBlockedSchema {
        EbBlockedReason: String,
        EbBlockDateStart: Date,
        EbBlockDateEnd: Date,
        EbBlockPermanent: Boolean,
        EbBlockBy: String,
        EbBlockByDate: Date
    }
    
    input EBBlockedInput {
        EbBlockedReason: String,
        EbBlockDateStart: Date,
        EbBlockDateEnd: Date,
        EbBlockPermanent: Boolean,
        EbBlockBy: String,
        EbBlockByDate: Date
    }

    input PasswordInput {
        Password: String!,
        newPassword: String!,
        Username: String   
    }

    input AdminPasswordInput {
        Password: String!
    }

    input UserInput {
        Label: String,
        BarcodeNumber: Int,
        PIN: String,
        UserType: String,
        Username: String,
        Password: String,
        FullName: String,
        FirstName: String,
        LastName: String,
        Email: [String],
        PrimaryEmail: String!
        Balance: BalanceInputUser,
        LMSInformation: LMSInformationInput,
        PhoneNumber: String,
        Notes: String,
        Tags: [String],
        CustomerID: String!,
        MfaOption: OptionsMfa,
        GroupOverride: String,
        GroupID: [String],
        GroupQuotas: [GroupQuotaInput],
        DebitBalance: Float
        EbBlocked: EBBlockedInput,
        EbExpiryDate: Date,
        Tier: String!,
        UserRole: String
        TenantDomain: String!,
        CardNumber: [String],
        IsActive: Boolean,
        ApprovedUser: Boolean,
        ApiKey: String,
        Mfa: Boolean,
        Mobile: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    input OnboardUserInput {
        Label: String,
        BarcodeNumber: Int,
        PIN: String,
        UserType: String,
        Username: String,
        Password: String,
        FullName: String,
        FirstName: String,
        LastName: String,
        Email: [String],
        PrimaryEmail: String,
        Balance: BalanceInputUser,
        LMSInformation: LMSInformationInput,
        PhoneNumber: String,
        Notes: String,
        Tags: [String],
        CustomerID: String,
        GroupOverride: String,
        GroupID: [String],
        EbBlocked: EBBlockedInput,
        EbExpiryDate: Date,
        Tier: String,
        UserRole: String
        TenantDomain: String,
        MfaOption: OptionsMfa,
        CardNumber: [String],
        IsActive: Boolean,
        ApprovedUser: Boolean,
        ApiKey: String,
        Mfa: Boolean,
        Mobile: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }
    
    input OptionsMfa {
        Email: Boolean,
        Mobile: Boolean
    }

    type OptionsMfaSchema {
        Email: Boolean,
        Mobile: Boolean
    }


    input UpdateInput {
        FirstName: String!,
        LastName: String!,
        Mfa: Boolean,
        Mobile: String
        Tags: [String]
        GroupID: [ID]
        Email: [String],
        PrimaryEmail: String
        MfaOption: OptionsMfa,
        CardNumber: String,
        PIN: String,
        IsActive: Boolean,
        CustomerID: ID
    }


    input UpdateInputV2 {
        FirstName: String!,
        LastName: String!,
        Mfa: Boolean,
        Mobile: String
        Tags: [String]
        GroupID: [ID]
        Email: [String],
        PrimaryEmail: String
        MfaOption: OptionsMfa,
        CardNumber: [String],
        PIN: String,
        IsActive: Boolean,
        CustomerID: ID
    }

    input ValidationCheckInput {
        collectionName: CollectionNameType,
        fieldName: FieldNameType,
        fieldValue: String,
    }

    enum CollectionNameType {
        Customers
        Devices
        Things
        Users
        Profiles
        Locations
        Roles
    }

    enum FieldNameType {
        CustomerName
        Device
        Thing
        Username
        Profile
        DomainName
        ShortName
        RoleName
        Label
    }
    
    type UsersResponse {
        user: [User],
        total: Int
    }
    
    type GroupDataSchema {
        GroupName: String,
        _id: ID,
        DebitBalancePriority: Int
        GroupType: String
    }

    type UserSession {
        userExists: Boolean,
        FirstName: String,
        LastName: String,
        CustomerID: String,
        TenantDomain: String,
        _id: String,
        isKiosk: Boolean,
        Username: String,
        PinExists: Boolean,
        Token: String,
        PrimaryEmail: String
    }

    enum BalanceType {
        QUOTA
        DEBIT
    }

    input updateBalanceUserInput {
        Type: BalanceType!
        UserID: ID!,
        CustomerID: ID!,
        Username: String,
        Amount: Float!,
        Comment: String,
        Name: String,
        AccountID: ID!
    }

    type UserOverviewResponse {
        usage: UsagesResponse,
        transaction: UsagesResponse,
        user: User
    }

    extend type Mutation {
        addUser(addUserInput: UserInput): Response
        updateUser(updateUserInput: UpdateInput, userId: ID!, authId:ID): Response
        updateUserBalance(updateBalance: updateBalanceUserInput): Response
        updateUserV2(updateUserInput: UpdateInputV2, userId: ID!, authId:ID): Response
        changePassword(changePasswordInput : PasswordInput, customerId: ID): Response
        adminChangePassword(adminChangePasswordInput: AdminPasswordInput, userId: ID!, customerId: ID): Response
        userDeleted(IsDeleted: Boolean, userId: ID, customerId: ID): Response
        validateCardNumber (cardNumber: String, customerId: ID): UserSession
        validateCardNumberPin (cardNumber: String!, pin: String!, customerId: ID!): UserSession
        requestChangePassword (userId: ID, customerId: ID): Response
    }

    extend type Query {
        getUsers(paginationInput: PaginationData, customerIds: [ID]): UsersResponse
        getUser(userId: ID, customerId: ID): User
        userBalance(username: String): [AccountInfoSchema],
        findDataExisting(customerId: ID, ValidationCheckInput: ValidationCheckInput): Response
        getUserOverview(usagePaginationInput: PaginationData, transactionPaginationInput: PaginationData, usageFilters: FilterUsage, transactionFilters: FilterUsage, userId: ID, customerId: ID): UserOverviewResponse
    }
`

module.exports = typeDef
