module.exports = {
  getAudio: {
    operationName: "GetAudio",
    query: `query GetAudio($customerId: ID!) {
            getAudio(customerId: $customerId) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                AudioService
                MicrosoftAudioVersion
                AttachDocument
                IsActive
                CreatedBy
                IsDeleted
                IsCheckAll
          }
        }`,
    variables: {
      customerId: "",
    },
  },
};
