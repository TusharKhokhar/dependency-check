module.exports = {
  E_PRINT_SIGNUP_SUBJECT: 'Welcome to ePRINTit',
  REPORTS: 'reports',
  KIOSK_RESTART: 'restart kiosk',
  NEW_CUSTOMER_SIGNUP: 'New Customer - Please Respond',
  PASSWORD_RESET_REQUEST: 'Reset Password',
  UPLOAD_MAIL_SUBJECT: 'ePrintIt: Upload File Confirmation',
  MFA_REQUIRED_MAIL_SENT: 'MFA login mail sent',
  ACCOUNT_LOCKED: 'ePRINTit: Account Locked',
  STANDARD_TIER: 'standard',
  API_AWS_VERSION: '2018-11-29',
  DEFAULT_MENU: [
    {
      id: 'dashboards',
      title: 'Dashboard',
      subtitle: 'Usage dashboard',
      type: 'group',
      icon: 'heroicons_outline:home',
      children: [
        {
          id: 'dashboards.analytics',
          title: 'Analytics',
          type: 'basic',
          icon: 'heroicons_outline:chart-pie',
          link: '/dashboards/analytics'
        }
      ]
    },
    {
      id: 'apps',
      title: 'Applications',
      subtitle: 'Available Applications',
      type: 'group',
      icon: 'heroicons_outline:cloud',
      children: [
        {
          id: 'apps.print',
          title: 'Print',
          type: 'collapsable',
          icon: 'heroicons_outline:printer',
          link: '/apps/print',
          children: [
            {
              id: 'apps.print.printrelease',
              title: 'Print Release',
              type: 'basic',
              link: '/apps/print/printrelease'
            },
            {
              id: 'apps.print.reprint',
              title: 'Re-Print',
              type: 'basic',
              link: '/apps/print/reprint'
            }
          ]
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: 'Reporting Usage',
      type: 'group',
      icon: 'heroicons_outline:document-report',
      children: [
        {
          id: 'reports.usage',
          title: 'Reports',
          type: 'collapsable',
          icon: 'heroicons_outline:chart-square-bar',
          link: '/reports/usage',
          children: [
            {
              id: 'reports.reports.summary',
              title: 'Executive reports',
              type: 'basic',
              link: '/report/executiveReports',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'reports.reports.detail',
              title: 'Printer reports',
              type: 'basic',
              link: '/report/printerReports',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      subtitle: 'Manage System',
      type: 'group',
      icon: 'heroicons_outline:collection',
      children: [
        {
          id: 'management.customer',
          title: 'Customers',
          type: 'collapsable',
          icon: 'heroicons_outline:office-building',
          link: '/management/customers',
          children: [
            {
              id: 'management.customer.list',
              title: 'List',
              type: 'basic',
              link: '/customers/customerList',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'management.customers.view',
              title: 'View',
              type: 'basic',
              link: '/customers/customerView',
              meta: {}
            }
          ]
        },
        {
          id: 'management.location',
          title: 'Locations',
          type: 'collapsable',
          icon: 'heroicons_outline:location-marker',
          link: '/management/location',
          children: [
            {
              id: 'apps.contacts.locationList',
              title: 'List',
              type: 'basic',
              link: '/locations/locationList',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'management.location.view',
              title: 'View',
              type: 'basic',
              link: '/management/location/view',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        },
        {
          id: 'management.users',
          title: 'Users',
          type: 'collapsable',
          icon: 'heroicons_outline:user',
          link: '/management/users',
          children: [
            {
              id: 'apps.contacts.customer',
              title: 'List',
              type: 'basic',
              link: '/users',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'management.users.view',
              title: 'View',
              type: 'basic',
              link: '/management/users/view',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        },
        {
          id: 'management.groups',
          title: 'Groups',
          type: 'collapsable',
          icon: 'heroicons_outline:users',
          link: '/management/groups',
          children: [
            {
              id: 'management.groups.list',
              title: 'List',
              type: 'basic',
              link: '/groups',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'management.groups.view',
              title: 'View',
              type: 'basic',
              link: '/management/groups/view',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        }
      ]
    },
    {
      id: 'things',
      title: 'Things',
      subtitle: 'Things to configure',
      type: 'group',
      icon: 'heroicons_outline:puzzle',
      children: [
        {
          id: 'things.thing',
          title: 'Thing',
          type: 'collapsable',
          icon: 'heroicons_outline:template',
          link: '/things/thing',
          children: [
            {
              id: 'things.thing.list',
              title: 'List',
              type: 'basic',
              link: '/things/thingList',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'things.thing.view',
              title: 'View',
              type: 'basic',
              link: '/things/thing/view',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        },
        {
          id: 'things.device',
          title: 'Devices',
          type: 'collapsable',
          icon: 'heroicons_outline:stop',
          link: '/things/devices',
          children: [
            {
              id: 'things.device.list',
              title: 'List',
              type: 'basic',
              link: '/things/deviceList',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'things.device.view',
              title: 'View',
              type: 'basic',
              link: '/things/device/view',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        }
      ]
    },
    {
      id: 'config',
      title: 'Configuration',
      subtitle: 'System Configuration',
      type: 'group',
      icon: 'heroicons_outline:cog',
      children: [
        {
          id: 'config.permissions',
          title: 'Permissions',
          type: 'collapsable',
          icon: 'heroicons_outline:newspaper',
          link: '/config/permissions',
          children: [
            {
              id: 'config.permissions.roles',
              title: 'Roles',
              type: 'basic',
              link: '/config/roles',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        },
        {
          id: 'config.customization',
          title: 'Customization',
          type: 'collapsable',
          icon: 'heroicons_outline:chip',
          link: '/config/customization',
          children: [
            {
              id: 'config.customization.text',
              title: 'Text',
              type: 'basic',
              link: '/config/customization/text',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.customization.languages',
              title: 'Languages',
              type: 'basic',
              link: '/config/customization/language',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.customization.landing',
              title: 'Landing Page',
              type: 'basic',
              link: '/config/customization/landing',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.customization.upload',
              title: 'Upload Page',
              type: 'basic',
              link: '/config/customization/upload',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.customization.jobList',
              title: 'Joblist Settings',
              type: 'basic',
              link: '/config/customization/jobList',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        },
        {
          id: 'config.payment',
          title: 'Payment Gateway',
          type: 'collapsable',
          icon: 'heroicons_outline:credit-card',
          link: '/config/payment',
          children: [
            {
              id: 'config.payment.strip',
              title: 'Strip',
              type: 'basic',
              link: '/config/payment/strip'
            },
            {
              id: 'config.payment.paypal',
              title: 'Paypal',
              type: 'basic',
              link: '/config/payment/paypal'
            }
          ]
        },
        {
          id: 'config.validation',
          title: 'Validation',
          type: 'collapsable',
          icon: 'heroicons_outline:database',
          link: '/config/validation',
          children: [
            {
              id: 'config.validation.lms',
              title: 'Library Management System',
              type: 'basic',
              link: '/config/validation/lms',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.validation.ldap',
              title: 'LDAP',
              type: 'basic',
              link: '/config/validation/ldap',
              meta: {
                isAddEditDisabled: false
              }
            },
            {
              id: 'config.validation.openid',
              title: 'OpenID Connect',
              type: 'basic',
              link: '/config/validation/openid',
              meta: {
                isAddEditDisabled: false
              }
            }
          ]
        }
      ]
    },
    {
      id: 'licenses',
      title: 'Licenses',
      subtitle: 'License configuration',
      type: 'group',
      icon: 'heroicons_outline:document-text',
      link: '/licenses/license',
      children: [
        {
          id: 'licenses.license',
          title: 'License',
          type: 'basic',
          icon: 'heroicons_outline:clipboard-list',
          link: '/licenses/licenseList'
        }
      ]
    }
  ],
  AZURE_AD_RESOURCE_REF: '00000002-0000-0000-c000-000000000000',
  AZURE_AD_AUTHORITY_HOST_URL: 'https://login.microsoftonline.com', //'https://login.windows.net'
  AZURE_AD_GRAPH_BASE_URL: 'https://graph.microsoft.com/v1.0',
  GSUITE_USER_EMAIL_SCOPE: 'https://www.googleapis.com/auth/userinfo.email',
  GSUITE_USER_PROFILE_SCOPE: 'https://www.googleapis.com/auth/userinfo.profile',
  INNOVATION_SERVER_PATH: "/iii/sierra-api/v6",
  INNOVATION_LOGIN_BARCODE_ONLY: "BarcodeOnly",
  INNOVATION_LOGIN_BARCODE_WITH_PIN: "BarcodeWithPin",
  SIRSI_RESOURCE_USER: "/user",
  SIRSI_PATRON_LOGIN_END_POINT: "/patron/login",
  SIRSI_STAFF_LOGIN_END_POINT: "/staff/login",
  SIRSI_LOGIN_TYPE_PATRON: "Patron",
  SIRSI_LOGIN_TYPE_STAFF: "Staff",
  POLARIS_API_URL: "/PAPIService/REST/public/v1/1033/1/1", // /SGLCDPAPIService/REST /PAPIService/REST
  POLARIS_PATRON_AUTHENTICATION_PATH: "authenticator/patron",
  POLARIS_PATRON_BASIC_DETAILS: "patron",
  AZURE_AD_FALLBACK_MAPPING: {
    userId: "userPrincipalName",
    Email: "mail",
    email: "mail",
    familyName: "surname",
    sn: "surname",
    mobile_number: "mobilePhone",
  }
}
