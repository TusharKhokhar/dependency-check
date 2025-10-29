const { config } = require("../configs/config");

module.exports = {
  addFaxIntegration: {
    operationName: "AddFaxIntegration",
    query: `mutation AddFaxIntegration($addFaxIntegrationInput: FaxIntegrationInput) {
      addFaxIntegration(addFaxIntegrationInput: $addFaxIntegrationInput) {
        _id
        CustomerID
        CustomerName
        ThirdPartySoftwareName
        ThirdPartySoftwareType
        Tags
        Username
        Password
        Email
        TimeOutPerPage
        AllowedUSCanadaAreaCodes
        AdditionalAreaCodes
        AllowedInternationalAreaCodes
        FaxStatusChecking
        FaxDestinationText
        LocalFaxButtonText
        EnableInternationalFax
        InternationalFaxButtonText
        EnableCoverPage
        CoverPageOptionText
        EnableConfirmationReceipt
        ConfirmationReceiptOptionText
        ConfirmationOptions {
          ConfirmationType
          Enabled
          IsDefault
          Message
          Note
          Placeholder
        }
        FaxProcessScreenTitle
        IsActive
        CreatedBy
        IsDeleted
        FaxNote
      }
    }`,
    variables: {
      addFaxIntegrationInput: {
        AllowedInternationalAreaCodes: "201, 202, 203",
        AllowedUSCanadaAreaCodes: "201, 202, 203",
        ConfirmationOptions: [
          {
            ConfirmationType: "NO_CONFIRMATION",
            Enabled: true,
            IsDefault: true,
            Message: "",
            Note: "",
            Placeholder: "",
          },
          {
            ConfirmationType: "EMAIL",
            Enabled: true,
            IsDefault: false,
            Message: "email testing",
            Note: "email testing note",
            Placeholder: "email testing placeholder",
          },
          {
            ConfirmationType: "PRINT",
            Enabled: true,
            IsDefault: false,
            Message: "print testing",
            Note: "print testing note",
            Placeholder: "print testing placeholder",
          },
        ],
        ConfirmationReceiptOptionText: "Confirmation Receipt Option Text",
        CoverPageOptionText: "Cover Page Option Text",
        CustomerID: "",
        Email: "test@gmail.com",
        EnableConfirmationReceipt: true,
        EnableCoverPage: true,
        EnableInternationalFax: true,
        FaxProcessScreenTitle: "Fax Process Screen Title",
        FaxStatusChecking: true,
        Password: config.apiTestKey,
        IsActive: true,
        InternationalFaxButtonText: "test button",
        Tags: ["TEST"],
        ThirdPartySoftwareName: "Testing fax",
        ThirdPartySoftwareType: "FaxIntegration",
        TimeOutPerPage: 100,
        Username: "test",
        AdditionalAreaCodes: "201, 202, 203",
        FaxNote: "Fax Note For Faxing",
        FaxDestinationText: "Fax Option Text Destination",
        LocalFaxButtonText: "US",
      },
    },
  },
  updateFaxIntegration: {
    operationName: "UpdateFaxIntegration",
    query: `mutation UpdateFaxIntegration($customerId: ID!, $updateFaxIntegrationInput: FaxIntegrationInput) {
      updateFaxIntegration(customerId: $customerId, updateFaxIntegrationInput: $updateFaxIntegrationInput) {
        statusCode
        message
      }
    }`,
    variables: {
      customerId: "",
      updateFaxIntegrationInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "UpdatedFax",
        ThirdPartySoftwareType: "FaxIntegration",
        Email: "updated@example.com",
        ConfirmationOptions: [
          {
            ConfirmationType: "EMAIL",
            Enabled: true,
            IsDefault: true,
            Message: "Updated email confirmation",
          },
        ],
      },
    },
  },
  deleteFaxIntegration: {
    operationName: "DeleteFaxIntegration",
    query: `mutation DeleteFaxIntegration($customerId: ID!, $IsDeleted: Boolean) {
      deleteFaxIntegration(customerId: $customerId, IsDeleted: $IsDeleted) {
        message
        statusCode
      }
    }`,
    variables: {
      customerId: null,
      IsDeleted: null,
    },
  },
  updateFaxIntegrationStatus: {
    operationName: "updateFaxIntegrationStatus",
    query: `mutation updateFaxIntegrationStatus($customerId: ID!, $isActive: Boolean) {
      updateFaxIntegrationStatus(customerId: $customerId, IsActive: $isActive) {
        statusCode
        message
      }
    }`,
    variables: {
      customerId: null,
      isActive: null,
    },
  },
};
