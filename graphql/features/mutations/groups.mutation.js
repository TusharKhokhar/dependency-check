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

};
