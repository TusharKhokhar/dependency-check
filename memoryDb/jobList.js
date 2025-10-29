const { getDb } = require("../publicAuth/config/db");
const collectionName = "JobLists";
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");

module.exports = {
    addJobList: async (customerId) => {
        const db = await getDb();
        const jobData = {
            CustomerID: ObjectId.createFromHexString(customerId),
            Copies: {
                Enabled: true,
                Limit: 1000,
            },
            Color: {
                Enabled: true,
                Color: true,
                Grayscale: true,
            },
            Duplex: {
                Enabled: true,
                OneSided: true,
                TwoSided: true,
            },
            PaperSize: {
                Enabled: true,
                AsSaved: true,
                Letter: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                Ledger: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                Tabloid: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                Legal: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                A4: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                A3: { Enabled: true, Price: { Color: 11, Grayscale: 5, ColorDuplex: 7, GrayscaleDuplex: 9 } },
                AdditionalPaperSize: [],
            },
            Orientation: {
                Enabled: true,
                AsSaved: true,
                Portrait: true,
                Landscape: true,
            },
            PageRange: {
                Enabled: true,
                Limit: 1000,
            },
            DefaultValues: {
                Color: "Grayscale",
                Duplex: false,
                PaperSize: "A4",
                Orientation: "Portrait",
            },
            QrCodeEnabled: false,
            AutomaticPrintDelivery: true,
            ChargeForUsage: true,
            FileRetainPeriod: 6,
            CreatedBy: ObjectId.createFromHexString(),
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            IsActive: true,
            IsDeleted: false,
        };

        const data = await db.collection(collectionName).insertOne(jobData);
        jobData._id = data.insertedId;
        return { insertedId: data.insertedId.toString(), ops: [jobData] };
    },
};
