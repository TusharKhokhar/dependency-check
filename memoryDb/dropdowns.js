const { getDb, getTestSecretsDb } = require("../publicAuth/config/db");
const collectionName = "Dropdowns";
const {
  getObjectId: ObjectId,
} = require("../publicAuth/helpers/objectIdConvertion");

module.exports = {
  addDropdowns: async (customerId) => {
    const db = await getDb();
    const dropdownsData = {
      ThingType: [
        "kiosk",
        "print delivery station",
        "hp embedded",
        "avision embedded",
        "ricoh embedded"
      ],
      DeviceType: ["printer", "computer"],
      Navigation: [
        {
          id: "dashboards",
          title: "Dashboard",
          subtitle: "Usage dashboard",
          type: "group",
          icon: "heroicons_outline:home",
          children: [
            {
              id: "dashboards.analytics",
              title: "Analytics",
              type: "basic",
              icon: "heroicons_outline:chart-pie",
            },
          ],
        },
        {
          id: "apps",
          title: "Applications",
          subtitle: "Available Applications",
          type: "group",
          icon: "heroicons_outline:cloud",
          children: [
            {
              id: "apps.print",
              title: "Print",
              type: "collapsable",
              icon: "heroicons_outline:printer",
              link: "/apps/print",
            },
          ],
        },
      ],
      PaperSize: [
        "Letter",
        "Letter Small",
        "Tabloid",
        "Ledger",
        "Legal",
        "Statement",
        "Executive",
        "A0",
        "A1",
        "A2",
        "A3",
        "A4",
        "Standard11x17",
      ],
      ThingTypeUpdateSupport: [
        "kiosk",
        "hp embedded",
        "avision embedded",
        "driver windows",
        "driver macos",
        "pds",
      ],
      LanguageNonSupportedVersions: [
        "2.1.0.6",
        "2.1.0.112",
        "2.1.0.9",
        "1.1.0.8",
        "2.1.0.5",
        "2.1.0.101",
        "2.1.0.8",
        "2.1.0.93",
        "2.1.0.107",
        "2.1.0.104",
        "2.1.0.109",
        "2.1.0.102",
        "2.1.0.103",
        "2.1.0.106",
        "2.0.0.106",
        "0.0.0.1",
        null,
      ],
      ThirdPartySoftwareType: ["Proton Integration", "Account Sync"]
    };
    const testSecretDB = await getTestSecretsDb();
    const actaulData = await testSecretDB
      .collection(collectionName)
      .findOne({});
    const data = await db.collection(collectionName).insertOne(dropdownsData);
    dropdownsData._id = data.insertedId;
    return { insertedId: data.insertedId, ops: [dropdownsData] };
  },
};
