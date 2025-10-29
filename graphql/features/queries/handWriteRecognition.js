module.exports = {
  getHandWriteRecognition: {
    operationName: "GetHandWriteRecognition",
    query: `query GetHandWriteRecognition($customerId: ID) {
            getHandWriteRecognition(customerId: $customerId) {
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
      customerId: "",
    },
  },
};
