// filepath: /Users/work/Documents/development/cloud-saas-api/graphql/features/mocks/textTranslationMock.js
module.exports.mockTextTranslationResponse = {
  addTextTranslation: {
    CustomerID: "000000000000000000000001",
    CustomerName: "Test Customer",
    ThirdPartySoftwareName: "testing text translation",
    Tags: ["test"],
    ThirdPartySoftwareType: "TextTranslation",
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
    ],
    IsActive: true,
    CreatedBy: "000000000000000000000002",
    IsDeleted: false
  },

  updateTextTranslation: {
    success: true,
    message: "TextTranslation updated successfully"
  },

  deleteTextTranslation: {
    success: true,
    message: "TextTranslation deleted successfully"
  },

  updateTextTranslationStatus: {
    success: true,
    message: "TextTranslation disabled successfully"
  },

  getTextTranslation: {
    CustomerID: "000000000000000000000001",
    CustomerName: "Test Customer",
    ThirdPartySoftwareName: "testing text translation",
    Tags: ["test"],
    ThirdPartySoftwareType: "TextTranslation",
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
    ],
    IsActive: true,
    CreatedBy: "000000000000000000000002",
    IsDeleted: false
  }
};

