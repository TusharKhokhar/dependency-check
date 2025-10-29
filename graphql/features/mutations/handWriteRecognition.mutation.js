module.exports = {
  addHandWriteRecognition: {
    operationName: "AddHandWriteRecognition",
    query: `mutation AddHandWriteRecognition($addHandWriteRecognitionInput: HandWriteRecognitionInput) {
            addHandWriteRecognition(addHandWriteRecognitionInput: $addHandWriteRecognitionInput) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                AttachOriginalDocument
                ConfidenceThreshold
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      addHandWriteRecognitionInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "HandWrite Recognition",
        ThirdPartySoftwareType: "Handwriting Recognition",
        Tags: ["test"],
        AttachOriginalDocument: true,
        ConfidenceThreshold: 55,
        IsActive: true,
      },
    },
  },
  updateHandWriteRecognition: {
    operationName: "UpdateHandWriteRecognition",
    query: `mutation UpdateHandWriteRecognition($customerId: ID!, $updateHandWriteRecognitionInput: HandWriteRecognitionInput) {
            updateHandWriteRecognition(customerId: $customerId, updateHandWriteRecognitionInput: $updateHandWriteRecognitionInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateHandWriteRecognitionInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "HandWrite Recognition",
        ThirdPartySoftwareType: "Handwriting Recognition",
        Tags: ["test", "111"],
        AttachOriginalDocument: true,
        ConfidenceThreshold: 55,
        IsActive: true,
      },
    },
  },
  updateHandWriteRecognitionStatus: {
    operationName: "UpdateHandWriteRecognitionStatus",
    query: `mutation UpdateHandWriteRecognitionStatus($customerId: ID, $isActive: Boolean) {
            updateHandWriteRecognitionStatus(customerId: $customerId, IsActive: $isActive) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
  deleteHandWriteRecognition: {
    operationName: "DeleteHandWriteRecognition",
    query: `mutation DeleteHandWriteRecognition($isDeleted: Boolean, $customerId: ID) {
            deleteHandWriteRecognition(IsDeleted: $isDeleted, customerId: $customerId) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      isDeleted: true,
    },
  },
};
