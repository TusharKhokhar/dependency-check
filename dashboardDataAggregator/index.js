const { getDb } = require("./config/db");

module.exports.handler = async () => {
  try {
    console.log("EXECUTION STARTED: dashboardDataAggregator");
    const db = await getDb();
    const customersList = await db
      .collection("Customers")
      .find({ Tier: "standard" })
      .project({ _id: 1, DomainName: 1 })
      .toArray();

    const date = new Date();
    const nowUtc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const dateFrom = new Date(
      new Date(nowUtc).getTime() - 24 * 28 * 60 * 60 * 1000
    ); // 28 Days
    const dateTo = new Date(new Date(nowUtc).getTime() - 24 * 60 * 60 * 1000);

    const condition = {
      TransactionDate: { $gte: dateFrom, $lte: dateTo },
      Type: "print",
    };

    console.log(condition);

    for (const customer of customersList) {
      console.log("CustomerID **", customer._id);
      const query = [
        {
          $match: { ...condition, CustomerID: customer._id },
        },
        {
          $project: {
            "Print.JobDeliveryMethod": 1,
            "Print.TotalPages": 1,
            TransactionDate: 1,
          },
        },
        {
          $group: {
            _id: {
              JobDeliveryMethod: "$Print.JobDeliveryMethod",
              TransactionDate: {
                $dateToString: { format: "%m-%d-%Y", date: "$TransactionDate" },
              },
            },
            count: { $sum: "$Print.TotalPages" },
          },
        },
        {
          $sort: { "_id.TransactionDate": 1 },
        },
      ];
      const result = await db.collection("Usage").aggregate(query).toArray();

      const aggregatedData = {
        CustomerID: customer._id,
        OrgID: customer.DomainName,
        UpdatedAt: new Date(nowUtc),
        PeriodStartDate: dateFrom,
        PeriodEndDate: dateTo,
        Usage: result.map((item) => {
          return {
            TransactionDate: item._id.TransactionDate, // Date in UTC
            JobDeliveryMethod: item._id.JobDeliveryMethod,
            TotalPages: item.count,
          };
        }),
      };

      const aggregatedDashboardUsageData = await db
        .collection("AggregatedDashboardUsage")
        .findOne({ CustomerID: customer?._id });

      if (aggregatedDashboardUsageData) {
        await db.collection("AggregatedDashboardUsage").updateOne(
          { CustomerID: customer?._id },
          {
            $set: {
              Usage: aggregatedData?.Usage,
              UpdatedAt: new Date(nowUtc),
              PeriodStartDate: dateFrom,
              PeriodEndDate: dateTo,
            },
          }
        );
      } else {
        await db
          .collection("AggregatedDashboardUsage")
          .insertOne(aggregatedData);
      }
    }
    console.log("** dashboardDataAggregator PROCESS COMPLETED **");
  } catch (error) {
    console.log("Error in dashboardDataAggregator **", error);
  }
};