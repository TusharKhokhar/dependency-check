const typeDef = `#graphql
    type LoginSchema {
        Username: String,
        Password: String,
        Domain: String,
        LoginOption: String
    }
    
    input LoginInput {
        Username: String,
        Password: String,
        Domain: String,
        LoginOption: String
    }

    type DriverSchema {
        ValidationType: ProfileValidationType,
        Default: Boolean,
        ConfirmationMessagedescription: String,
        IdentifierPrompt: Boolean,
        PromptMessage: String,
        Identifier: String,
        PasswordEnabled: Boolean,
        PasswordField: String,
        Location: Boolean,
        Locationprompt: Boolean,
        LocationId: String,
        EditDocName: Boolean,
        RememberMe: Boolean,
        RememberMeDisplay: Boolean,
        RememberMeSet: Boolean,
        LoginOption: String,
        IdentitiyProviderID: String
    }

    input DriverInput {
        ValidationType: ProfileValidationType,
        Default: Boolean,
        ConfirmationMessagedescription: String,
        IdentifierPrompt: Boolean,
        PromptMessage: String,
        Identifier: String,
        PasswordEnabled: Boolean,
        PasswordField: String,
        Location: Boolean,
        Locationprompt: Boolean,
        LocationId: String,
        EditDocName: Boolean,
        RememberMe: Boolean,
        RememberMeDisplay: Boolean,
        RememberMeSet: Boolean,
        LoginOption: String,
        IdentitiyProviderID: String
    }
    
    type Profile {
        _id: ID,
        Profile: String,
        CustomerID: String,
        ProfileType: String,
        Description: String,
        ProfileSetting: ProfileSettingSchema,
        Tags: [String],
        Priority: Int,
        Login: LoginSchema,
        Driver: DriverSchema,
        CustomerData: CustomerDataSchema,
        HideFromList: Boolean,
        AutoUpdate: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
        IsActive: Boolean
    }

    type ProfileSettingSchema {
        PromptForPrinter: Boolean,
        PrintConfigurationGroup: Group,
        AutomaticPrintDelivery: Boolean,
        DisableConfirmation: Boolean,
        Description: String
    }

    input ProfileSettingInput {
        PromptForPrinter: Boolean,
        PrintConfigurationGroup: ID,
        AutomaticPrintDelivery: Boolean,
        DisableConfirmation: Boolean,
        Description: String
    }
    
    input ProfileInput {
        Profile: String,
        CustomerID: String,
        ProfileType: String,
        Description: String,
        Priority: Int,
        ProfileSetting: ProfileSettingInput,
        Login: LoginInput,
        Driver: DriverInput,
        HideFromList: Boolean,
        AutoUpdate: Boolean,
        Tags: [String],
        UpdatedBy: String,
        IsActive: Boolean,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    enum ProfileValidationType {
        Envisionware,
        Login,
        LMSValidate,
        ReleaseCode,
        GuestName,
        ComputerName,
        SSO,
        MyPC
    }
    
    type ProfilesResponse {
        profile: [Profile],
        total: Int
    }

    extend type Mutation {
        addProfile(addProfileInput: ProfileInput): Profile
        updateProfile(updateProfileInput: ProfileInput, profileId: ID!, customerId: ID): Response
        profileDeleted(IsDeleted: Boolean, profileId: ID, customerId: ID): Response
        profileStatus(IsActive: Boolean, profileId: ID, customerId: ID): Response
    }
    
    extend type Query {
        getProfiles(paginationInput: PaginationData, customerIds: [ID]): ProfilesResponse
        getProfile(profileId: ID, customerId: ID): Profile
    }
`

module.exports = typeDef
