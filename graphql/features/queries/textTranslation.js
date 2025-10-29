// filepath: /Users/work/Documents/development/cloud-saas-api/graphql/features/queries/textTranslation.js
module.exports = {
  getTextTranslation: {
    operationName: "GetTextTranslation",
    query: `query GetTextTranslation($customerId: ID!) {
            getTextTranslation(customerId: $customerId) {
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                Tags
                ThirdPartySoftwareType
                EnableMicrosoftTranslation
                EnableGoogleTranslation
                TranslationServices
                MicrosoftCharacterLimit
                GoogleCharacterLimit
                AttachOriginalDocument
                IsCheckAll
                Languages {
                  Code
                  Language
                }
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      customerId: "000000000000000000000001",
    },
  },
};
