const {getDb} = require("../publicAuth/config/db");
const collectionName = 'Permissions'
const {getObjectId:ObjectId} = require('../publicAuth/helpers/objectIdConvertion')

const permissionData = [
    /* 1 createdAt:2024-01-19T08:57:37.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65aa3981e472a2a313d7fabe"),
        "PermissionName" : "Mobile_Configurations",
        "PermissionMenuID" : "config.settings.mobile-configuration",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : true,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 121,
        "IsUserPortal" : false
    },

    /* 2 createdAt:2024-01-16T15:55:11.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65a6a6dfe472a2a313d7fabc"),
        "PermissionName" : "Terms_of_Use",
        "PermissionMenuID" : "config.settings.terms-of-use",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : true,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 120,
        "IsUserPortal" : false
    },

    /* 3 createdAt:2023-12-18T09:40:17.000Z*/
    {
        "_id" : ObjectId.createFromHexString("65801381b8a9f2e313553e71"),
        "PermissionName" : "Audit_Logs",
        "PermissionMenuID" : "config.settings.audit-logs",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : true,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 119,
        "IsUserPortal" : false
    },

    /* 4 createdAt:2023-12-03T17:52:04.000Z*/
    {
        "_id" : ObjectId.createFromHexString("656cc0445654c031937f442f"),
        "PermissionName" : "Transaction_Report_Payment",
        "PermissionMenuID" : "reports.reports.kiosk-payment-transaction-reports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 5 createdAt:2023-11-20T14:17:21.000Z*/
    {
        "_id" : ObjectId.createFromHexString("655b6a715654c031937f442e"),
        "PermissionName" : "Add_Value_Reports",
        "PermissionMenuID" : "reports.reports.add-value-reports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 6 createdAt:2023-11-20T14:16:54.000Z*/
    {
        "_id" : ObjectId.createFromHexString("655b6a565654c031937f442d"),
        "PermissionName" : "Kiosk_Transaction_Reports",
        "PermissionMenuID" : "reports.reports.kiosk-reports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 7 createdAt:2023-11-03T14:17:01.000Z*/
    {
        "_id" : ObjectId.createFromHexString("654500dd5654c031937f442c"),
        "PermissionName" : "License_Report",
        "PermissionMenuID" : "reports.reports.license-reports",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 8 createdAt:2023-10-23T08:06:30.000Z*/
    {
        "_id" : ObjectId.createFromHexString("653629865654c031937f442a"),
        "PermissionName" : "Custom_Text",
        "PermissionMenuID" : "config.settings.custom-text",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : true,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 119,
        "IsUserPortal" : false
    },

    /* 9 createdAt:2023-08-09T15:34:10.000Z*/
    {
        "_id" : ObjectId.createFromHexString("64d3b1f2bf538fcb3741d20a"),
        "PermissionName" : "Software_Update",
        "PermissionMenuID" : "config.settings.softwareUpdate",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 119,
        "IsUserPortal" : false
    },

    /* 10 createdAt:2023-04-12T18:55:42.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6436feae6f39b48ebd3687b9"),
        "PermissionName" : "Identity_Provider",
        "PermissionMenuID" : "config.settings.identity-provider",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 113,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 11 createdAt:2023-03-15T16:46:48.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411f678cf348ecc54206179"),
        "PermissionName" : "Add_Value",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.addValue",
        "ProductLevel" : "ePRINTit",
        "Order" : 4600,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 12 createdAt:2023-03-15T16:34:12.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411f384cf348ecc54206177"),
        "PermissionName" : "Print_Release",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.printRelease",
        "ProductLevel" : "ePRINTit",
        "Order" : 4400,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 13 createdAt:2023-03-15T15:36:12.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411e5eccf348ecc54206176"),
        "PermissionName" : "Usage",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.usage",
        "ProductLevel" : "ePRINTit",
        "Order" : 4300,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 14 createdAt:2023-03-15T15:31:54.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411e4eacf348ecc54206175"),
        "PermissionName" : "Transactions",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.transactions",
        "ProductLevel" : "ePRINTit",
        "Order" : 4200,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 15 createdAt:2023-03-15T15:17:59.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411e1a7cf348ecc54206174"),
        "PermissionName" : "Prices",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.prices",
        "ProductLevel" : "ePRINTit",
        "Order" : 4100,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 16 createdAt:2023-03-15T14:54:12.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411dc14cf348ecc54206173"),
        "PermissionName" : "Details",
        "CustomerLevel" : true,
        "InnerParent" : true,
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionMenuID" : "userPortal.details",
        "ProductLevel" : "ePRINTit",
        "Order" : 4000,
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 17 createdAt:2023-03-15T14:45:55.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6411da23cf348ecc54206172"),
        "PermissionName" : "User_Portal",
        "CustomerLevel" : true,
        "ParentPermission" : true,
        "PermissionMenuID" : "userPortal",
        "ProductLevel" : "ePRINTit",
        "PartnerLevel" : true,
        "IsUserPortal" : true
    },

    /* 18 createdAt:2023-01-27T06:39:15.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d371932f6c64b58370513c"),
        "PermissionName" : "Profiles",
        "PermissionMenuID" : "config.settings.profiles",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 19 createdAt:2023-01-27T06:35:07.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "PermissionName" : "Settings",
        "PermissionMenuID" : "config.settings",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "InnerParent" : true,
        "PartnerLevel" : true,
        "Order" : 94,
        "IsUserPortal" : false
    },

    /* 20 createdAt:2023-01-18T12:57:45.000Z*/
    {
        "_id" : ObjectId.createFromHexString("63c7ecc92f6c64b583705134"),
        "PermissionName" : "Payment_List",
        "PermissionMenuID" : "config.payment.list",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6edf"),
        "InnerParent" : false,
        "Order" : 2005,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 21 createdAt:2022-10-22T06:49:48.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6353928c5b4b540e5663b231"),
        "PermissionName" : "Generate_API_Key",
        "PermissionMenuID" : "config.settings.generate-api-key",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PartnerLevel" : true,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 118,
        "IsUserPortal" : false
    },

    /* 22 createdAt:2022-09-28T16:05:03.000Z*/
    {
        "_id" : ObjectId.createFromHexString("633470af15af888af8d1b822"),
        "PermissionName" : "CSV_reports",
        "PermissionMenuID" : "reports.reports.csv-exports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "Order" : 230,
        "IsUserPortal" : false
    },

    /* 23 createdAt:2022-07-08T07:47:18.000Z*/
    {
        "_id" : ObjectId.createFromHexString("62c7e1062484ff17a2b91516"),
        "PermissionName" : "Joblist_Settings",
        "PermissionMenuID" : "config.settings.jobList",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("63d3709b2f6c64b58370513a"),
        "InnerParent" : false,
        "Order" : 115,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 24 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6efa"),
        "PermissionName" : "Paypal",
        "PermissionMenuID" : "config.payment.paypal",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6edf"),
        "InnerParent" : false,
        "Order" : 2010,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 25 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef9"),
        "PermissionName" : "Strip",
        "PermissionMenuID" : "config.payment.strip",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6edf"),
        "InnerParent" : false,
        "Order" : 2020,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 26 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef8"),
        "PermissionName" : "Upload_Page",
        "PermissionMenuID" : "config.customization.upload",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ede"),
        "InnerParent" : false,
        "Order" : 110,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 27 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef7"),
        "PermissionName" : "Landing_Page",
        "PermissionMenuID" : "config.customization.landing",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ede"),
        "InnerParent" : false,
        "Order" : 95,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 28 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef6"),
        "PermissionName" : "Languages",
        "PermissionMenuID" : "config.customization.languages",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ede"),
        "InnerParent" : false,
        "Order" : 105,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 29 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef5"),
        "PermissionName" : "Text",
        "PermissionMenuID" : "config.customization.text",
        "CustomerLevel" : false,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ede"),
        "InnerParent" : false,
        "Order" : 100,
        "PartnerLevel" : false,
        "IsUserPortal" : false
    },

    /* 30 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ef2"),
        "PermissionName" : "Roles",
        "PermissionMenuID" : "config.permissions.roles",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6edd"),
        "InnerParent" : false,
        "Order" : 125,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 31 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ee5"),
        "PermissionName" : "Printer_reports",
        "PermissionMenuID" : "reports.reports.printerReports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "Order" : 210,
        "IsUserPortal" : false
    },

    /* 32 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ee4"),
        "PermissionName" : "Executive_reports",
        "PermissionMenuID" : "reports.reports.executiveReports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "Order" : 200,
        "IsUserPortal" : false
    },

    /* 33 createdAt:2022-02-25T12:31:29.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218cc21255c41977bee6ee2"),
        "PermissionName" : "Print_Release",
        "PermissionMenuID" : "apps.print.printrelease",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c515255c41977bee6ed5"),
        "InnerParent" : false,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 34 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ee1"),
        "PermissionName" : "License",
        "PermissionMenuID" : "licenses.license",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed3"),
        "InnerParent" : true,
        "Order" : 135,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 35 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6edf"),
        "PermissionName" : "Payment_Gateway",
        "PermissionMenuID" : "config.payment",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "InnerParent" : true,
        "PartnerLevel" : true,
        "Order" : 93,
        "IsUserPortal" : false
    },

    /* 36 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ede"),
        "PermissionName" : "Customization",
        "PermissionMenuID" : "config.customization",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "InnerParent" : true,
        "Order" : 90,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 37 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6edd"),
        "PermissionName" : "Permissions",
        "PermissionMenuID" : "config.permissions",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "InnerParent" : true,
        "Order" : 85,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 38 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6edc"),
        "PermissionName" : "Devices",
        "PermissionMenuID" : "things.device",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed1"),
        "InnerParent" : true,
        "Order" : 75,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 39 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6edb"),
        "PermissionName" : "Thing",
        "PermissionMenuID" : "things.thing",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed1"),
        "InnerParent" : true,
        "Order" : 65,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 40 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6eda"),
        "PermissionName" : "Groups",
        "PermissionMenuID" : "management.groups",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed0"),
        "InnerParent" : true,
        "Order" : 40,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 41 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed9"),
        "PermissionName" : "Users",
        "PermissionMenuID" : "management.users",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed0"),
        "InnerParent" : true,
        "Order" : 30,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 42 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed8"),
        "PermissionName" : "Locations",
        "PermissionMenuID" : "management.location",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed0"),
        "InnerParent" : true,
        "Order" : 20,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 43 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed7"),
        "PermissionName" : "Customers",
        "PermissionMenuID" : "management.customer",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed0"),
        "InnerParent" : true,
        "Order" : 10,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 44 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed6"),
        "PermissionName" : "Usage",
        "PermissionMenuID" : "reports.usage",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ecf"),
        "InnerParent" : true,
        "Order" : 55,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 45 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed5"),
        "PermissionName" : "Print",
        "PermissionMenuID" : "apps.print",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ece"),
        "InnerParent" : true,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 46 createdAt:2022-02-25T12:01:25.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c515255c41977bee6ed4"),
        "PermissionName" : "Analytics",
        "PermissionMenuID" : "dashboards.analytics",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ecd"),
        "InnerParent" : true,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 47 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ed3"),
        "PermissionName" : "Licenses",
        "PermissionMenuID" : "licenses",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "Order" : 130,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 48 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "PermissionName" : "Configuration",
        "PermissionMenuID" : "config",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "Order" : 85,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 49 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ed1"),
        "PermissionName" : "Things",
        "PermissionMenuID" : "things",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "Order" : 60,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 50 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ed0"),
        "PermissionName" : "Management",
        "PermissionMenuID" : "management",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "Order" : 5,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 51 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ecf"),
        "PermissionName" : "Reports",
        "PermissionMenuID" : "reports",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "Order" : 50,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 52 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ece"),
        "PermissionName" : "Applications",
        "PermissionMenuID" : "apps",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },

    /* 53 createdAt:2022-02-25T11:49:46.000Z*/
    {
        "_id" : ObjectId.createFromHexString("6218c25a255c41977bee6ecd"),
        "PermissionName" : "Dashboard",
        "PermissionMenuID" : "dashboards",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : true,
        "PartnerLevel" : true,
        "IsUserPortal" : false
    },
    {
        "_id" : ObjectId.createFromHexString("67cef4877988f3cf81ca9e9f"),
        "PermissionName" : "Third_Party",
        "PermissionMenuID" : "config.thirdparty",
        "CustomerLevel" : true,
        "ProductLevel" : "ePRINTit",
        "ParentPermission" : false,
        "PermissionCategoryId" : ObjectId.createFromHexString("6218c25a255c41977bee6ed2"),
        "InnerParent" : true,
        "PartnerLevel" : true,
        "Order" : 96,
        "IsUserPortal" : false
    },
    
    /* 55 createdAt:2025-03-12T16:08:46.000Z*/
    {
        "_id": ObjectId.createFromHexString("67d162a21236181b3d90be37"),
        "PermissionName": "Accounts",
        "PermissionMenuID": "management.accounts",
        "CustomerLevel": true,
        "ProductLevel": "ePRINTit",
        "ParentPermission": false,
        "PermissionCategoryId": {
          "$oid": "6218c25a255c41977bee6ed0"
        },
        "InnerParent": true,
        "Order": 4700,
        "PartnerLevel": true,
        "IsUserPortal": false
    }
]
module.exports = {
    addPermission: async () => {
        const db = await getDb()
        await db.collection(collectionName).insertMany(permissionData)
    },
}