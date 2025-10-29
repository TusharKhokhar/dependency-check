const { getObjectId: ObjectId } = require("../helpers/objectIdConverter");
const CustomLogger = require("../helpers/customLogger");
const {
  performManualSorting,
  getDataFromCollection,
  filterThirdPartyDataByPermission,
} = require("../helpers/aggregator");
const log = new CustomLogger();
const ThirdPartySoftware = {};

const filterByPattern = (responses, pattern) => {
  if (!pattern) return responses;

  const regex = new RegExp(pattern, "i");
  return responses.filter(
    (response) =>
      regex.test(response.ThirdPartySoftwareName || "") ||
      regex.test(response.Tags || "") ||
      regex.test(response.ThirdPartySoftwareType || "") ||
      regex.test(response.CustomerName || "")
  );
};

ThirdPartySoftware.getThirdPartySoftwareInformation = async ({
  pattern,
  pageNumber,
  limit,
  sort = "asc",
  sortKey,
  status,
  customerIds,
  db,
  context
}) => {
  try {
    let query = {
      IsDeleted: false
    };
    sort = sort === "dsc" ? -1 : 1;
    sortKey = sortKey || "ThirdPartySoftwareName";
    const skips = limit * (pageNumber - 1);

    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map((ele) => {
        return ObjectId.createFromHexString(ele);
      });
      Object.assign(query, { CustomerID: { $in: customerIds } });
    }

    if(status !== undefined && status !== null) {
      Object.assign(query, { IsActive: status });
    }

    const projection = {
      ThirdPartySoftwareName: 1,
      ThirdPartySoftwareType: 1,
      IsActive: 1,
      Tags: 1,
      CustomerID: 1,
    };

    const collections = [
      "AccountSync",
      "Protons",
      "Emails",
      "HandwriteRecognition",
      "RestorePictures",
      "Illiad",
      "Smartphones",
      "FTP",
      "Abby",
      "Fax",
      "Networks",
      "TextTranslation",
      "Audio"
    ];
    const queries = collections.map((collection) =>
      db.collection(collection).find(query, { projection }).toArray()
    );

    let [
      accountSyncData,
      protonData,
      emailData,
      handwriteData,
      restorePicturesData,
      illiadData,
      smartphoneData,
      FTPData,
      AbbyData,
      faxData,
      networkData,
      textTranslationData,
      AudioData,
    ] = await Promise.all(queries);
    let mergedData = [
      ...accountSyncData,
      ...protonData,
      ...emailData,
      ...handwriteData,
      ...restorePicturesData,
      ...illiadData,
      ...AbbyData,
      ...smartphoneData,
      ...FTPData,
      ...faxData,
      ...networkData,
      ...textTranslationData,
      ...AudioData,
    ];

    const customerIDs = mergedData.map((ele) => ele.CustomerID.toString());

    let uniqueCustomerIDs = new Set(customerIDs);
    uniqueCustomerIDs = Array.from(uniqueCustomerIDs).map((idStr) =>
      ObjectId.createFromHexString(idStr)
    );

    const customerData = await getDataFromCollection({
      collectionName: "Customers",
      filters: { _id: { $in: uniqueCustomerIDs } },
      projection: ["_id", "CustomerName"],
    });

    let response = mergedData.map((item) => {
      let matchedCustomer = customerData.find(
        (data) => item.CustomerID.toString() === data._id.toString()
      );
      return {
        ...item,
        CustomerName: matchedCustomer ? matchedCustomer.CustomerName : null,
      };
    });

    const userPermissions = context?.data?.user.Permissions || [];

    response = filterThirdPartyDataByPermission(response, userPermissions);

    response = performManualSorting(response, sortKey, sort);
    let total = response.length;

    if (pattern) {
      response = filterByPattern(response, pattern);
      total = response.length;
    }

    if (pageNumber && limit) {
      response = response.slice(skips, skips + limit);
    }

    return { thirdPartySoftware: response, total };
  } catch (err) {
    log.error("Error in getThirdPartySoftwareInformation:", err);
    throw new Error(err?.message || err);
  }
};

module.exports = ThirdPartySoftware;
