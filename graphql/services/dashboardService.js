const _ = require("lodash");

const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();

const getFormattedDate = (transactionDate) => {
  const date = new Date(transactionDate);
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so add 1
  const day = String(date.getDate()).padStart(2, "0"); // Pad single digits with 0
  const year = date.getFullYear(); // Get the year
  return `${month}-${day}-${year}`; // Format MM-DD-YYYY
};

const dayWiseData = async (
  aggregatedData,
  firstDayRawData,
  thirtiethDayRawData
) => {
  try {
    const formatAndGroupData = (data) => {
      return _(data)
        .map((item) => ({
          _id: getFormattedDate(item.TransactionDate),
          count: _.get(item, "Print.TotalPages", 0),
        }))
        .groupBy("_id")
        .map((values, key) => ({
          _id: key,
          count: _.sumBy(values, "count"),
        }))
        .value();
    };

    // Format and group raw data from the find queries
    const firstDayData = formatAndGroupData(firstDayRawData);
    const thirtiethDayData = formatAndGroupData(thirtiethDayRawData);

    const formattedData = _(aggregatedData)
      .flatMap("Usage")
      .groupBy("TransactionDate")
      .map((values, key) => ({
        _id: key,
        count: _.sumBy(values, "TotalPages"),
      }))
      .value();

    const dayWiseData = _([
      ...firstDayData,
      ...thirtiethDayData,
      ...formattedData,
    ])
      .flatten()
      .groupBy("_id")
      .map((values, key) => ({
        date: key,
        count: _.sumBy(values, "count"),
      }))
      .value();

    dayWiseData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    return dayWiseData;
  } catch (error) {
    log.error("Error in dayWiseData***", error);
    throw new Error(error);
  }
};

const deliveryWiseData = async (
  aggregatedData,
  firstDayRawData,
  thirtiethDayRawData
) => {
  try {
    // Helper function to format and group data by delivery method
    const formatAndGroupData = (data) => {
      return _(data)
        .map((item) => ({
          _id: { key: _.get(item, "Print.JobDeliveryMethod", "") },
          count: _.get(item, "Print.TotalPages", 0),
        }))
        .groupBy("_id.key")
        .map((values, key) => ({
          _id: { key },
          count: _.sumBy(values, "count"),
        }))
        .value();
    };

    // Format and group raw data from the find queries
    const firstDayData = formatAndGroupData(firstDayRawData);
    const thirtiethDayData = formatAndGroupData(thirtiethDayRawData);

    // Process aggregatedData
    const aggregatedDeliveryTypes = _(aggregatedData)
      .flatMap("Usage")
      .groupBy("JobDeliveryMethod")
      .map((values, key) => ({
        _id: { key },
        count: _.sumBy(values, "TotalPages"),
      }))
      .value();

    // Combine and group all data
    const deliveryTypes = _([
      ...firstDayData,
      ...thirtiethDayData,
      ...aggregatedDeliveryTypes,
    ])
      .flatten()
      .groupBy("_id.key")
      .map((values, key) => ({
        _id: { key },
        count: _.sumBy(values, "count"),
      }))
      .value();

    // Transform grouped data into the final delivery-wise format
    const deliveryWiseData = {};

    deliveryTypes.forEach((data) => {
      if (!deliveryWiseData[data?._id?.key]) {
        deliveryWiseData[data?._id?.key] = [];
      }
      deliveryWiseData[data?._id?.key].push({
        count: data?.count,
      });
    });

    return deliveryWiseData;
  } catch (e) {
    log.error("Error in deliveryWiseData ***", e);
    throw new Error(e);
  }
};

const deliveryByDateWiseData = async (
  aggregatedData,
  firstDayRawData,
  thirtiethDayRawData
) => {
  try {
    const formatAndGroupDataByDate = (data) => {
      return _(data)
        .map((item) => ({
          _id: {
            key: _.get(item, "Print.JobDeliveryMethod", ""),
            date: getFormattedDate(item.TransactionDate),
          },
          page: _.get(item, "Print.TotalPages", 0),
        }))
        .groupBy((entry) => `${entry?._id?.key}_${entry?._id?.date}`)
        .map((values) => ({
          _id: {
            key: values?.[0]?._id?.key,
            date: values?.[0]?._id?.date,
          },
          page: _.sumBy(values, "page"),
        }))
        .value();
    };

    const firstDayData = formatAndGroupDataByDate(firstDayRawData);
    const thirtiethDayData = formatAndGroupDataByDate(thirtiethDayRawData);

    // Process aggregatedData
    const deliveryByDatesDataAggregated = aggregatedData
      .flatMap((entry) => entry.Usage)
      .reduce((acc, usage) => {
        const existing = acc.find(
          (item) =>
            item?._id?.key === usage?.JobDeliveryMethod &&
            item?._id?.date === usage?.TransactionDate
        );
        if (existing) {
          existing.page += usage.TotalPages;
        } else {
          acc.push({
            _id: {
              key: usage?.JobDeliveryMethod,
              date: usage?.TransactionDate,
            },
            page: usage?.TotalPages,
          });
        }
        return acc;
      }, []);

    // Combine and group all data
    const queryDeliveryByDatesData = [
      ...firstDayData,
      ...thirtiethDayData,
      ...deliveryByDatesDataAggregated,
    ].reduce((acc, curr) => {
      const existing = acc.find(
        (item) =>
          item?._id?.key === curr?._id?.key && item?._id?.date === curr?._id?.date
      );

      if (existing) {
        existing.count += curr.page;
      } else {
        acc.push({
          _id: { key: curr?._id?.key, date: curr?._id?.date },
          count: curr?.page,
        });
      }
      return acc;
    }, []);

    const deliveryByDateWiseData = {};

    queryDeliveryByDatesData.forEach((data) => {
      if (!deliveryByDateWiseData[data?._id?.key]) {
        deliveryByDateWiseData[data?._id?.key] = [];
      }
      deliveryByDateWiseData[data?._id?.key].push({
        date: data?._id?.date,
        count: data?.count,
      });
    });

    // Sort data by date for each delivery method
    Object.keys(deliveryByDateWiseData).forEach((key) => {
      if (deliveryByDateWiseData[key]) {
        deliveryByDateWiseData[key].sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        });
      }
    });

    return deliveryByDateWiseData;
  } catch (e) {
    log.error("Error in deliveryByDateWiseData ***", e);
    throw new Error(e);
  }
};

module.exports = {
  dayWiseData,
  deliveryWiseData,
  deliveryByDateWiseData,
};
