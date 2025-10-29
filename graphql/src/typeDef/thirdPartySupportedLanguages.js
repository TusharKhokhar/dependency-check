const typeDef = `#graphql

    type AudioLanguages {
        Microsoft: [ThirdPartyLanguage],
        AllLanguages: [ThirdPartyLanguage]
    }

    type TextLanguages {
        Microsoft: [ThirdPartyLanguage],
        Google: [ThirdPartyLanguage],
        AllLanguages: [ThirdPartyLanguage]
    }

    type AbbyLanguages {
        Abby: [ThirdPartyLanguage],
    }

    type ThirdPartyLanguage {
        Language: String
        Code: String
    }

    type ThirdPartySupportedLanguages {
        _id: ID,
        ThirdPartySoftwareType: String!,
        AbbyIntegration: AbbyLanguages,
        AudioIntegration: AudioLanguages
        TextTranslationIntegration: TextLanguages
    }

    input ThirdPartySupportedLanguagesInput {
       ThirdPartySoftwareType: ThirdPartySoftwareType!
    }

    extend type Query {
        getThirdPartySupportedLanguages(thirdPartySupportedLanguagesInput: ThirdPartySupportedLanguagesInput): ThirdPartySupportedLanguages
    }
`;

module.exports = typeDef;
