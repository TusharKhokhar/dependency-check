module.exports = {
  updateGroupMutation: {
    operationName: "UpdateGroup",
    query: `mutation UpdateGroup($groupId: ID!, $updateGroupInput: GroupInput) {
      updateGroup(groupId: $groupId, updateGroupInput: $updateGroupInput) {
        message
        statusCode
      }
    }`,
    variables: {
        "groupId": "",
        "updateGroupInput": {
            "PrintConfig": {
                "ComputerName": true,
                "Cost": true,
                "Email": true,
                "GuestName": true,
                "MaskFileNames": null,
                "ReleaseCode": true,
                "Username": true
            },
            "PrintConfigurationGroupID": null,
            "DeviceID": "",
            "Tags": [],
            "GroupName": "Print configuration",
            "PrintReview": true,
            "ModifyPrintJob": true,
            "PrinterGroups": true,
            "IsActive": true,
            "PrintGroups": [
                {
                    "Enabled": true,
                    "PrinterGroupName": "DH1",
                    "DeviceId": "",
                    "_id": null
                }
            ],
            "GroupType": "Print Configuration",
            "CustomerID": "",
            "AssociatedQuotaBalance": []
        }
    },
  },
  addEasyBookingGroup: {
    operationName: "AddGroup",
    query: `mutation AddGroup($addGroupInput: GroupInput) {
      addGroup(addGroupInput: $addGroupInput) {
        _id
        GroupType
        GroupName
        Description
        Priority
        Enabled
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
        Policies {
          MaxSessionsPerday
          MaxNumberSessionsPerWeek
          MaxTimePerDay
          MaxTimePerWeek
          FutureDaysAdvance
          MaxOutstandingBookings
          MaxOutstandingTime
        }
      }
    }`,
    variables: {
      "addGroupInput": {
        "Tags": [
          "test 2"
        ],
        "Priority": 1,
        "Description": "this is for testing",
        "EasyBooking": {
          "EnableSessionSettings": true,
          "EasyBookingGroups": [
            {
              "IsActive": true,
              "EasyBookingGroupName": "Testing EasyBooking Group",
              "Conditions": [
                {
                  "Value": ["test"],
                  "SingleMatch": false,
                  "Field": "test",
                  "Condition": "equal"
                },
              ]
            }
          ]
        },
        "IsDeleted": false,
        "IsActive": true,
        "GroupType": "EasyBooking",
        "Label": "Testing EasyBooking",
        "GroupName": "EasyBooking Testing",
        "Enabled": true,
        "CustomerID": "",
        "Policies": {
          "MaxTimePerWeek": 2,
          "MaxTimePerDay": 1,
          "MaxSessionsPerday": 1,
          "MaxOutstandingTime": 2,
          "MaxOutstandingBookings": 2,
          "MaxNumberSessionsPerWeek": 1,
          "FutureDaysAdvance": 1
        }
      }
    },
  },
  updateEasyBookingGroup: {
    operationName: "UpdateGroup",
    query: `mutation UpdateGroup($groupId: ID!, $updateGroupInput: GroupInput) {
      updateGroup(groupId: $groupId, updateGroupInput: $updateGroupInput) {
        message
        statusCode
      }
    }`,
    variables: {
      updateGroupInput: {
        Tags: ["updated tag"],
        Priority: 2,
        Description: "updated EasyBooking group for testing",
        EasyBooking: {
          EnableSessionSettings: false,
          EasyBookingGroups: [
            {
              IsActive: true,
              EasyBookingGroupName: "Updated EasyBooking Group",
              Conditions: [
                {
                  Value: ["updated-test"],
                  SingleMatch: true,
                  Field: "Age",
                  Condition: "greater_than"
                }
              ]
            }
          ]
        },
        IsDeleted: false,
        IsActive: true,
        GroupType: "EasyBooking",
        Label: "Updated EasyBooking Label",
        GroupName: "Updated EasyBooking Testing",
        Enabled: true,
        CustomerID: ""
      },
      groupId: ""
    },
  },
  addPermissionGroupWithEasyBookingID: {
    operationName: "AddGroup",
    query: `mutation AddGroup($addGroupInput: GroupInput) {
      addGroup(addGroupInput: $addGroupInput) {
        _id
        GroupType
        GroupName
        EasyBookingGroupID
        IsActive
        Enabled
        CustomerID
      }
    }`,
    variables: {
      "addGroupInput": {
        "GroupType": "Permissions",
        "GroupName": "Permission Group with EasyBooking",
        "Label": "Testing Permission with EasyBooking",
        "Enabled": true,
        "IsActive": true,
        "CustomerID": "",
        "EasyBookingGroupID": ""
      }
    }
  },
  updatePermissionGroupWithEasyBookingID: {
    operationName: "UpdateGroup",
    query: `mutation UpdateGroup($groupId: ID!, $updateGroupInput: GroupInput) {
      updateGroup(groupId: $groupId, updateGroupInput: $updateGroupInput) {
        message
        statusCode
      }
    }`,
    variables: {
      "groupId": "",
      "updateGroupInput": {
        "GroupType": "Permissions",
        "GroupName": "Updated Permission Group",
        "EasyBookingGroupID": "",
        "CustomerID": ""
      }
    }
  },
  updateEasyBookingGroupPriorities: {
    operationName: "UpdateEasyBookingGroupPriorities",
    query: `mutation UpdateEasyBookingGroupPriorities($groupIds: [ID!]!, $customerId: ID!) {
      updateEasyBookingGroupPriorities(groupIds: $groupIds, customerId: $customerId) {
        message
        statusCode
      }
    }`,
    variables: {
      "groupIds": [],
      "customerId": ""
    },
  },
  deleteGroup: {
    operationName: "GroupDeleted",
    query: `mutation GroupDeleted($IsDeleted: Boolean, $groupId: ID, $customerId: ID) {
      groupDeleted(IsDeleted: $IsDeleted, groupId: $groupId, customerId: $customerId) {
        message
        statusCode
      }
    }`,
    variables: {
      "IsDeleted": true,
      "groupId": "",
      "customerId": ""
    },
  },
};
