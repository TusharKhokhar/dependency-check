const typeDef = `#graphql

    enum MicrosoftAudioVersion {
        v1
    }

    input LanguageConfigInput {
        Microsoft: [LanguageListInput]
        AllLanguages: [LanguageListInput]
    }

    type LanguageConfig {
        Microsoft: [LanguageList]
        AllLanguages: [LanguageList]
    }

    input LanguageListInput {
        Code: String
        Language: String
    }
 
    type LanguageList {
        Code: String
        Language: String
    }

    type Audio {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        AudioService: [TranslationService],
        MicrosoftAudioVersion: MicrosoftAudioVersion,
        AttachDocument: Boolean,
        IsCheckAll: Boolean,
        Languages: [LanguageList],
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input AudioInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        AudioService: [TranslationService],
        MicrosoftAudioVersion: MicrosoftAudioVersion,
        AttachDocument: Boolean,
        IsCheckAll: Boolean,
        Languages: [LanguageListInput],
        IsActive: Boolean,
    }

    extend type Mutation {
        addAudio(addAudioInput: AudioInput): Audio
        updateAudio(updateAudioInput: AudioInput, customerId: ID!): Response
        deleteAudio(IsDeleted: Boolean, customerId: ID!): Response
        updateAudioStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getAudio(customerId: ID!): Audio
    }
`;

module.exports = typeDef;
