module.exports = {
  getThirdPartySupportedLanguages: {
    operationName: "GetThirdPartySupportedLanguages",
    query: `query GetThirdPartySupportedLanguages($thirdPartySupportedLanguagesInput: ThirdPartySupportedLanguagesInput) {
            getThirdPartySupportedLanguages(thirdPartySupportedLanguagesInput: $thirdPartySupportedLanguagesInput) {
              _id
              ThirdPartySoftwareType
              Languages {
                abby {
                  Language
                  Code
                }
              }
          }
    }`,
    variables: {
      thirdPartySupportedLanguagesInput: {
        ThirdPartySoftwareType: "AbbyIntegration",
      },
    },
  },
};
