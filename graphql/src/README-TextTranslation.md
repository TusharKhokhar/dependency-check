# TextTranslation API

## Overview

The TextTranslation API provides GraphQL endpoints for managing text translation configurations. This API allows customers to configure and manage translation services, including Microsoft and Google translation options.

## Features

- Create, read, update, and delete text translation configurations
- Configure multiple translation service providers (Microsoft, Google)
- Set character limits for different translation services
- Manage language preferences with support for dynamic language lists
- Enable/disable translation configurations
- Specify service-specific settings

## Schema Definition

The API defines several key types:

### TranslationService Enum
```graphql
enum TranslationService {
  MICROSOFT
  GOOGLE
}
```

### TextTranslationInput
Input type for creating or updating text translation configurations:
```graphql
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
  Languages: [LanguageListInput]
}
```

### TextTranslation
Output type for text translation configuration data:
```graphql
type TextTranslation {
  CustomerID: ID!
  CustomerName: String!
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
  Languages: [LanguageList]
  IsActive: Boolean
  CreatedBy: String
  IsDeleted: Boolean
}
```

### Language Types
```graphql
input LanguageListInput {
  Code: String
  Language: String
}

type LanguageList {
  Code: String
  Language: String
}
```

## API Operations

### Mutations

```graphql
extend type Mutation {
  addTextTranslation(addTextTranslationInput: TextTranslationInput): TextTranslation
  updateTextTranslation(updateTextTranslationInput: TextTranslationInput, customerId: ID!): Response
  deleteTextTranslation(IsDeleted: Boolean, customerId: ID!): Response
  updateTextTranslationStatus(IsActive: Boolean, customerId: ID!): Response
}
```

### Queries

```graphql
extend type Query {
  getTextTranslation(customerId: ID!): TextTranslation
}
```

## IsCheckAll Fields Explained

The TextTranslation API includes three "IsCheckAll" boolean fields that serve important functions for language selection:

### 1. IsCheckAll
This field indicates whether all languages should be supported across all translation services. When set to `true`, the system will automatically include all available languages for translation, regardless of service provider.

**Important**: When `IsCheckAll` is enabled, any new languages added to the system in the future will automatically be supported without requiring configuration updates.

## Dynamic Language Support

The "IsCheckAll" fields are designed to work with the system's language collections. When these fields are enabled:

1. The system will reference the centralized language collections rather than only using the languages explicitly defined in the customer's configuration
2. New languages added by service providers will be automatically available to customers without requiring manual updates
3. The UI can use these flags to enable/disable "Select All" checkboxes for languages

## Implementation Details

The TextTranslation API is implemented with:

1. **GraphQL Schema**: Defined in `/graphql/src/typeDef/textTranslation.js`
2. **Resolvers**: Implemented in `/graphql/src/resolvers/textTranslation.js`
3. **Error Messages**: Defined in `/graphql/helpers/error-messages.js`
4. **Collection Definition**: Added to `/graphql/models/collections.js`
5. **Permissions**: Configured in `/graphql/helpers/apiPermissions.js`
6. **Aggregator Integration**: Added to `/graphql/helpers/aggregator.js`

## Permission Requirements

The following permissions are required for using the TextTranslation API:

- **Query operations**: 
  - `Read_Text_Translation` for retrieving text translation configurations
  - `Third_Party` for accessing translation services

- **Mutation operations**:
  - `Add_Text_Translation` for creating new configurations
  - `Update_Text_Translation` for modifying existing configurations
  - `Delete_Text_Translation` for removing configurations

## Testing

The API includes comprehensive BDD (Behavior-Driven Development) tests:

1. **Feature file**: `/graphql/features/textTranslation.feature`
2. **Step definitions**: `/graphql/features/step_definitions/textTranslation.step.js`
3. **Query definitions**: `/graphql/features/queries/textTranslation.js`
4. **Mutation definitions**: `/graphql/features/mutations/textTranslation.mutation.js`
5. **Mock data**: `/graphql/features/mocks/textTranslationMock.js`

Run tests using:
```bash
npm run test-textTranslation
```

## Usage Examples

### Adding a Text Translation Configuration

```graphql
mutation {
  addTextTranslation(addTextTranslationInput: {
    CustomerID: "123456789",
    ThirdPartySoftwareName: "My Translation Service",
    ThirdPartySoftwareType: "TextTranslation",
    Tags: ["translation", "document"],
    EnableMicrosoftTranslation: true,
    EnableGoogleTranslation: true,
    TranslationServices: ["MICROSOFT", "GOOGLE"],
    MicrosoftCharacterLimit: 5000,
    GoogleCharacterLimit: 5000,
    AttachOriginalDocument: true,
    IsCheckAll: true,
    Languages: [
      { Code: "en", Language: "English" },
      { Code: "fr", Language: "French" }
    ]
  }) {
    CustomerID
    CustomerName
    ThirdPartySoftwareName
    TranslationServices
    IsActive
  }
}
```

### Retrieving a Text Translation Configuration

```graphql
query {
  getTextTranslation(customerId: "123456789") {
    CustomerID
    CustomerName
    ThirdPartySoftwareName
    EnableMicrosoftTranslation
    EnableGoogleTranslation
    TranslationServices
    IsCheckAll
    Languages {
      Code
      Language
    }
  }
}
```
