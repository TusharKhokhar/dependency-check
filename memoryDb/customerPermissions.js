const {getDb} = require("../publicAuth/config/db");
const collectionName = 'CustomPermissions'
const {getObjectId:ObjectId} = require('../publicAuth/helpers/objectIdConvertion')

const customPermissionData = [/* 1 createdAt:2024-05-16T15:23:26.000Z*/
    /* 1 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80f"),
        "PermissionName" : "Delete_Customer",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d15753084095f542828b04"),
        "Enum" : 48,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 2 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b808"),
        "PermissionName" : "Delete_Role",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b3"),
        "Enum" : 41,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 3 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ad"),
        "PermissionName" : "Devices",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 29,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 31,
        "IsUserPortal" : false
    },

    /* 4 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80e"),
        "PermissionName" : "Delete_Location",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d82eb2ae36eea807ccf6a6"),
        "Enum" : 47,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 5 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c6"),
        "PermissionName" : "Update_Joblist",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b2"),
        "Enum" : 4,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 6 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c0"),
        "PermissionName" : "Add_Device",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ad"),
        "Enum" : 10,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 7 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c3"),
        "PermissionName" : "Update_Languages",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b0"),
        "Enum" : 7,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 8 createdAt:2023-04-12T18:59:36.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6436ff986f39b48ebd3687bb"),
        "PermissionName" : "Update_Identity_Provider",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("6436ff296f39b48ebd3687ba"),
        "Enum" : 58,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 9 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c2"),
        "PermissionName" : "Update_Text",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6af"),
        "Enum" : 8,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 10 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b4"),
        "PermissionName" : "License",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 22,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 80,
        "IsUserPortal" : false
    },

    /* 11 createdAt:2023-01-18T13:07:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63c7ef222f6c64b583705137"),
        "PermissionName" : "Add_Payment",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63c7ee5b2f6c64b583705135"),
        "Enum" : 51,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 12 createdAt:2023-04-12T18:57:45.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6436ff296f39b48ebd3687ba"),
        "PermissionName" : "Identity_Provider",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 57,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 38,
        "IsUserPortal" : false
    },

    /* 13 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b3"),
        "PermissionName" : "Roles",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 23,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 33,
        "IsUserPortal" : false
    },

    /* 14 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ae"),
        "PermissionName" : "Landing_Page",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 28,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1000,
        "IsUserPortal" : false
    },

    /* 15 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b2"),
        "PermissionName" : "Joblist_Settings",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 24,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 40,
        "IsUserPortal" : false
    },

    /* 16 createdAt:2023-01-27T06:48:50.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d373d22f6c64b58370513e"),
        "PermissionName" : "Update Profile",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63d373882f6c64b58370513d"),
        "Enum" : 55,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 17 createdAt:2023-04-13T14:52:55.000Z*/
    {
        "_id" : ObjectId.createFromHexString("643817476f39b48ebd3687bd"),
        "PermissionName" : "Delete_Identity_Provider",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("6436ff296f39b48ebd3687ba"),
        "Enum" : 60,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 18 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b0"),
        "PermissionName" : "Languages",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 26,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "Order" : 53,
        "IsUserPortal" : false
    },

    /* 19 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80c"),
        "PermissionName" : "Delete_Group",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6aa"),
        "Enum" : 45,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 20 createdAt:2022-07-15T12:02:27.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d15753084095f542828b04"),
        "PermissionName" : "Customers",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 39,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 10,
        "IsUserPortal" : false
    },

    /* 21 createdAt:2023-01-27T06:47:36.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d373882f6c64b58370513d"),
        "PermissionName" : "Profiles",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 53,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 45,
        "IsUserPortal" : false
    },

    /* 22 createdAt:2023-01-27T06:50:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d374352f6c64b583705140"),
        "PermissionName" : "Delete_Profile",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63d373882f6c64b58370513d"),
        "Enum" : 56,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 23 createdAt:2023-04-12T19:01:36.000Z*/
    {
        "_id" : ObjectId.createFromHexString("643700106f39b48ebd3687bc"),
        "PermissionName" : "Add_Identity_Provider",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("6436ff296f39b48ebd3687ba"),
        "Enum" : 59,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 24 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80a"),
        "PermissionName" : "Delete_Device",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ad"),
        "Enum" : 43,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 25 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6ba"),
        "PermissionName" : "Printer_Summary",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ab"),
        "Enum" : 16,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false,
        "Order" : 2
    },

    /* 26 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6be"),
        "PermissionName" : "Add_Thing",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ac"),
        "Enum" : 12,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 27 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6bc"),
        "PermissionName" : "Export_Usage",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ab"),
        "Enum" : 14,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false,
        "Order" : 3
    },

    /* 28 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c8"),
        "PermissionName" : "Add_Role",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b3"),
        "Enum" : 2,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 29 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6b6"),
        "PermissionName" : "Add_User",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "Enum" : 20,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 30 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ac"),
        "PermissionName" : "Things",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 30,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 30,
        "IsUserPortal" : false
    },

    /* 31 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c5"),
        "PermissionName" : "Update_Partner_Logo",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b1"),
        "Enum" : 5,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 32 createdAt:2023-01-18T13:04:27.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63c7ee5b2f6c64b583705135"),
        "PermissionName" : "Payment_Gateway",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 49,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 37,
        "IsUserPortal" : false
    },

    /* 33 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c9"),
        "PermissionName" : "Update_License",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b4"),
        "Enum" : 1,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 34 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c7"),
        "PermissionName" : "Update_Role",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b3"),
        "Enum" : 3,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 35 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c4"),
        "PermissionName" : "Update_Upload_Page",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b1"),
        "Enum" : 6,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 36 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6b8"),
        "PermissionName" : "Add_Group",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6aa"),
        "Enum" : 18,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 37 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6af"),
        "PermissionName" : "Text",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 27,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 51,
        "IsUserPortal" : false
    },

    /* 38 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6aa"),
        "PermissionName" : "Groups",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 32,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 25,
        "IsUserPortal" : false
    },

    /* 39 createdAt:2022-07-15T12:03:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d15791084095f542828b05"),
        "PermissionName" : "Add_Customer",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d15753084095f542828b04"),
        "Enum" : 38,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 40 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6b9"),
        "PermissionName" : "Executive_Summary",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ab"),
        "Enum" : 17,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false,
        "Order" : 1
    },

    /* 41 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b1"),
        "PermissionName" : "Upload_Page",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 25,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 35,
        "IsUserPortal" : false
    },

    /* 42 createdAt:2022-07-20T16:37:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d82f35ae36eea807ccf6a7"),
        "PermissionName" : "Update_Location",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d82eb2ae36eea807ccf6a6"),
        "Enum" : 35,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 43 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ab"),
        "PermissionName" : "Usage",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 31,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 5,
        "IsUserPortal" : false
    },

    /* 44 createdAt:2023-01-18T13:08:10.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63c7ef3a2f6c64b583705138"),
        "PermissionName" : "Edit_Payment",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63c7ee5b2f6c64b583705135"),
        "Enum" : 52,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 45 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80b"),
        "PermissionName" : "Delete_Thing",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ac"),
        "Enum" : 44,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 46 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6c1"),
        "PermissionName" : "Update_Landing_Page",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ae"),
        "Enum" : 9,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 47 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6bf"),
        "PermissionName" : "Update_Device",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ad"),
        "Enum" : 11,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 48 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6bd"),
        "PermissionName" : "Update_Thing",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6ac"),
        "Enum" : 13,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 49 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6b5"),
        "PermissionName" : "Update_User",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "Enum" : 21,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 50 createdAt:2022-07-15T12:03:34.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d15796084095f542828b06"),
        "PermissionName" : "Update_Customer",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d15753084095f542828b04"),
        "Enum" : 37,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 51 createdAt:2022-07-20T16:41:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "PermissionName" : "Users",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 33,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 20,
        "IsUserPortal" : false
    },

    /* 52 createdAt:2023-01-27T06:50:01.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d374192f6c64b58370513f"),
        "PermissionName" : "Add_Profile",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63d373882f6c64b58370513d"),
        "Enum" : 54,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 53 createdAt:2022-07-20T16:37:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d82f35ae36eea807ccf6a8"),
        "PermissionName" : "Add_Location",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d82eb2ae36eea807ccf6a6"),
        "Enum" : 34,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 54 createdAt:2022-07-20T16:34:58.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d82eb2ae36eea807ccf6a6"),
        "PermissionName" : "Locations",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 36,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 15,
        "IsUserPortal" : false
    },

    /* 55 createdAt:2022-07-20T16:55:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62d8336dae36eea807ccf6b7"),
        "PermissionName" : "Update_Group",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6aa"),
        "Enum" : 19,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 56 createdAt:2022-09-28T11:05:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63342a7a15af888af8d1b80d"),
        "PermissionName" : "Delete_User",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "Enum" : 46,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 57 createdAt:2023-01-18T13:05:35.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63c7ee9f2f6c64b583705136"),
        "PermissionName" : "Delete_Payment",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("63c7ee5b2f6c64b583705135"),
        "Enum" : 50,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 58 createdAt:2023-08-10T16:09:08.000Z*/
    {
        "_id" : ObjectId.createFromHexString("64d50ba4bf538fcb3741d20b"),
        "PermissionName" : "Software_Update",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 61,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "Order" : 50,
        "IsUserPortal" : false
    },

    /* 59 createdAt:2023-08-10T16:09:53.000Z*/
    {
        "_id" : ObjectId.createFromHexString("64d50bd1bf538fcb3741d20c"),
        "PermissionName" : "Add_Software_Update",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("64d50ba4bf538fcb3741d20b"),
        "Enum" : 62,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 60 createdAt:2023-08-10T16:10:06.000Z*/
    {
        "_id" : ObjectId.createFromHexString("64d50bdebf538fcb3741d20d"),
        "PermissionName" : "Update_Software_Update",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("64d50ba4bf538fcb3741d20b"),
        "Enum" : 63,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 61 createdAt:2023-08-10T16:10:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("64d50bf5bf538fcb3741d20e"),
        "PermissionName" : "Delete_Software_Update",
        "CustomerLevel" : false,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("64d50ba4bf538fcb3741d20b"),
        "Enum" : 64,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 62 createdAt:2023-09-20T17:24:17.000Z*/
    {
        "_id" : ObjectId.createFromHexString("650b2ac15654c031937f4427"),
        "PermissionName" : "Staff_Release",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 65,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 63 createdAt:2023-09-20T17:24:57.000Z*/
    {
        "_id" : ObjectId.createFromHexString("650b2ae95654c031937f4428"),
        "PermissionName" : "Print_Release",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("650b2ac15654c031937f4427"),
        "Enum" : 66,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 64 createdAt:2023-09-20T17:25:26.000Z*/
    {
        "_id" : ObjectId.createFromHexString("650b2b065654c031937f4429"),
        "PermissionName" : "Re-Print",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("650b2ac15654c031937f4427"),
        "Enum" : 67,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 65 createdAt:2024-01-16T15:57:32.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65a6a76ce472a2a313d7fabd"),
        "PermissionName" : "Terms_of_use",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6af"),
        "Enum" : 68,
        "Order" : 55,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 66 createdAt:2024-01-19T09:04:31.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65aa3b1fe472a2a313d7fabf"),
        "PermissionName" : "Mobile_Configuration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 69,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 52,
        "IsUserPortal" : false
    },

    /* 67 createdAt:2024-01-19T09:05:15.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65aa3b4be472a2a313d7fac1"),
        "PermissionName" : "Edit_Mobile_Configuration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("65aa3b1fe472a2a313d7fabf"),
        "Enum" : 71,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 68 createdAt:2024-02-15T04:42:28.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65cd9634bfae1adbfdc8a637"),
        "PermissionName" : "Reset_Quota_Balance",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6aa"),
        "Enum" : 75,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 69 createdAt:2024-05-16T15:23:13.000Z*/
    {
        "_id" : ObjectId.createFromHexString("664624e12f7feb818fa7f986"),
        "PermissionName" : "Update_Quota_Balance",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "Enum" : 76,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 70 createdAt:2024-05-16T15:23:26.000Z*/
    {
        "_id" : ObjectId.createFromHexString("664624ee2f7feb818fa7f987"),
        "PermissionName" : "Update_Debit_Balance",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6a9"),
        "Enum" : 77,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 71 createdAt:2025-03-10T14:15:00.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9e"),
        "PermissionName" : "Proton_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 81,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 60,
        "IsUserPortal" : false
    },

    /* 72 createdAt:2025-03-10T14:15:00.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9b"),
        "PermissionName" : "Update_Proton",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9e"),
        "Enum" : 78,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 73 createdAt:2025-03-10T14:15:00.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9d"),
        "PermissionName" : "Delete_Proton",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9e"),
        "Enum" : 80,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 74 createdAt:2025-03-10T14:15:00.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9c"),
        "PermissionName" : "Add_Proton",
        "CustomerLevel" : true,
        "Order" : 2,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9e"),
        "Enum" : 79,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 75 createdAt:2025-03-11T04:14:23.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cfb89f7988f3cf81ca9ea0"),
        "PermissionName" : "Read_Proton",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cef3e47988f3cf81ca9e9e"),
        "Enum" : 82,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 76 createdAt:2025-03-11T06:17:09.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cfd5659de02f83f9f27914"),
        "PermissionName" : "Account_Sync_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 83,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 65,
        "IsUserPortal" : false
    },

    /* 77 createdAt:2025-03-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cfd5e49de02f83f9f27915"),
        "PermissionName" : "Add_Account_Sync",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cfd5659de02f83f9f27914"),
        "Enum" : 84,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 78 createdAt:2025-03-11T06:20:43.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cfd63b9de02f83f9f27916"),
        "PermissionName" : "Update_Account_Sync",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cfd5659de02f83f9f27914"),
        "Enum" : 85,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 79 createdAt:2025-03-11T06:21:23.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67cfd6639de02f83f9f27917"),
        "PermissionName" : "Delete_Account_Sync",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cfd5659de02f83f9f27914"),
        "Enum" : 86,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 80 createdAt:2025-03-11T10:27:12.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d010009de02f83f9f2791f"),
        "PermissionName" : "Read_Account_Sync",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67cfd5659de02f83f9f27914"),
        "Enum" : 87,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 81 createdAt:2025-03-12T10:33:36.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d163001236181b3d90be39"),
        "PermissionName" : "Accounts",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 88,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 70,
        "IsUserPortal" : false
    },

    /* 82 createdAt:2025-03-12T10:34:48.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d163481236181b3d90be3a"),
        "PermissionName" : "Add_Account",
        "CustomerLevel" : true,
        "Order" : 2,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67d163001236181b3d90be39"),
        "Enum" : 89,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 83 createdAt:2025-03-12T10:35:14.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d163621236181b3d90be3b"),
        "PermissionName" : "Update_Account",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67d163001236181b3d90be39"),
        "Enum" : 90,
        "Order" : 3,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 84 createdAt:2025-03-12T10:35:36.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d163781236181b3d90be3c"),
        "PermissionName" : "Delete_Account",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67d163001236181b3d90be39"),
        "Enum" : 91,
        "Order" : 4,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 85 createdAt:2025-03-12T10:35:47.000Z*/
    {
        "_id" : ObjectId.createFromHexString("67d163831236181b3d90be3d"),
        "PermissionName" : "Read_Account",
        "Order" : 1,
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("67d163001236181b3d90be39"),
        "Enum" : 92,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 86 createdAt:2025-08-08T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68957cbdc8f6546c0479008d"),
        "PermissionName" : "Handwrite_Recognition_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 97,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 75,
        "IsUserPortal" : false
    },

    /* 87 createdAt:2025-08-08T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6895808bc8f6546c0479008f"),
        "PermissionName" : "Add_Handwrite_Recognition",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68957cbdc8f6546c0479008d"),
        "Enum" : 98,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 88 createdAt:2025-08-08T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68958109c8f6546c04790090"),
        "PermissionName" : "Update_Handwrite_Recognition",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68957cbdc8f6546c0479008d"),
        "Enum" : 99,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 89 createdAt:2025-08-08T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68958154c8f6546c04790091"),
        "PermissionName" : "Delete_Handwrite_Recognition",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68957cbdc8f6546c0479008d"),
        "Enum" : 100,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 90 createdAt:2025-08-08T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6895818ec8f6546c04790092"),
        "PermissionName" : "Read_Handwrite_Recognition",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68957cbdc8f6546c0479008d"),
        "Enum" : 101,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 91 createdAt:2025-08-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689992fdc8f6546c0479009e"),
        "PermissionName" : "Restore_Pictures",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 102,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 80,
        "IsUserPortal" : false
    },

    /* 92 createdAt:2025-08-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68999348c8f6546c0479009f"),
        "PermissionName" : "Add_Restore_Pictures",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689992fdc8f6546c0479009e"),
        "Enum" : 103,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 93 createdAt:2025-08-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68999387c8f6546c047900a0"),
        "PermissionName" : "Update_Restore_Pictures",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689992fdc8f6546c0479009e"),
        "Enum" : 104,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 94 createdAt:2025-08-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689993bac8f6546c047900a1"),
        "PermissionName" : "Delete_Restore_Pictures",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689992fdc8f6546c0479009e"),
        "Enum" : 105,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 95 createdAt:2025-08-11T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689993ddc8f6546c047900a2"),
        "PermissionName" : "Read_Restore_Pictures",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689992fdc8f6546c0479009e"),
        "Enum" : 106,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 96 createdAt:2025-08-13T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689c25e6c8f6546c047900c6"),
        "PermissionName" : "Illiad",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 107,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 85,
        "IsUserPortal" : false
    },

    /* 97 createdAt:2025-08-13T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689c2612c8f6546c047900c7"),
        "PermissionName" : "Add_Illiad",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689c25e6c8f6546c047900c6"),
        "Enum" : 108,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 98 createdAt:2025-08-13T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689c2645c8f6546c047900c8"),
        "PermissionName" : "Update_Illiad",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689c25e6c8f6546c047900c6"),
        "Enum" : 109,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 99 createdAt:2025-08-13T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689c26adc8f6546c047900c9"),
        "PermissionName" : "Delete_Illiad",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689c25e6c8f6546c047900c6"),
        "Enum" : 110,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 100 createdAt:2025-08-13T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689c26e6c8f6546c047900ca"),
        "PermissionName" : "Read_Illiad",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689c25e6c8f6546c047900c6"),
        "Enum" : 111,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("6893915ae8b7a13e37e6090b"),
	"PermissionName" : "Email_Integration",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"Enum" : 93,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 62,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689c6103ce4609958a997bea"),
	"PermissionName" : "Add_Email",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("6893915ae8b7a13e37e6090b"),
	"Enum" : 112,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 2,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689391b7e8b7a13e37e6090d"),
	"PermissionName" : "Update_Email",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("6893915ae8b7a13e37e6090b"),
	"Enum" : 95,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 1,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689391a4e8b7a13e37e6090c"),
	"PermissionName" : "Read_Email",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("6893915ae8b7a13e37e6090b"),
	"Enum" : 94,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 1,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689391c3e8b7a13e37e6090e"),
	"PermissionName" : "Delete_Email",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("6893915ae8b7a13e37e6090b"),
	"Enum" : 96,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 1,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689df082ce4609958a997beb"),
	"PermissionName" : "SmartphoneIntegration",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"Enum" : 118,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 95,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689df0e1ce4609958a997bec"),
	"PermissionName" : "Read_Smartphone",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("689df082ce4609958a997beb"),
	"Enum" : 119,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 1,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689df0e1ce4609958a997bed"),
	"PermissionName" : "Delete_Smartphone",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("689df082ce4609958a997beb"),
	"Enum" : 120,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 4,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689df0e1ce4609958a997bee"),
	"PermissionName" : "Update_Smartphone",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("689df082ce4609958a997beb"),
	"Enum" : 121,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 3,
	"IsUserPortal" : false
    },

    {
	"_id" : ObjectId.createFromHexString("689df0e1ce4609958a997bef"),
	"PermissionName" : "Add_Smartphone",
	"CustomerLevel" : true,
	"ProductLevel" : [ "ePRINTit" ],
	"ParentPermissionID" : ObjectId.createFromHexString("689df082ce4609958a997beb"),
	"Enum" : 122,
	"IsDeleted" : false,
	"PartnerLevel" : true,
	"Order" : 2,
	"IsUserPortal" : false
    },

    /* 101 createdAt:2025-08-14T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689db9c9c8f6546c047900ec"),
        "PermissionName" : "FTP",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 113,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 90,
        "IsUserPortal" : false
    },

    /* 102 createdAt:2025-08-14T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689dba10c8f6546c047900ed"),
        "PermissionName" : "Add_FTP",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689db9c9c8f6546c047900ec"),
        "Enum" : 114,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 103 createdAt:2025-08-14T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689dba57c8f6546c047900ee"),
        "PermissionName" : "Update_FTP",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689db9c9c8f6546c047900ec"),
        "Enum" : 115,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 104 createdAt:2025-08-14T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689dbafec8f6546c047900ef"),
        "PermissionName" : "Delete_FTP",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689db9c9c8f6546c047900ec"),
        "Enum" : 116,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 105 createdAt:2025-08-14T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("689dbb2bc8f6546c047900f0"),
        "PermissionName" : "Read_FTP",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("689db9c9c8f6546c047900ec"),
        "Enum" : 117,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 106 createdAt:2025-08-19T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a4431ceb6c839446d6924b"),
        "PermissionName" : "Abby",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 123,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 100,
        "IsUserPortal" : false
    },

    /* 107 createdAt:2025-08-19T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a44345eb6c839446d6924c"),
        "PermissionName" : "Add_Abby",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a4431ceb6c839446d6924b"),
        "Enum" : 124,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 108 createdAt:2025-08-19T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a44388eb6c839446d6924d"),
        "PermissionName" : "Update_Abby",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a4431ceb6c839446d6924b"),
        "Enum" : 125,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 109 createdAt:2025-08-19T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a443afeb6c839446d6924e"),
        "PermissionName" : "Delete_Abby",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a4431ceb6c839446d6924b"),
        "Enum" : 126,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 110 createdAt:2025-08-19T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a443e3eb6c839446d6924f"),
        "PermissionName" : "Read_Abby",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a4431ceb6c839446d6924b"),
        "Enum" : 127,
    },
    
    {
        "_id" : ObjectId.createFromHexString("68ac3017ce4609958a997bf0"),
        "PermissionName" : "NetworkIntegration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 138,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 111,
        "IsUserPortal" : false
    },

    {
        "_id" : ObjectId.createFromHexString("68ac30f6ce4609958a997bf2"),
        "PermissionName" : "Read_Network",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68ac3017ce4609958a997bf0"),
        "Enum" : 140,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    /* 111 createdAt:2025-08-20T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a5b4aa63fa42e999d548b1"),
        "PermissionName" : "Fax_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 128,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 105,
        "IsUserPortal" : false
    },

    /* 112 createdAt:2025-08-20T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a5b4dc63fa42e999d548b2"),
        "PermissionName" : "Add_Fax_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a5b4aa63fa42e999d548b1"),
        "Enum" : 129,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 113 createdAt:2025-08-20T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a5b51e63fa42e999d548b3"),
        "PermissionName" : "Update_Fax_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a5b4aa63fa42e999d548b1"),
        "Enum" : 130,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 114 createdAt:2025-08-20T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a5b55363fa42e999d548b4"),
        "PermissionName" : "Delete_Fax_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a5b4aa63fa42e999d548b1"),
        "Enum" : 131,
    },

    {
        "_id" : ObjectId.createFromHexString("68ac30f6ce4609958a997bf3"),
        "PermissionName" : "Delete_Network",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68ac3017ce4609958a997bf0"),
        "Enum" : 141,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 115 createdAt:2025-08-20T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a5b57963fa42e999d548b5"),
        "PermissionName" : "Read_Fax_Integration",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a5b4aa63fa42e999d548b1"),
        "Enum" : 132,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },
    {
        "_id" : ObjectId.createFromHexString("68ac30f6ce4609958a997bf4"),
        "PermissionName" : "Update_Network",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68ac3017ce4609958a997bf0"),
        "Enum" : 142,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    {
        "_id" : ObjectId.createFromHexString("68ac30f6ce4609958a997bf5"),
        "PermissionName" : "Add_Network",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68ac3017ce4609958a997bf0"),
        "Enum" : 143,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 116 createdAt:2025-08-22T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a85e30eb6c839446d69273"),
        "PermissionName" : "Audio",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "Enum" : 133,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 110,
        "IsUserPortal" : false
    },

    /* 117 createdAt:2025-08-22T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a85e59eb6c839446d69274"),
        "PermissionName" : "Add_Audio",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a85e30eb6c839446d69273"),
        "Enum" : 134,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 2,
        "IsUserPortal" : false
    },

    /* 118 createdAt:2025-08-22T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a85e83eb6c839446d69275"),
        "PermissionName" : "Update_Audio",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a85e30eb6c839446d69273"),
        "Enum" : 135,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 3,
        "IsUserPortal" : false
    },

    /* 119 createdAt:2025-08-22T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a85ea7eb6c839446d69276"),
        "PermissionName" : "Delete_Audio",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a85e30eb6c839446d69273"),
        "Enum" : 136,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 4,
        "IsUserPortal" : false
    },

    /* 120 createdAt:2025-08-22T06:19:16.000Z*/
    {
        "_id" : ObjectId.createFromHexString("68a85ecdeb6c839446d69277"),
        "PermissionName" : "Read_Audio",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("68a85e30eb6c839446d69273"),
        "Enum" : 137,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "Order" : 1,
        "IsUserPortal" : false
    },

    {
        "_id" : ObjectId.createFromHexString("68edea09e6efc2a13f97c542"),
        "PermissionName" : "Clone_Role",
        "CustomerLevel" : true,
        "ProductLevel" : [ "ePRINTit" ],
        "ParentPermissionID" : ObjectId.createFromHexString("62d83031ae36eea807ccf6b3"),
        "Enum" : 148,
        "Order" : 2,
        "IsDeleted" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },
]
module.exports = {
    addCustomPermission: async () => {
        const db = await getDb()
        return db.collection(collectionName).insertMany(customPermissionData)
    },
    deleteCustomPermission: async (permissionId) => {
        const db = await getDb();
        await db.collection(collectionName).deleteOne({ _id: ObjectId.createFromHexString(permissionId) });
    },
    getCustomPermission: async (permissionName) => {
      const db = await getDb();
      return db.collection(collectionName).findOne({ 
        PermissionName: permissionName,
        IsDeleted: false
      })
    }
}