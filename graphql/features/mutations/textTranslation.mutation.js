// filepath: /Users/work/Documents/development/cloud-saas-api/graphql/features/mutations/textTranslation.mutation.js
module.exports = {
  addTextTranslation: {
    operationName: "AddTextTranslation",
    query: `mutation AddTextTranslation($addTextTranslationInput: TextTranslationInput) {
            addTextTranslation(addTextTranslationInput: $addTextTranslationInput) {
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
      addTextTranslationInput: {
        CustomerID: "000000000000000000000001",
        ThirdPartySoftwareName: "testing text translation",
        ThirdPartySoftwareType: "TextTranslation",
        Tags: ["test"],
        EnableMicrosoftTranslation: true,
        EnableGoogleTranslation: true,
        TranslationServices: ["MICROSOFT", "GOOGLE"],
        MicrosoftCharacterLimit: 5000,
        GoogleCharacterLimit: 5000,
        AttachOriginalDocument: true,
        IsCheckAll: true,
        Languages: [
          { Code: "en", Language: "English" },
          { Code: "fr", Language: "French" },
          { Code: "es", Language: "Spanish" }
        ]
      },
    },
  },
  updateTextTranslation: {
    operationName: "UpdateTextTranslation",
    query: `mutation UpdateTextTranslation($customerId: ID!, $updateTextTranslationInput: TextTranslationInput) {
            updateTextTranslation(customerId: $customerId, updateTextTranslationInput: $updateTextTranslationInput) {
                success
                message
            }
        }`,
    variables: {
      customerId: "000000000000000000000001",
      updateTextTranslationInput: {
        CustomerID: "000000000000000000000001",
        ThirdPartySoftwareName: "updated text translation",
        ThirdPartySoftwareType: "TextTranslation",
        Tags: ["test", "updated"],
        EnableMicrosoftTranslation: true,
        EnableGoogleTranslation: false,
        TranslationServices: ["MICROSOFT"],
        MicrosoftCharacterLimit: 10000,
        GoogleCharacterLimit: 0,
        AttachOriginalDocument: false,
        IsCheckAll: false
      },
    },
  },
  updateTextTranslationStatus: {
    operationName: "UpdateTextTranslationStatus",
    query: `mutation UpdateTextTranslationStatus($customerId: ID!, $IsActive: Boolean) {
            updateTextTranslationStatus(customerId: $customerId, IsActive: $IsActive) {
                success
                message
            }
        }`,
    variables: {
      customerId: "000000000000000000000001",
      IsActive: false,
    },
  },
  deleteTextTranslation: {
    operationName: "DeleteTextTranslation",
    query: `mutation DeleteTextTranslation($customerId: ID!, $IsDeleted: Boolean) {
            deleteTextTranslation(customerId: $customerId, IsDeleted: $IsDeleted) {
                success
                message
            }
        }`,
    variables: {
      customerId: "000000000000000000000001",
      IsDeleted: true,
    },
  },
};
