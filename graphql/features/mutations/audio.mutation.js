module.exports = {
  addAudio: {
    operationName: "AddAudio",
    query: `mutation AddAudio($addAudioInput: AudioInput) {
            addAudio(addAudioInput: $addAudioInput) {
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
      addAudioInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "Testing audio",
        ThirdPartySoftwareType: "AudioIntegration",
        Tags: ["test"],
        AudioService: ["GOOGLE", "MICROSOFT"],
        MicrosoftAudioVersion: "v1",
        AttachDocument: true,
        IsActive: true,
        IsCheckAll: false,
        Languages: [
          {
            Code: "af",
            Language: "Afrikaans",
          },
        ],
      },
    },
  },
  updateAudio: {
    operationName: "UpdateAudio",
    query: `mutation UpdateAudio($customerId: ID!, $updateAudioInput: AudioInput) {
            updateAudio(customerId: $customerId, updateAudioInput: $updateAudioInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateAudioInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "Testing audio",
        ThirdPartySoftwareType: "AudioIntegration",
        Tags: ["test"],
        AudioService: ["GOOGLE", "MICROSOFT"],
        MicrosoftAudioVersion: "v1",
        AttachDocument: true,
        IsActive: true,
        IsCheckAll: false,
        Languages: [
          {
            Code: "af",
            Language: "Afrikaans",
          },
        ],
      },
    },
  },
  updateAudioStatus: {
    operationName: "UpdateAudioStatus",
    query: `mutation UpdateAudioStatus($customerId: ID!, $isActive: Boolean) {
            updateAudioStatus(customerId: $customerId, IsActive: $isActive) {
                message
            }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
  deleteAudio: {
    operationName: "DeleteAudio",
    query: `mutation DeleteAudio($customerId: ID!, $isDeleted: Boolean) {
            deleteAudio(customerId: $customerId, IsDeleted: $isDeleted) {
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
