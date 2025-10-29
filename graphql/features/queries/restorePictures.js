module.exports = {
  getRestorePictures: {
    operationName: "GetRestorePictures",
    query: `query GetRestorePictures($customerId: ID!) {
            getRestorePictures(customerId: $customerId) {
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
      customerId: "",
    },
  },
};
