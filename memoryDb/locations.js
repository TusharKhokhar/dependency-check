const { getDb } = require("../publicAuth/config/db");
const collectionName = "Locations";
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const { faker } = require("../publicAuth/node_modules/@faker-js/faker");

module.exports = {
    addLocation: async (customerId, locationName) => {
        const db = await getDb();
        const locationData = {
            Address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
            CustomerID: customerId,
            Description: faker.lorem.sentence(),
            IsActive: faker.datatype.boolean(),
            IsDeleted: false,
            Label: faker.location.street(),
            Latitude: faker.location.latitude(),
            Longitude: faker.location.latitude(),
            Location: locationName || faker.location.city(),
            Rule: {
                OpenTimes: [
                    {
                        DayHours: [
                            {
                                Day: "Monday",
                                OpenTimes: "09:00 AM",
                                CloseTimes: "06:00 PM",
                                Enable: true,
                            },
                            {
                                Day: "Tuesday",
                                OpenTimes: "09:00 AM",
                                CloseTimes: "06:00 PM",
                                Enable: true,
                            },
                        ],
                    },
                ],
            },
            Searchable: true,
            Tags: faker.lorem.words().split(' '),
            TimeZone: "US/Mountain",
            CreatedBy: ObjectId.createFromHexString(),
            ApprovedBy: ObjectId.createFromHexString(),
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            UpdatedBy: ObjectId.createFromHexString(),
            AdvancedEmails: {
                AdvancedEmailAlias: [
                  {
                    "CombinationType": "bw",
                    "Email": "bw-surat-test@eprintitsaas.org",
                    "AliasEmail": "test05@gmail.com"
                  },
                ],
                Enabled: true
              },
        };

        const data = await db.collection(collectionName).insertOne(locationData);
        locationData._id = data.insertedId;
        return { insertedId: data.insertedId.toString(), ops: [locationData] };
    },
};
