const CustomLogger = require("./customLogger");
const { getDb } = require("../config/dbHandler");
const log = new CustomLogger();

const permissionMapping = {
  Read_Account_Sync: "AccountSyncIntegration",
  Read_Proton: "ProtonIntegration",
  Read_Email: "EmailIntegration",
  Read_Handwrite_Recognition: "HandwriteRecognitionIntegration",
  Read_Restore_Pictures: "RestorePicturesIntegration",
  Read_Illiad: "IlliadIntegration",
  Read_Smartphone: "SmartphoneIntegration",
  Read_FTP: "FTPIntegration",
  Read_Abby: "AbbyIntegration",
  Read_Fax_Integration: "FaxIntegration",
  Read_Text_Translation: "TextTranslationIntegration",
  Read_Network: "NetworkIntegration",
  Read_Audio: "AudioIntegration",
};

const performManualSorting = (detailsList, sortKey, sort) => {
  try {
    log.info("sorting user list****", { sortKey, sort });

    detailsList.sort((a, b) => {
      let aValue = a[sortKey] || "";
      let bValue = b[sortKey] || "";

      return sort === -1
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    });
    return detailsList;
  } catch (error) {
    log.error("error in performManualSorting ***", error);
    return detailsList;
  }
};

function filterThirdPartyDataByPermission(data, userPermissions) {
  log.info({
    function: "filterThirdPartyDataByPermission",
    userPermissions,
  });

  const allowedTypes = [];

  userPermissions.forEach((permission) => {
    if (permissionMapping[permission]) {
      allowedTypes.push(permissionMapping[permission]);
    }
  });

  log.info("allowedTypes****", allowedTypes);

  return data.filter((record) =>
    allowedTypes.includes(record.ThirdPartySoftwareType)
  );
}

/**
 * Fetches data from a specified MongoDB collection with optional filtering, projection, pagination, and manual joining.
 * This function does not use aggregation for joins but instead performs a secondary lookup using `find()`.
 *
 * @async
 * @function getDataFromCollection
 * @param {Object} params - Function parameters.
 * @param {string} params.collectionName - Name of the MongoDB collection to query.
 * @param {Object} [params.filters] - Query filters for MongoDB `find()`. Default is an empty object.
 * @param {string[]} [params.projection] - Fields to include in the result set.
 * @param {Object} [params.pagination] - Pagination and sorting options.
 * @param {Object} [params.pagination.sort] - Sort order for the results.
 * @param {number} [params.pagination.limit] - Maximum number of documents to return.
 * @param {number} [params.pagination.skip] - Number of documents to skip.
 * @param {boolean} [params.pagination.single] - Whether to return a single document (`true`) or an array (`false`).
 * @param {Object} [params.join] - Configuration for manual join operations.
 * @param {string} params.join.from - Name of the foreign collection to join with.
 * @param {string} params.join.localField - Field in the main collection that holds the reference.
 * @param {string} params.join.foreignField - Field in the foreign collection to match against `localField`.
 * @param {string} params.join.as - Field name to store the joined results in the output.
 * @param {boolean} [params.join.unwind=false] - If `true`, stores only the first matched document; otherwise, stores an array.
 * @param {string[]} [params.join.projection] - Fields to include from the joined collection.
 * @returns {Promise<Object[]|Object|null>} - Returns an array of matching documents or a single document if `single` is `true`.
 * @throws {Error} - Throws an error if the database query fails.
 */

async function getDataFromCollection({
  collectionName,
  filters,
  projection,
  pagination,
  join,
}) {
  try {
    log.info({
      function: "getDataFromCollection",
      params: { collectionName, filters, projection, pagination, join },
    });

    const db = await getDb();
    const collection = db.collection(collectionName);

    let query =
      filters && Object.keys(filters).length > 0 ? { ...filters } : {};
    let queryOptions = {};

    // Apply projection if provided
    if (Array.isArray(projection) && projection.length > 0) {
      queryOptions.projection = projection.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
    }

    // Extract pagination options
    const { sort, limit, skip, single } = pagination || {};

    let cursor = collection.find(query, queryOptions);

    // Apply sorting, pagination, and limit only if provided
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);

    let results = await cursor.toArray();

    // Handle Join Manually (Without Aggregation)
    if (join) {
      const {
        from,
        localField,
        foreignField,
        as,
        unwind,
        projection: joinProjection,
      } = join;
      const joinCollection = db.collection(from);

      for (let item of results) {
        if (!item[localField]) continue; // Skip if localField is missing

        let matchValues = Array.isArray(item[localField])
          ? item[localField]
          : [item[localField]];

        let joinQuery = { [foreignField]: { $in: matchValues } };

        let joinProjectionObj = joinProjection
          ? joinProjection.reduce((acc, field) => ({ ...acc, [field]: 1 }), {})
          : {};

        let joinedData = await joinCollection
          .find(joinQuery, { projection: joinProjectionObj })
          .toArray();

        if (unwind) {
          item[as] = joinedData.length > 0 ? joinedData[0] : null;
        } else {
          item[as] = joinedData;
        }
      }
    }

    return single ? results[0] || null : results;
  } catch (error) {
    log.error("error in getDataFromCollection ***", error);
    throw error;
  }
}

module.exports = {
  performManualSorting,
  getDataFromCollection,
  filterThirdPartyDataByPermission,
};
