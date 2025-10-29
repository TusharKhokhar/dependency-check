module.exports = {
  addAbby: {
    operationName: "AddAbby",
    query: `mutation AddAbby($addAbbyInput: AbbyInput) {
            addAbby(addAbbyInput: $addAbbyInput) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                FastObjectsExtraction
                FastBinarization
                PdfImageOnText
                FastMode
                DetectDocumentStructure
                AggressiveTextExtraction
                PromptForOriginalLanguage
                PdfMrcCompression
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
      addAbbyInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "testing abby",
        ThirdPartySoftwareType: "AbbyIntegration",
        Tags: ["test"],
        FastObjectsExtraction: true,
        FastBinarization: true,
        PdfImageOnText: true,
        FastMode: true,
        DetectDocumentStructure: true,
        AggressiveTextExtraction: true,
        PromptForOriginalLanguage: true,
        PdfMrcCompression: true,
        IsCheckAll: false,
        Languages: [
          {
            Code: "af",
            Language: "Afrikaans",
          },
        ],
        IsActive: true,
      },
    },
  },
  updateAbby: {
    operationName: "UpdateAbby",
    query: `mutation UpdateAbby($customerId: ID!, $updateAbbyInput: AbbyInput) {
            updateAbby(customerId: $customerId, updateAbbyInput: $updateAbbyInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateAbbyInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "testing abby",
        ThirdPartySoftwareType: "AbbyIntegration",
        Tags: ["test", "111"],
        FastObjectsExtraction: true,
        FastBinarization: true,
        PdfImageOnText: true,
        FastMode: true,
        DetectDocumentStructure: true,
        AggressiveTextExtraction: true,
        PromptForOriginalLanguage: true,
        PdfMrcCompression: true,
        IsCheckAll: false,
        Languages: [
          {
            Code: "af",
            Language: "Afrikaans",
          },
          {
            Code: "ar",
            Language: "Arabic",
          },
        ],
        IsActive: true,
      },
    },
  },
  updateAbbyStatus: {
    operationName: "UpdateAbbyStatus",
    query: `mutation UpdateAbbyStatus($customerId: ID!, $IsActive: Boolean) {
            updateAbbyStatus(customerId: $customerId, IsActive: $IsActive) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      IsActive: false,
    },
  },
  deleteAbby: {
    operationName: "DeleteAbby",
    query: `mutation DeleteAbby($customerId: ID!, $IsDeleted: Boolean) {
            deleteAbby(customerId: $customerId, IsDeleted: $IsDeleted) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
};
