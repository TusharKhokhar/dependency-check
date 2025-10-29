module.exports = {
    getProfiles: {
        query: `query Query($paginationInput: PaginationData) {
  getProfiles(paginationInput: $paginationInput) {
    profile {
      ProfileSetting {
        AutomaticPrintDelivery
        Description
        PrintConfigurationGroup {
          CustomerID
          DeviceID
        }
      }
      ProfileType
      Description
        }
        total
        }
    }`, variables: {
            "paginationInput": {
                "pageNumber": 1,
                "limit": 10
            }
        },
    },
    getProfile: {
        query: `query GetProfile($profileId: ID, $customerId: ID) {
  getProfile(profileId: $profileId, customerId: $customerId) {
    ProfileSetting {
      AutomaticPrintDelivery
      Description
      DisableConfirmation
      PromptForPrinter
      PrintConfigurationGroup {
        GroupName
        GroupType
        PrinterGroups
          }
        }
      }
    }`,
        variables: {
            "customerId": "6231ce19932e27000985ba60",
            "profileId": "664c9b3ed6006ce0157f7a30"
        }
    }
}