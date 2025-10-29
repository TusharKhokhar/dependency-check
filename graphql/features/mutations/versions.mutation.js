module.exports = {
    addVersion: {
      operationName: "AddVersion",
      query: `mutation AddVersion($addVersionInput: VersionInput) {
          addVersion(addVersionInput: $addVersionInput) {
            _id
            CustomerID
            VersionNumber
            ReleaseDate
            Enabled
            Disabled
            Release
            Package
            ThingType
            VersionDescription
            Tags
            IsDeleted
            CreatedAt
            UpdatedAt
            IsActive
          }
        }`,
      variables: {
        "addVersionInput": {
          "ReleaseDate": null,
          "ThingType": "driver macos",
          "VersionDescription": "Testing",
          "Package": "dev.zip",
          "VersionNumber": "",
          "Release": null,
          "Tags": [
            "Testing"
          ],
          "CustomerID": "",
        }
      },
    }
  };
  