const typeDef = `#graphql
    
    type TopSectionSchema {
        CustomerLogo: String
    }

    type DescriptionSchema {
        DescriptionTitle: String
        DescriptionBox: String
    }

    type MainSection {
        TopSection: TopSectionSchema,
        Description: DescriptionSchema,
    }

    type CostPerPageSchema {
        ColorCost: Float,
        Grayscale: Float,
        Currency: String
    }

    type UserInformationSection {
        Title: String,
        OptionsVisibility: Boolean,
        GuestVisibility: Boolean,
        ReleaseCodeVisibility: Boolean,
        ValidationVisibility: Boolean,
        Options: UserOptionsSchema
    }

    type UserOptionsSchema {
        Guest: GuestSchema,
        ReleaseCode: ReleaseCodeSchema,
        Validation: UserValidationSchema
    }

    type GuestSchema {
        UserInformationBox: String
        EmailConfirmationBox: Boolean,
        TextConfirmationBox: Boolean,
        UserInformationTextBox: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        GuestDisplayText: String
    }

    type ReleaseCodeSchema {
        EmailConfirmationBox: Boolean,
        TextConfirmationBox: Boolean,
        ReleaseCodeText: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        ReleaseCodeDisplayText: String
    }

    type UserValidationSchema {
        CardNumberBox: Boolean,
        PINBox: Boolean,
        ValidationText: String,
        CardNumberTextBox: String,
        PinNumberTextBox: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        LoginDisplayText: String
    }

    type SelectFileSection {
        SupportedFileTypes: [String],
        CostPerPageVisibility: Boolean,
        ColorCostVisibility: Boolean,
        GrayscaleVisibility: Boolean,
        CostPerPage: CostPerPageSchema
        MaxFileSize: Int
        ColorCostText: String
        GrayscaleText: String
    }

    type HowToLogoSection {
        EmailAddressAssignedCustomer: String,
        EmailAddressAssignedCustomerAlias: String,
        EmailAddressAssignedGrayscale: String,
        EmailAddressAssignedGrayscaleAlias: String,
        EmailAddressAssignedColor: String,
        EmailAddressAssignedColorAlias: String,
        PartnerLogo: String,
        PartnerUrl: String,
        PartnerUrlText: String,
        UploadURL: String
    }

    input TopSectionInput {
        CustomerLogo: String
    }

    input DescriptionInput {
        DescriptionTitle: String
        DescriptionBox: String
    }

    input MainSectionInput {
        TopSection: TopSectionInput,
        Description: DescriptionInput,
    }

    input CostPerPageInput {
        ColorCost: Float,
        Grayscale: Float,
        Currency: String
    }

    input UserInformationSectionInput {
        Title: String
        OptionsVisibility: Boolean,
        GuestVisibility: Boolean,
        ReleaseCodeVisibility: Boolean,
        ValidationVisibility: Boolean,
        Options: UserOptionsInput
    }

    input UserOptionsInput {
        Guest: GuestInput,
        ReleaseCode: ReleaseCodeInput,
        Validation: UserValidationInput
    }

    input GuestInput {
        UserInformationBox: String
        EmailConfirmationBox: Boolean,
        TextConfirmationBox: Boolean,
        UserInformationTextBox: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        GuestDisplayText: String
    }

    input ReleaseCodeInput {
        EmailConfirmationBox: Boolean,
        TextConfirmationBox: Boolean,
        ReleaseCodeText: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        ReleaseCodeDisplayText: String
    }

    input UserValidationInput {
        CardNumberBox: Boolean,
        PINBox: Boolean,
        ValidationText: String,
        CardNumberTextBox: String,
        PinNumberTextBox: String,
        EmailConfirmationTextBox: String,
        TextConfirmationTextBox: String,
        LoginDisplayText: String
    }

    input SelectFileSectionInput {
        SupportedFileTypes: [String],
        CostPerPageVisibility: Boolean,
        ColorCostVisibility: Boolean,
        GrayscaleVisibility: Boolean,
        CostPerPage: CostPerPageInput
        MaxFileSize: Int
        ColorCostText: String
        GrayscaleText: String
    }

    input HowToLogoSectionInput {
        EmailAddressAssignedCustomer: String,
        EmailAddressAssignedCustomerAlias: String,
        EmailAddressAssignedGrayscale: String,
        EmailAddressAssignedGrayscaleAlias: String,
        EmailAddressAssignedColor: String,
        EmailAddressAssignedColorAlias: String,
        PartnerLogo: String,
        PartnerUrl: String,
        PartnerUrlText: String
    }
    
    type LocationHoursSection {
        Title: String,
        LocationHoursSectionDescription: String,
        LocationList: Boolean,
        LocationSelectionRequired: Boolean
        OpenHoursVisibility: Boolean,
        LocationHourTitle: String
    }
    
    input LocationHoursSectionInput {
        Title: String,
        LocationHoursSectionDescription: String,
        LocationSelectionRequired: Boolean,
        LocationList: Boolean,
        OpenHoursVisibility: Boolean,
        LocationHourTitle: String
    }

    type LogoMobile {
        Logo: String,
        Url: String
    }

    input LogoMobileInput {
        Logo: String,
        Url: String
    }

    type customizationText {
        _id: ID,
        CustomerID: String
        Languages: [String],
        CustomerLanguage: String,
        MainSection: MainSection,
        SelectFileSection: SelectFileSection,
        UserInformationSection: UserInformationSection,
        HowToLogoSection: HowToLogoSection,
        TermsAndServiceAdditions: String,
        AdvancedEmailConfiguration: AdvancedEmailConfigurationSchema,
        LocationHoursSection: LocationHoursSection
        LocationSearchRange: Int,
        AddValuePageAmount: [Float],
        LogoMobile: LogoMobile,
        BrandScheme: String,
        Layout: String,
        Currency: String,
        GlobalDecimalSetting: Int,
        CustomEmailMessage: String,
        MobileConfiguration: MobileConfigurationSchema,
        PriceToggle: Boolean,
        SignUpGroup: ID,
        GroupData: GroupDataSchema
        EnableSignUp: Boolean,
        HideEmailPrinting: Boolean,
        DecimalSeparator: String,
        DeletedAt: Date,
        DisplayUpload: Boolean,
        IsDeleted: Boolean,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedBy: String,
    }

    type AdvancedEmailConfigurationSchema {
        Enabled: Boolean,
        AdvancedEmailAlias: AdvancesEmailGrouped
    }

    type AdvancesEmailGrouped {
        bw: [AdvancedEmailSupportSchema],
        color: [AdvancedEmailSupportSchema]
    }

    type AdvancedEmailSupportSchema {
        CombinationType: String,
        Email: String,
        AliasEmail: String
    }

    input AdvancedEmailSupport {
        CombinationType: String,
        Email: String,
        AliasEmail: String
    }

    input AdvancedEmailConfigurationInput {
        Enabled: Boolean,
        AdvancedEmailAlias: [AdvancedEmailSupport]
    }
    
    input customizationTextInput {
        CustomerID: String
        Languages: [String],
        CustomerLanguage: String,
        MainSection: MainSectionInput,
        SelectFileSection: SelectFileSectionInput,
        UserInformationSection: UserInformationSectionInput,
        LocationHoursSection: LocationHoursSectionInput,
        HowToLogoSection: HowToLogoSectionInput,
        TermsAndServiceAdditions: String,
        AdvancedEmailConfiguration: AdvancedEmailConfigurationInput,
        LocationSearchRange: Int,
        LogoMobile: LogoMobileInput,
        AddValuePageAmount: [Float],
        BrandScheme: String,
        Layout: String,
        GlobalDecimalSetting: Int,
        CustomEmailMessage: String,
        MobileConfiguration: MobileConfigurationInput,
        PriceToggle: Boolean,
        SignUpGroup: ID,
        EnableSignUp: Boolean,
        HideEmailPrinting: Boolean,
        DecimalSeparator: String,
        Currency: String,
        DisplayUpload: Boolean
    }

    type MobileConfigurationSchema {
        LocationConfiguration: LocationDataSchema,
        LockLocationChange: Boolean,
        MultipleLocationConfiguration: [LocationDataSchema],
        FileOption: Boolean,
        PictureOption: Boolean,
        AccountOnly: Boolean,
        AccountOnlyLock: Boolean,
        DisableNewAccount: Boolean,
        EmailOption: Boolean,
        CloudStorage: CloudStorageSchema,
        CloudStorageToggle: Boolean,
        QRScanning: Boolean
    }

    input MobileConfigurationInput {
        LocationConfiguration: ID,
        LockLocationChange: Boolean,
        MultipleLocationConfiguration: [ID],
        AccountOnly: Boolean,
        AccountOnlyLock: Boolean,
        DisableNewAccount: Boolean,
        FileOption: Boolean,
        PictureOption: Boolean,
        EmailOption: Boolean,
        CloudStorageToggle: Boolean,
        CloudStorage: CloudStorageInput,
        QRScanning: Boolean
    }

    type CloudStorageSchema {
        OneDrive: Boolean,
        DropBox: Boolean,
        Box: Boolean,
        GoogleDrive: Boolean,
        Office365: Boolean
    }

    input CloudStorageInput {
        OneDrive: Boolean,
        DropBox: Boolean,
        Box: Boolean,
        GoogleDrive: Boolean,
        Office365: Boolean
    }

    type CustomizationTextsResponse {
        customizationText: [customizationText],
        total: Int
    }

    enum AdvanceEmailOptions {
        BW_ONESIDED_A3,
        BW_TWOSIDED_A3,
        BW_ONESIDED_A4,
        BW_TWOSIDED_A4,
        BW_ONESIDED_LEDGER,
        BW_TWOSIDED_LEDGER,
        BW_ONESIDED_LEGAL,
        BW_TWOSIDED_LEGAL,
        BW_ONESIDED_LETTER,
        BW_TWOSIDED_LETTER,
        BW_ONESIDED_TABLOID,
        BW_TWOSIDED_TABLOID,
        BW_ONESIDED,
        COLOR_ONESIDED,
        BW_TWOSIDED,
        COLOR_TWOSIDED,
        BW,
        COLOR,
        COLOR_ONESIDED_A3,
        COLOR_TWOSIDED_A3,
        COLOR_ONESIDED_A4,
        COLOR_TWOSIDED_A4,
        COLOR_ONESIDED_LEDGER,
        COLOR_TWOSIDED_LEDGER,
        COLOR_ONESIDED_LEGAL,
        COLOR_TWOSIDED_LEGAL,
        COLOR_ONESIDED_LETTER,
        COLOR_TWOSIDED_LETTER,
        COLOR_ONESIDED_TABLOID,
        COLOR_TWOSIDED_TABLOID,
    }

    extend type Mutation {
        addCustomizationText(addCustomizationTextInput: customizationTextInput): customizationText
        updateCustomizationText(updateCustomizationTextInput: customizationTextInput, customizationTextId: String, customerId: String): Response
        customizationTextDeleted(IsDeleted: Boolean, customizationTextId: ID, customerId: ID): Response
        customizationTextStatus(IsActive: Boolean, customizationTextId: ID, customerId: ID): Response
        generateEmail (customerId: String, combination: AdvanceEmailOptions): AdvancedEmailSupportSchema
    }

    extend type Query {
        getCustomizationTexts(paginationInput: PaginationData, customerIds: [ID]): CustomizationTextsResponse
        getCustomizationText(customerId: ID): customizationText
    }
`

module.exports = typeDef
