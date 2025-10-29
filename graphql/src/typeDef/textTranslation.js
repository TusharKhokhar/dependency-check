const typeDef = `#graphql 
enum TranslationService {
  MICROSOFT
  GOOGLE
}

input TextTranslationInput {
  CustomerID: ID!
  ThirdPartySoftwareName: String!
  Tags: [String]
  ThirdPartySoftwareType: ThirdPartySoftwareType!
  EnableMicrosoftTranslation: Boolean!
  EnableGoogleTranslation: Boolean!
  TranslationServices: [TranslationService!]!
  MicrosoftCharacterLimit: Int
  GoogleCharacterLimit: Int
  AttachOriginalDocument: Boolean!
  IsCheckAll: Boolean
  IsActive: Boolean
  Languages: [LanguageListInput]
}

type TextTranslation {
  _id: ID
  CustomerID: ID!
  CustomerName: String
  ThirdPartySoftwareName: String!
  Tags: [String]
  ThirdPartySoftwareType: ThirdPartySoftwareType!
  EnableMicrosoftTranslation: Boolean!
  EnableGoogleTranslation: Boolean!
  TranslationServices: [TranslationService]
  MicrosoftCharacterLimit: Int
  GoogleCharacterLimit: Int
  AttachOriginalDocument: Boolean!
  IsCheckAll: Boolean
  Languages: [LanguageList]
  IsActive: Boolean
  CreatedBy: String
  IsDeleted: Boolean
}

extend type Mutation {
  addTextTranslation(addTextTranslationInput: TextTranslationInput): TextTranslation
  updateTextTranslation(updateTextTranslationInput: TextTranslationInput, customerId: ID!): Response
  deleteTextTranslation(IsDeleted: Boolean, customerId: ID!): Response
  updateTextTranslationStatus(IsActive: Boolean, customerId: ID!): Response
}

extend type Query {
  getTextTranslation(customerId: ID!): TextTranslation
}
`;

module.exports = typeDef;
