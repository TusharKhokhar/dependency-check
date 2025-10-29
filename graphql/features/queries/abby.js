module.exports = {
  getAbby: {
    operationName: "GetAbby",
    query: `query GetAbby($customerId: ID!) {
            getAbby(customerId: $customerId) {
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
                Languages {
                  Code
                  Language
                }
                IsCheckAll
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      customerId: "",
    },
  },
};
