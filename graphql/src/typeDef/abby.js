const typeDef = `#graphql

    input AbbyLanguageListInput {
        Code: String
        Language: String
    }
 
    type AbbyLanguageList {
        Code: String
        Language: String
    }
    
    type Abby {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        FastObjectsExtraction: Boolean,
        FastBinarization: Boolean,
        PdfImageOnText: Boolean,
        FastMode: Boolean,
        DetectDocumentStructure: Boolean,
        AggressiveTextExtraction: Boolean,
        PromptForOriginalLanguage: Boolean,
        PdfMrcCompression: Boolean,
        IsCheckAll: Boolean,
        Languages: [AbbyLanguageList],
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input AbbyInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        FastObjectsExtraction: Boolean,
        FastBinarization: Boolean,
        PdfImageOnText: Boolean,
        FastMode: Boolean,
        DetectDocumentStructure: Boolean,
        AggressiveTextExtraction: Boolean,
        PromptForOriginalLanguage: Boolean,
        PdfMrcCompression: Boolean,
        IsCheckAll: Boolean,
        Languages: [AbbyLanguageListInput],
        IsActive: Boolean,
    }

    extend type Mutation {
        addAbby(addAbbyInput: AbbyInput): Abby
        updateAbby(updateAbbyInput: AbbyInput, customerId: ID!): Response
        deleteAbby(IsDeleted: Boolean, customerId: ID!): Response
        updateAbbyStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getAbby(customerId: ID!): Abby
    }
`;

module.exports = typeDef;
