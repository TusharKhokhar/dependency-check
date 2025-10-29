const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Navigations'

const navigation = {
    "Navigation" : [
        {
            "id" : "dashboards",
            "title" : "navigation.dashboard.label",
            "subtitle" : "Usage dashboard",
            "type" : "group",
            "icon" : "heroicons_outline:home",
            "children" : [
                {
                    "id" : "dashboards.analytics",
                    "title" : "Analytics",
                    "type" : "basic",
                    "icon" : "heroicons_outline:chart-pie",
                    "link" : "/dashboards/analytics"
                }
            ]
        },
        {
            "id" : "apps",
            "title" : "Applications",
            "subtitle" : "Available Applications",
            "type" : "group",
            "icon" : "heroicons_outline:cloud",
            "children" : [
                {
                    "id" : "apps.print",
                    "title" : "Print",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:printer",
                    "link" : "/apps/print",
                    "children" : [
                        {
                            "id" : "apps.print.printrelease",
                            "title" : "Print Release",
                            "type" : "basic",
                            "link" : "/print/printRelease"
                        },
                        {
                            "id" : "apps.print.reprint",
                            "title" : "Re-Print",
                            "type" : "basic",
                            "link" : "/print/rePrint"
                        }
                    ]
                }
            ]
        },
        {
            "id" : "userPortal",
            "title" : "userPortal.label",
            "subtitle" : "userPortal.subTitle",
            "type" : "group",
            "icon" : "heroicons_outline:home",
            "children" : [
                {
                    "id" : "userPortal.details",
                    "title" : "userPortal.userDetails.label",
                    "type" : "basic",
                    "link" : "/user-details"
                },
                {
                    "id" : "userPortal.prices",
                    "title" : "userPortal.prices.label",
                    "type" : "basic",
                    "link" : "/prices"
                },
                {
                    "id" : "userPortal.transactions",
                    "title" : "userPortal.transactions.label",
                    "type" : "basic",
                    "link" : "/transactions"
                },
                {
                    "id" : "userPortal.usage",
                    "title" : "userPortal.usage.label",
                    "type" : "basic",
                    "link" : "/usage"
                },
                {
                    "id" : "userPortal.printRelease",
                    "title" : "navigation.applications.print.printReleaseLabel",
                    "type" : "basic",
                    "link" : "/print-release"
                },
                {
                    "id" : "userPortal.rePrint",
                    "title" : "printRelease.rePrint",
                    "type" : "basic",
                    "link" : "/re-print"
                },
                {
                    "id" : "userPortal.addValue",
                    "title" : "userPortal.addValue.label",
                    "type" : "basic",
                    "link" : "/add-value"
                }
            ]
        },
        {
            "id" : "reports",
            "title" : "Reports",
            "subtitle" : "Reporting Usage",
            "type" : "group",
            "icon" : "heroicons_outline:document-report",
            "children" : [
                {
                    "id" : "reports.usage",
                    "title" : "Reports",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:chart-square-bar",
                    "link" : "/reports/usage",
                    "children" : [
                        {
                            "id" : "reports.reports.executiveReports",
                            "title" : "Executive reports",
                            "type" : "basic",
                            "link" : "/report/executiveReports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "reports.reports.printerReports",
                            "title" : "Printer reports",
                            "type" : "basic",
                            "link" : "/report/printerReports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "reports.reports.csv-exports",
                            "title" : "CSV reports",
                            "type" : "basic",
                            "link" : "/report/csv-exports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "reports.reports.license-reports",
                            "title" : "navigation.reports.licenseReportsLabel",
                            "type" : "basic",
                            "link" : "/report/license-reports"
                        },
                        {
                            "id" : "reports.reports.add-value-reports",
                            "title" : "navigation.reports.addedValueReportsLabel",
                            "type" : "basic",
                            "link" : "/report/value-added-reports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "reports.reports.kiosk-reports",
                            "title" : "navigation.reports.kioskReportsLabel",
                            "type" : "basic",
                            "link" : "/report/kiosk-transaction-reports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "reports.reports.kiosk-payment-transaction-reports",
                            "title" : "navigation.reports.kioskTransactionReportsLabel",
                            "type" : "basic",
                            "link" : "/report/kiosk-payment-transaction-reports",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id" : "management",
            "title" : "Management",
            "subtitle" : "Manage System",
            "type" : "group",
            "icon" : "heroicons_outline:collection",
            "children" : [
                {
                    "id" : "management.customer",
                    "title" : "Customers",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:office-building",
                    "link" : "/customers/customerList",
                    "children" : [
                        {
                            "id" : "management.customer.list",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/customers/customerList",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "management.customers.view",
                            "title" : "View",
                            "type" : "basic",
                            "link" : "/customers/customerView",
                            "meta" : {

                            }
                        }
                    ]
                },
                {
                    "id" : "management.location",
                    "title" : "navigation.management.locationsLabel",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:location-marker",
                    "link" : "/locations/locationList",
                    "children" : [
                        {
                            "id" : "location.locationList",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/locations/locationList",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                },
                {
                    "id" : "management.users",
                    "title" : "Users",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:user",
                    "link" : "/users",
                    "children" : [
                        {
                            "id" : "users.userList",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/users",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                },
                {
                    "id" : "management.groups",
                    "title" : "Groups",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:users",
                    "link" : "/groups",
                    "children" : [
                        {
                            "id" : "groups.groupList",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/groups",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id" : "things",
            "title" : "Things",
            "subtitle" : "Things to configure",
            "type" : "group",
            "icon" : "heroicons_outline:puzzle",
            "children" : [
                {
                    "id" : "things.thing",
                    "title" : "Thing",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:template",
                    "link" : "/things/thingList",
                    "children" : [
                        {
                            "id" : "things.thing.list",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/things/thingList",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                },
                {
                    "id" : "things.device",
                    "title" : "Devices",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:stop",
                    "link" : "/things/deviceList",
                    "children" : [
                        {
                            "id" : "things.device.list",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/things/deviceList",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id" : "config",
            "title" : "Configuration",
            "subtitle" : "System Configuration",
            "type" : "group",
            "icon" : "heroicons_outline:cog",
            "children" : [
                {
                    "id" : "config.permissions",
                    "title" : "Permissions",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:newspaper",
                    "link" : "/config/permissions",
                    "children" : [
                        {
                            "id" : "config.permissions.roles",
                            "title" : "Roles",
                            "type" : "basic",
                            "link" : "/config/roles",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                },
                {
                    "id" : "config.customization",
                    "title" : "Customization",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:chip",
                    "link" : "/config/customization",
                    "children" : [
                        {
                            "id" : "config.customization.text",
                            "title" : "Text",
                            "type" : "basic",
                            "link" : "/config/customization/text",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.customization.languages",
                            "title" : "Languages",
                            "type" : "basic",
                            "link" : "/config/customization/language",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.customization.landing",
                            "title" : "Landing Page",
                            "type" : "basic",
                            "link" : "/config/customization/landing",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.customization.upload",
                            "title" : "Upload Page",
                            "type" : "basic",
                            "link" : "/config/customization/upload",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                },
                {
                    "id" : "config.payment",
                    "title" : "navigation.configuration.paymentGateway.label",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:credit-card",
                    "link" : "/config/payment",
                    "hidden" : {

                    },
                    "children" : [
                        {
                            "id" : "config.payment.list",
                            "title" : "List",
                            "type" : "basic",
                            "link" : "/payment-gateway",
                            "hidden" : {

                            }
                        }
                    ]
                },
                {
                    "id" : "config.settings",
                    "title" : "Settings",
                    "type" : "collapsable",
                    "icon" : "heroicons_outline:cog",
                    "link" : "/config/settings",
                    "hidden" : {

                    },
                    "children" : [
                        {
                            "id" : "config.settings.identity-provider",
                            "title" : "authProviders.label",
                            "type" : "basic",
                            "link" : "/config/settings/identity-provider",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.jobList",
                            "title" : "Joblist Settings",
                            "type" : "basic",
                            "link" : "/config/settings/jobList",
                            "hidden" : {

                            },
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.profiles",
                            "title" : "Profiles",
                            "type" : "basic",
                            "link" : "/config/settings/profile",
                            "hidden" : {

                            },
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.generate-api-key",
                            "title" : "Generate API Key",
                            "type" : "basic",
                            "link" : "/config/settings/generate-api-key",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.softwareUpdate",
                            "title" : "softwareUpdateLabel",
                            "type" : "basic",
                            "link" : "/config/settings/software-udpate",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.custom-text",
                            "title" : "navigation.configuration.customization.customTextKeyLabel",
                            "type" : "basic",
                            "link" : "/config/settings/custom-text",
                            "hidden" : {

                            }
                        },
                        {
                            "id" : "config.settings.audit-logs",
                            "title" : "navigation.configuration.auditLogs.auditLogLabel",
                            "type" : "basic",
                            "link" : "/config/settings/logs",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.terms-of-use",
                            "title" : "navigation.configuration.termsOfUse.label",
                            "type" : "basic",
                            "link" : "/config/settings/terms-of-use",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        },
                        {
                            "id" : "config.settings.mobile-configuration",
                            "title" : "navigation.configuration.mobileConfiguration.label",
                            "type" : "basic",
                            "link" : "/config/settings/mobile-configuration",
                            "meta" : {
                                "isAddEditDisabled" : false
                            }
                        }
                    ]
                }
            ]
        },
        {
            "id" : "licenses",
            "title" : "Licenses",
            "subtitle" : "License configuration",
            "type" : "group",
            "icon" : "heroicons_outline:document-text",
            "link" : "/licenses/license",
            "children" : [
                {
                    "id" : "licenses.license",
                    "title" : "License",
                    "type" : "basic",
                    "icon" : "heroicons_outline:clipboard-list",
                    "link" : "/licenses/licenseList"
                }
            ]
        }
    ]
}
module.exports = {
    addNavigation: async () => {
        const db = await getDb()
        return db.collection(collectionName).insertOne(navigation)
    },
}