module.exports = {
  onboardCustomer: {
    operationName: "OnboardCustomer",
    query: `mutation OnboardCustomer($onboardCustomerInput: OnboardCustomer) {
          onboardCustomer(OnboardCustomerInput: $onboardCustomerInput) {
            customerId
            customizationTextId
            message
            statusCode
          }
        }`,
    variables: {
      onboardCustomerInput: {
        CustomerData: {
          DomainName: "test",
          CustomerName: "test",
          MfaEnforce: false,
          Description: null,
          ParentCustomer: null,
          Tags: ["Delete"],
          TimeZone: "Asia/Kolkata",
          CustomerType: "business",
          Tier: "standard",
          Partner: false,
        },
        CustomizationData: {
          themeCode: "#4f46e5",
        },
        CustomizationTextData: {
          BrandScheme: "light",
          Layout: "dense",
          MainSection: {
            Description: {
              DescriptionTitle: "CustomerName",
              DescriptionBox:
                '<h1 class="ql-align-center"><strong>Welcome</strong> to our<span style="color: rgb(255, 153, 0);"> Wireless Printing Service!</span></h1><h3 class="ql-align-center"><a href="https://eprintit.com" rel="noopener noreferrer" target="_blank">Go to ePRINTit</a></h3>',
            },
          },
          LocationHoursSection: {
            Title: "Location and Hours",
            LocationHoursSectionDescription: null,
            LocationList: false,
            LocationSelectionRequired: false,
            OpenHoursVisibility: false,
          },
          SelectFileSection: {
            SupportedFileTypes: [
              "pdf",
              "jpg",
              "jpeg",
              "png",
              "gif",
              "bmp",
              "tif",
              "tiff",
              "doc",
              "docx",
              "pub",
              "rtf",
              "htm",
              "txt",
              "html",
              "xlsx",
              "xls",
              "pptx",
              "ppt",
              "odt",
              "xps",
              "ods",
              "odp",
              "heic",
              "svg",
              "epub",
              "vsd",
              "oxps",
              "wmf",
              "webp",
            ],
            CostPerPageVisibility: false,
            ColorCostVisibility: false,
            GrayscaleVisibility: false,
            CostPerPage: {
              ColorCost: 0,
              Grayscale: 0,
            },
            MaxFileSize: 100,
          },
          UserInformationSection: {
            Title: "User Information",
            GuestVisibility: false,
            ReleaseCodeVisibility: true,
            ValidationVisibility: false,
            Options: {
              Guest: {
                UserInformationBox: "Enter Guest Name or Library Card Number",
                EmailConfirmationBox: true,
                TextConfirmationBox: true,
                UserInformationTextBox:
                  "Enter Guest Name or Library Card Number",
                EmailConfirmationTextBox:
                  "Enter email address for receipt of submission",
                TextConfirmationTextBox:
                  "Enter mobile number for text message receipt",
                GuestDisplayText: "Guest Name",
              },
              ReleaseCode: {
                ReleaseCodeText: "Release code",
                EmailConfirmationBox: true,
                TextConfirmationBox: true,
                EmailConfirmationTextBox:
                  "Enter email address for receipt of submission",
                TextConfirmationTextBox:
                  "Enter mobile number for text message receipt",
                ReleaseCodeDisplayText: "Release Code",
              },
              Validation: {
                ValidationText: "Enter Library Card",
                CardNumberBox: true,
                PINBox: true,
                CardNumberTextBox: "Enter Library Card Number",
                PinNumberTextBox: "Enter PIN number",
                LoginDisplayText: "Login",
              },
            },
          },
          Languages: [],
          Currency: "Danish Krone",
          HowToLogoSection: {
            EmailAddressAssignedGrayscale: "bw-api@tbs-usa.net",
            EmailAddressAssignedColor: "color-api@tbs-usa.net",
          },
          CustomerLanguage: "en",
          DecimalSeparator: ",",
        },
        GroupData: {
          GroupName: "admin",
          RoleType: "admin",
          Tags: null,
          GroupType: "Permissions",
        },
        JobListData: {
          CustomerID: null,
          Color: {
            Color: true,
            Enabled: true,
            Grayscale: true,
          },
          Copies: {
            Enabled: true,
            Limit: 1000,
          },
          Orientation: {
            AsSaved: true,
            Enabled: true,
            Landscape: true,
            Portrait: true,
          },
          Duplex: {
            Enabled: true,
            OneSided: true,
            TwoSided: true,
          },
          PageRange: {
            Enabled: true,
            Limit: 1000,
          },
          PaperSize: {
            AsSaved: true,
            Enabled: true,
            A3: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            A4: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            Ledger: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            Legal: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            Letter: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            Tabloid: {
              Enabled: true,
              Price: {
                Color: 0,
                ColorDuplex: 0,
                Grayscale: 0,
                GrayscaleDuplex: 0,
              },
            },
            AdditionalPaperSize: [],
          },
          DefaultValues: {
            Color: "Grayscale",
            Duplex: false,
            Orientation: "Portrait",
            PaperSize: "A4",
          },
          AutomaticPrintDelivery: null,
          ApiKey: null,
          LmsValidate: null,
          Secret: null,
          URL: null,
          QrCodeEnabled: false,
          DefaultLmsValidateThing: null,
          FileRetainPeriod: 2,
          CopyEnabled: null,
          CopyPaperSize: {
            AsSaved: null,
            Enabled: null,
            A3: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            A4: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Ledger: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Legal: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Letter: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Tabloid: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            AdditionalPaperSize: [],
          },
          ScanEnabled: null,
          ScanPaperSize: {
            AsSaved: null,
            Enabled: null,
            A3: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            A4: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Ledger: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Legal: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Letter: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            Tabloid: {
              Enabled: null,
              Price: {
                Color: null,
                ColorDuplex: null,
                Grayscale: null,
                GrayscaleDuplex: null,
              },
            },
            AdditionalPaperSize: [],
          },
          DeleteJobAfterPrint: null,
          Staple: {
            Enable: null,
            StapleBottomLeft: null,
            StapleBottomRight: null,
            StapleTopLeft: null,
            StapleTopRight: null,
            StapleOptionDefaultType: null,
          },
          ChargeForUsage: true,
          IppSettings: {
            AllowedCIDRorIPs: [""],
          },
        },
        LicenseData: {
          RegisterDate: "2025-04-30T18:30:00.000Z",
          OrderNumber: "12345678",
        },
        LocationData: {
          CurrencyCode: "INR",
          TimeZone: "Asia/Kolkata",
          ShortName: null,
          Tags: null,
          Searchable: true,
          Longitude: 72.83106070000001,
          Latitude: 21.1702401,
          Description: null,
          CustomerID: null,
          Location: "test",
          Address: "test",
          IsActive: true,
          Rule: {
            OpenTimes: {
              DayHours: [
                {
                  Enable: true,
                  Day: "Monday",
                  CloseTimes: "9:00 PM",
                  OpenTimes: "9:00 AM",
                },
                {
                  Enable: true,
                  Day: "Tuesday",
                  CloseTimes: "9:00 PM",
                  OpenTimes: "9:00 AM",
                },
                {
                  Enable: true,
                  Day: "Wednesday",
                  CloseTimes: "9:00 PM",
                  OpenTimes: "9:00 AM",
                },
                {
                  Enable: true,
                  Day: "Thursday",
                  CloseTimes: "9:00 PM",
                  OpenTimes: "9:00 AM",
                },
                {
                  Enable: true,
                  Day: "Friday",
                  CloseTimes: "9:00 PM",
                  OpenTimes: "9:00 AM",
                },
              ],
            },
          },
        },
        UserData: {
          Tier: "standard",
          TenantDomain: "test",
          PrimaryEmail: "test@gmail.com",
          Username: "test",
          Tags: null,
          PhoneNumber: null,
          LastName: "isactive",
          FirstName: "test",
          Email: null,
          CustomerID: null,
          Mfa: false,
          MfaOption: {
            Email: false,
            Mobile: false,
          },
        },
      },
    },
  },
};
