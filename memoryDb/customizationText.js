const {getDb} = require('../publicAuth/config/db')
const collectionName = 'CustomizationTexts'
const {ObjectId} = require('../publicAuth/node_modules/mongodb')
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');
const { getObjectId } = require('../publicAuth/helpers/objectIdConvertion');


module.exports = {
    addCustomizationText: async (groupId, customerId) => {
        const db = await getDb()
        const customizationTextData = {
            "Languages" : [ ],
            "CustomerLanguage" : "en",
            "MainSection" : {
                "Description" : {
                    "DescriptionTitle" : "CustomerName",
                    "DescriptionBox" : "<h1 class=\"ql-align-center\"><strong>Welcome</strong> to our<span style=\"color: rgb(255, 153, 0);\"> Wireless Printing Service!</span></h1><h3 class=\"ql-align-center\"><a href=\"https://eprintit.com\" rel=\"noopener noreferrer\" target=\"_blank\">Go to ePRINTit</a></h3>"
                },
                "TopSection" : {
                    "CustomerLogo" : "https://cloud-eprintitsaas-pri-qa.s3.amazonaws.com/Logos/667d51a33bcd960ded7d535b/web.png"
                }
            },
            "SelectFileSection" : {
                "SupportedFileTypes" : [
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
                    "webp"
                ],
                "CostPerPageVisibility" : true,
                "ColorCostVisibility" : true,
                "GrayscaleVisibility" : true,
                "CostPerPage" : {
                    "ColorCost" : 0.25,
                    "Grayscale" : 0.15
                },
                "MaxFileSize" : 100
            },
            "UserInformationSection" : {
                "Title" : "User Information",
                "GuestVisibility" : true,
                "ReleaseCodeVisibility" : false,
                "ValidationVisibility" : false,
                "Options" : {
                    "Guest" : {
                        "UserInformationBox" : "Enter Guest Name or Library Card Number",
                        "EmailConfirmationBox" : true,
                        "TextConfirmationBox" : true,
                        "UserInformationTextBox" : "Enter Guest Name or Library Card Number",
                        "EmailConfirmationTextBox" : "Enter email address for receipt of submission",
                        "TextConfirmationTextBox" : "Enter mobile number for text message receipt",
                        "GuestDisplayText" : "Guest Name"
                    },
                    "ReleaseCode" : {
                        "EmailConfirmationBox" : true,
                        "TextConfirmationBox" : true,
                        "ReleaseCodeText" : "Release code",
                        "EmailConfirmationTextBox" : "Enter email address for receipt of submission",
                        "TextConfirmationTextBox" : "Enter mobile number for text message receipt",
                        "ReleaseCodeDisplayText" : "Release Code"
                    },
                    "Validation" : {
                        "CardNumberBox" : true,
                        "PINBox" : true,
                        "ValidationText" : "Enter Library Card",
                        "CardNumberTextBox" : "Enter Library Card Number",
                        "PinNumberTextBox" : "Enter PIN number",
                        "LoginDisplayText" : "Login"
                    }
                }
            },
            "LocationHoursSection" : {
                "Title" : "Location and Hours",
                "LocationHoursSectionDescription" : null,
                "LocationSelectionRequired" : false,
                "LocationList" : false,
                "OpenHoursVisibility" : false
            },
            "HowToLogoSection" : {
                "EmailAddressAssignedGrayscale" : "bw-ztt@eprintitsaas.net",
                "EmailAddressAssignedColor" : "color-ztt@eprintitsaas.net",
                "PartnerLogo" : "assets/images/logo/tbs-logo-image.png",
                "PartnerUrl" : "https://tbsit360.com",
                "PartnerUrlText" : "For more information about Webprint.",
                "EmailAddressAssignedCustomer" : "ztt@eprintitsaas.net",
                "UploadURL" : "https://ztt.eprintitsaas.net/public/upload",
                "EmailAddressAssignedColorAlias" : null,
                "EmailAddressAssignedCustomerAlias" : null,
                "EmailAddressAssignedGrayscaleAlias" : null
            },
            "BrandScheme" : "light",
            "Layout" : "dense",
            "Currency" : "EUR",
            "CustomerID" : customerId,
            "CreatedAt" : new Date(),
            "UpdatedAt" : new Date(),
            SignUpGroup: groupId,
            "IsActive" : true,
            "IsDeleted" : false,
            "CreatedBy" : new ObjectId("6526b2437a7d824edf9504a6"),
            "GlobalDecimalSetting" : 2,
            "LogoMobile" : {
                "Url" : "https://cloud-eprintitsaas-pri-qa.s3.amazonaws.com/Logos/667d51a33bcd960ded7d535b/mobile.png"
            },
            "AdvancedEmailConfiguration" : {
                "AdvancedEmailAlias" : [{
                    "CombinationType": "bw_twosided",
                    "Email": "bw-twosided-test@eprintitsaas.org",
                    "AliasEmail": "test05@gmail.com"
                }],
                "Enabled": true
            },
            "DecimalSeparator" : ".",
            "EnableSignUp" : true,
            "LocationSearchRange" : 70
        }
        const customizationText = await db.collection(collectionName).insertOne(customizationTextData)
        return {insertedId: customizationText.insertedId}
    },
    getCustomizationTextByCustomerId: async (customerId) => {
        const db = await getDb();
        return await db.collection(collectionName).findOne({ CustomerID: getObjectId.createFromHexString(customerId) });
    },
    getStaticCustomizationTexts: () => {
        return {
            _id: "62d9850b9933c8000968bc04",
            MainSection: {
                TopSection: {
                CustomerLogo: "https://customer-logo/web.png",
                },
                Description: {
                DescriptionTitle: "Test Public Library",
                DescriptionBox:
                    '<h1 class="ql-align-center" style="text-align: center;"><strong>Welcome</strong> to our<span style="color: #ff9900;"> <span style="color: #1c7bb9;">Wireless Printing Service!</span></span></h1>',
                },
            },
            LocationHoursSection: {
                Title: "Location and Hours",
                LocationHoursSectionDescription: null,
                LocationList: true,
                LocationSelectionRequired: true,
                OpenHoursVisibility: true,
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
                "webp",
                "vsd",
                "epub",
                "svg",
                "heic",
                ],
                CostPerPageVisibility: true,
                ColorCostVisibility: true,
                GrayscaleVisibility: true,
                CostPerPage: {
                ColorCost: 0.2,
                Grayscale: 0.1,
                },
                MaxFileSize: 75,
            },
            UserInformationSection: {
                Title: "User Information",
                GuestVisibility: false,
                ReleaseCodeVisibility: true,
                ValidationVisibility: true,
                Options: {
                Guest: {
                    UserInformationBox: "true",
                    EmailConfirmationBox: true,
                    TextConfirmationBox: true,
                    EmailConfirmationTextBox:
                    "Enter email address for receipt of submission",
                    GuestDisplayText: "Guest Name",
                    TextConfirmationTextBox:
                    "Enter mobile number for text message receipt",
                    UserInformationTextBox: "Enter Guest Name or Library Card Number",
                },
                ReleaseCode: {
                    EmailConfirmationBox: true,
                    TextConfirmationBox: true,
                    ReleaseCodeText: "Confirmation",
                    EmailConfirmationTextBox:
                    "Enter email address for receipt of submission",
                    ReleaseCodeDisplayText: "Release Code",
                    TextConfirmationTextBox:
                    "Enter mobile number for text message receipt",
                },
                Validation: {
                    CardNumberBox: true,
                    PINBox: true,
                    ValidationText: "Enter LIbrary Card",
                    CardNumberTextBox: "Enter Library Card Number",
                    LoginDisplayText: "Login",
                    PinNumberTextBox: "Enter PIN number",
                },
                },
            },
            Languages: ["english"],
            Currency: "USD",
            IsDeleted: false,
            IsActive: true,
            DeletedBy: "",
            CustomerID: "6231ce19932e27000985ba60",
            LogoMobile: {
                Url: "https://mobile-logo/mobile.png",
            },
            BrandScheme: "light",
            HowToLogoSection: {
                EmailAddressAssignedCustomer: "admin@eprintitsaas.org",
                PartnerLogo: "https://partner-logo/partner.png",
                PartnerUrl: "https://tbsit360.com/",
                PartnerUrlText: "For more information about Webprint.",
                EmailAddressAssignedColor: null,
                EmailAddressAssignedColorAlias: null,
                EmailAddressAssignedCustomerAlias: null,
                EmailAddressAssignedGrayscale: null,
                EmailAddressAssignedGrayscaleAlias: null,
            },
            Layout: "dense",
            CustomerLanguage: "en",
            AdvancedEmailConfiguration: {
                AdvancedEmailAlias: [],
            },
            EnableSignUp: null,
            GlobalDecimalSetting: 2,
            LocationSearchRange: 50,
            DisplayUpload: null,
            HideEmailPrinting: null,
            PriceToggle: null,
            AddValuePageAmount: [11],
            CustomEmailMessage: "testttt",
            TermsAndServiceAdditions: "<p>test</p>",
            DecimalSeparator: ".",
        };
    },
}