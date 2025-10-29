const typeDef = `#graphql

    enum ConfirmationType {
        NO_CONFIRMATION
        EMAIL
        PRINT
    }

    type ConfirmationOption {
        ConfirmationType: ConfirmationType!
        Enabled: Boolean!
        IsDefault: Boolean
        Message: String
        Note: String
        Placeholder: String
    }

    input ConfirmationOptionInput {
        ConfirmationType: ConfirmationType!,
        Enabled: Boolean!,
        IsDefault: Boolean,
        Message: String,
        Note: String,
        Placeholder: String
    }

    type FaxIntegration {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        Username: String,
        Password: String,
        Email: String,
        TimeOutPerPage: Int,
        AllowedUSCanadaAreaCodes: String,
        AdditionalAreaCodes: String,
        AllowedInternationalAreaCodes: String,
        FaxStatusChecking: Boolean,
        FaxDestinationText: String,
        FaxNote: String,
        LocalFaxButtonText: String,
        EnableInternationalFax: Boolean,
        InternationalFaxButtonText: String,
        EnableCoverPage: Boolean,
        CoverPageOptionText: String,
        EnableConfirmationReceipt: Boolean,
        ConfirmationReceiptOptionText: String,
        ConfirmationOptions: [ConfirmationOption!]!,
        FaxProcessScreenTitle: String,
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input FaxIntegrationInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        Username: String,
        Password: String,
        Email: String,
        TimeOutPerPage: Int,
        AllowedUSCanadaAreaCodes: String,
        AdditionalAreaCodes: String,
        AllowedInternationalAreaCodes: String,
        FaxStatusChecking: Boolean,
        FaxDestinationText: String,
        FaxNote: String,
        LocalFaxButtonText: String,
        EnableInternationalFax: Boolean,
        InternationalFaxButtonText: String,
        EnableCoverPage: Boolean,
        CoverPageOptionText: String,
        EnableConfirmationReceipt: Boolean,
        ConfirmationReceiptOptionText: String,
        ConfirmationOptions: [ConfirmationOptionInput!]!,
        FaxProcessScreenTitle: String,
        IsActive: Boolean
    }

    extend type Mutation {
        addFaxIntegration(addFaxIntegrationInput: FaxIntegrationInput): FaxIntegration
        updateFaxIntegration(updateFaxIntegrationInput: FaxIntegrationInput, customerId: ID!): Response
        deleteFaxIntegration(IsDeleted: Boolean, customerId: ID!): Response
        updateFaxIntegrationStatus(IsActive: Boolean, customerId: ID!): Response
    }
    extend type Query {
        getFaxIntegration(customerId: ID!): FaxIntegration
    }
`;

module.exports = typeDef;
