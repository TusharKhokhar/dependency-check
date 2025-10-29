module.exports = {
  getEasyBookingGroup: {
    operationName: "GetGroup",
    query: `query GetGroup($groupId: ID, $customerId: ID) {
      getGroup(groupId: $groupId, customerId: $customerId) {
        _id
        Label
        GroupName
        DeviceID
        Description
        GroupType
        Tags
        Priority
        Enabled
        RoleType
        Policies {
          MaxSessionsPerday
          MaxNumberSessionsPerWeek
          MaxTimePerDay
          MaxTimePerWeek
          FutureDaysAdvance
          MaxOutstandingBookings
          MaxOutstandingTime
        }
        EasyBooking {
          EnableSessionSettings
          EasyBookingGroups {
            EasyBookingGroupName
            IsActive
            Conditions {
              Field
              Condition
              Value
              SingleMatch
            }
          }
        }
        RulesID
        UserID
        CustomerData {
          _id
          CustomerName
          DomainName
        }
        CustomerID
        PrintReview
        ModifyPrintJob
        PrinterGroups
        CreatedBy
        UpdatedBy
        DeletedAt
        IsDeleted
        DeletedBy
        IsActive
      }
    }`,
    variables: {
      "groupId": null,
      "customerId": null
    },
  },
  getGroupsWithFilter: {
    operationName: "GetGroups",
    query: `query GetGroups($paginationInput: PaginationData, $customerIds: [ID], $groupTypes: [String]) {
      getGroups(paginationInput: $paginationInput, customerIds: $customerIds, groupTypes: $groupTypes) {
        group {
          _id
          GroupName
          GroupType
          Priority
          IsActive
          IsDeleted
          EasyBooking {
            EnableSessionSettings
            EasyBookingGroups {
              EasyBookingGroupName
              IsActive
            }
          }
        }
        total
      }
    }`,
    variables: {
      "paginationInput": {
        "pageNumber": 1,
        "limit": 10,
        "sort": "asc",
        "sortKey": "GroupName"
      },
      "customerIds": [],
      "groupTypes": []
    },
  },
  getPermissionGroupWithEasyBookingID: {
    operationName: "GetGroup",
    query: `query GetGroup($groupId: ID, $customerId: ID) {
      getGroup(groupId: $groupId, customerId: $customerId) {
        _id
        Label
        GroupName
        GroupType
        EasyBookingGroupID
        Enabled
        IsActive
        CustomerID
        Description
      }
    }`,
    variables: {
      groupId: "",
      customerId: ""
    }
  }
};
