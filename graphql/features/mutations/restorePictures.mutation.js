module.exports = {
  addRestorePictures: {
    operationName: "AddRestorePictures",
    query: `mutation AddRestorePictures($addRestorePicturesInput: RestorePicturesInput) {
            addRestorePictures(addRestorePicturesInput: $addRestorePicturesInput) {
                _id
                CustomerID
                CustomerName
                ThirdPartySoftwareName
                ThirdPartySoftwareType
                Tags
                RestoreExePath
                IsActive
                CreatedBy
                IsDeleted
            }
        }`,
    variables: {
      addRestorePicturesInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "Testing RestorePictures",
        ThirdPartySoftwareType: "RestorePicturesIntegration",
        Tags: ["test"],
        RestoreExePath: "/Users/air/Downloads/test.html",
        IsActive: true,
      },
    },
  },
  updateRestorePictures: {
    operationName: "UpdateRestorePictures",
    query: `mutation UpdateRestorePictures($customerId: ID!, $updateRestorePicturesInput: RestorePicturesInput) {
            updateRestorePictures(customerId: $customerId, updateRestorePicturesInput: $updateRestorePicturesInput) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      updateRestorePicturesInput: {
        CustomerID: "",
        ThirdPartySoftwareName: "Testing RestorePictures",
        ThirdPartySoftwareType: "RestorePicturesIntegration",
        Tags: ["test", "111"],
        RestoreExePath: "/Users/air/Downloads/test.html",
        IsActive: true,
      },
    },
  },
  updateRestorePicturesStatus: {
    operationName: "UpdateRestorePicturesStatus",
    query: `mutation UpdateRestorePicturesStatus($isActive: Boolean, $customerId: ID!) {
            updateRestorePicturesStatus(IsActive: $isActive, customerId: $customerId) {
                message
                statusCode
            }
        }`,
    variables: {
      customerId: "",
      IsDeleted: true,
    },
  },
  deleteRestorePictures: {
    operationName: "DeleteRestorePictures",
    query: `mutation DeleteRestorePictures($isDeleted: Boolean, $customerId: ID!) {
            deleteRestorePictures(IsDeleted: $isDeleted, customerId: $customerId) {
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
