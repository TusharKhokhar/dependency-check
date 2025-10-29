const _ = require('lodash');
const moment = require('moment');
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const { parsePrimitive, convertFilterTime } = require('../helpers/helpers');
const { usageData } = require('../helpers/xlsColumns');
const { format, utcToZonedTime } = require("date-fns-tz");
const { Parser } = require("json2csv");

module.exports = {
    executiveReports: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {};
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.locationIds && filters.locationIds.length > 0) {
            filters.locationIds = filters.locationIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {LocationID: {"$in": filters.locationIds}})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            Object.assign(condition, {'Type': {$in: filters.transactionType}})
        } else {
            Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.submissionType && filters.submissionType.length > 0) {
            Object.assign(condition, {'Print.JobDeliveryMethod': {"$in": filters.submissionType}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
            Object.assign(condition, {'Print.ColorType': {"$in": filters.colorType}})
        }

        if (filters.printType && filters.printType.length > 0) {
            Object.assign(condition, {'Print.DocumentType': {"$in": filters.printType}})
        }

        if (filters.orientation && filters.orientation.length > 0) {
            Object.assign(condition, {'Print.Orientation': {"$in": filters.orientation}})
        }

        if (filters.staple !== null && filters.staple !== undefined) {
          const stapleValue = filters.staple
            ? { $nin: ["None", null] }
            : { $in: ["None", null] };
          Object.assign(condition, { "Print.Staple": stapleValue });
        }
        if (filters.duplex !== null && filters.duplex !== undefined) {
          Object.assign(condition, { "Print.Duplex": filters.duplex });
        }

        if (filters.paperSize && filters.paperSize.length > 0) {
          Object.assign(condition, {"Print.PaperSize": { $in: filters.paperSize }});
        }
        console.log("condition ==>",JSON.stringify(condition));
        console.log("condition ==>",condition);
        const usages = await usageCollection
          .find(condition, {
            projection: {
              "Print.TotalPages": 1,
              "Print.DeviceID": 1,
              "Print.ReleaseCode": 1,
              "Print.JobID": 1,
              "Print.ColorType": 1,
              "Print.Duplex": 1,
              "Print.JobDeliveryMethod": 1,
              "Print.Device": 1,
              "Print.Orientation": 1,
              "Print.Staple": 1,
              "Print.PaperSize": 1,
              _id: 0,
            },
          })
          .toArray();
      
        const result = {
          generalStatistics: _.reduce(
            usages,
            (acc, item) => {
              acc.TotalPages += (item.Print?.TotalPages ?? 0);
              acc.ActivePrinters.add(item.Print?.DeviceID?.toString() ?? null);
              acc.TotalJobs++;
              acc.count++;
              return acc;
            },
            {
              _id: false,
              TotalPages: 0,
              ActivePrinters: new Set(),
              TotalJobs: 0,
              count: 0,
            }
          ),

          totalJobs: _.map(_.groupBy(usages, "Print.JobID"), (items, key) => ({
            _id: { key: parsePrimitive(key) },
          })),

          colorComposition: _.chain(usages)
            .groupBy("Print.ColorType")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),

          duplexComposition: _.chain(usages)
            .groupBy("Print.Duplex")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),

          jobSubmissionComposition: _.chain(usages)
            .groupBy("Print.JobDeliveryMethod")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),

          printers: _.chain(usages)
            .groupBy("Print.Device")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .orderBy("page", "desc")
            .take(10)
            .value(),

          orientationComposition: _.chain(usages)
            .groupBy("Print.Orientation")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),

          stapleComposition: _.chain(usages)
            .groupBy("Print.Staple")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),

          paperSizeComposition: _.chain(usages)
            .groupBy("Print.PaperSize")
            .map((items, key) => ({
              _id: { key: parsePrimitive(key) },
              page: _.sumBy(items, "Print.TotalPages") ?? 0,
            }))
            .sortBy("_id.key")
            .value(),
        };
        
        result.generalStatistics.ActivePrinters = Array.from(result.generalStatistics.ActivePrinters);
    
        if(result.generalStatistics.count > 0) {
            result.generalStatistics = [result.generalStatistics];
        } else {
            result.generalStatistics = []
        }    
        console.log("result ==>",JSON.stringify(result));
        
        return [result];
    },

    chartReports: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {}
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            Object.assign(condition, {'Type': {$in: filters.transactionType}})
        } else {
            Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        if (filters.locationIds && filters.locationIds.length > 0) {
            filters.locationIds = filters.locationIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {LocationID: {"$in": filters.locationIds}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.submissionType && filters.submissionType.length > 0) {
            Object.assign(condition, {'Print.JobDeliveryMethod': {"$in": filters.submissionType}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
             let obj = []
            Object.assign(condition, {'Print.ColorType': {$in: filters.colorType}})
            console.log(obj);
        }
        if (filters.printType && filters.printType.length > 0) {
            Object.assign(condition, {'Print.DocumentType': {"$in": filters.printType}})
        }

        if (filters.orientation && filters.orientation.length > 0) {
            Object.assign(condition, {'Print.Orientation': {"$in": filters.orientation}})
        }

        if (filters.staple !== null && filters.staple !== undefined) {
          const stapleValue = filters.staple
            ? { $nin: ["None", null] }
            : { $in: ["None", null] };
          Object.assign(condition, { "Print.Staple": stapleValue });
        }
        if (filters.duplex !== null && filters.duplex !== undefined) {
            Object.assign(condition, { "Print.Duplex": filters.duplex });
        }
  
        if (filters.paperSize && filters.paperSize.length > 0) {
          Object.assign(condition, {"Print.PaperSize": { $in: filters.paperSize }});
        }

        console.log('filters: ',condition);

        const usages = await usageCollection
          .find(condition)
          .project({
            TransactionDate: 1,
            "Print.TotalPages": 1,
          })
          .toArray();

        const result = {
          generalStatistics: _.chain(usages)
            .groupBy((transaction) =>
              moment.utc(transaction.TransactionDate).format("MMM DD, YYYY")
            )
            .map((group, date) => ({
              _id: date,
              count: _.sumBy(group, "Print.TotalPages"),
              dateObject: moment.utc(date, "MMM DD, YYYY").toDate(),
            }))
            .sortBy("dateObject")
            .value(),

          totalJobs: _.chain(usages)
            .reduce((acc, item) => {
              const hour = moment.utc(item.TransactionDate).hour();
              if (!acc[hour]) {
                acc[hour] = 0;
              }
              acc[hour] += (item.Print?.TotalPages ?? 0);
              return acc;
            }, {})
            .map((value, key) => ({
              _id: { hour: parseInt(key) },
              count : value,
            }))
            .sortBy("_id.hour")
            .value(),
        };
        return [result];
    },

    printUsageReport: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {}
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            Object.assign(condition, {'Type': {$in: filters.transactionType}})
        } else {
            Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        if (filters.locationIds && filters.locationIds.length > 0) {
            filters.locationIds = filters.locationIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {LocationID: {"$in": filters.locationIds}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = await filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.submissionType && filters.submissionType.length > 0) {
            Object.assign(condition, {'Print.JobDeliveryMethod': {"$in": filters.submissionType}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
            Object.assign(condition, {'Print.ColorType': {"$in": filters.colorType}})
        }
        if (filters.printType && filters.printType.length > 0) {
            Object.assign(condition, {'Print.DocumentType': {"$in": filters.printType}})
        }

        if (filters.orientation && filters.orientation.length > 0) {
            Object.assign(condition, {'Print.Orientation': {"$in": filters.orientation}})
        }
        if (filters.staple !== null && filters.staple !== undefined) {
          const stapleValue = filters.staple
            ? { $nin: ["None", null] }
            : { $in: ["None", null] };
          Object.assign(condition, { "Print.Staple": stapleValue });
        }
        if (filters.duplex !== null && filters.duplex !== undefined) {
            Object.assign(condition, { "Print.Duplex": filters.duplex });
        }
  
        if (filters.paperSize && filters.paperSize.length > 0) {
          Object.assign(condition, {"Print.PaperSize": { $in: filters.paperSize }});
        }

        let query = [
            {
                $match: condition
            },
            {
                $group: {
                    _id: {"Device": "$Print.Device", "CustomerID": "$CustomerID"},
                    ColorPages:  {$sum: {$multiply: ['$Print.Copies', '$Print.ColorPages']}},
                    GrayScalePages:  {$sum: {$multiply: ['$Print.Copies', '$Print.GrayscalePages']}},
                    DuplexPages: {
                        '$sum': {
                            '$cond': [
                                {$eq: ['$Print.Duplex', true]},
                                1,
                                0
                            ]
                        }
                    },
                    TotalPrintedPages: {$sum: '$Print.TotalPages'},
                    Jobs: {$push: "$Print.ReleaseCode"},
                    Costs: {$sum: '$Print.TotalCost'}
                }
            },
            {
                $group: {
                    _id: {CustomerID: "$_id.CustomerID"},
                    usages: {$push: '$$ROOT'}
                }
            },
        ]

        const printerReportData = await usageCollection.aggregate(query).toArray();
        for (const reportData of printerReportData) {
          reportData?.usages?.sort((a, b) => {
            const nameA = a?._id?.Device?.toLowerCase() || "";
            const nameB = b?._id?.Device?.toLowerCase() || "";
            return nameA?.localeCompare(nameB);
          });
        }
        return printerReportData;

    },

    transactionReport: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {}
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            Object.assign(condition, {'Type': {$in: filters.transactionType}})
        } else {
            Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        if (filters.locationIds && filters.locationIds.length > 0) {
            filters.locationIds = filters.locationIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {LocationID: {"$in": filters.locationIds}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = await filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.submissionType && filters.submissionType.length > 0) {
            Object.assign(condition, {'Print.JobDeliveryMethod': {"$in": filters.submissionType}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
            Object.assign(condition, {'Print.ColorType': {"$in": filters.colorType}})
        }
        let query = [
            {
                $match: condition
            },
            {
                $group: {
                    _id: {
                        CustomerID: "$CustomerID", PaymentType: "$Print.PaymentType", JobDeliveryMethod: "$Print.JobDeliveryMethod", Color: "$Print.ColorType"
                    },
                    "ColorPages": {$sum: "$Print.ColorPages"},
                    "GrayscalePages": {$sum: "$Print.GrayscalePages"},
                    "TotalCost": {$sum: "$Print.TotalCost"},
                    "TotalPages": {$sum: "$Print.TotalPages"}
                }
            },
            {
                $group: {
                    _id: {PaymentType: "$_id.PaymentType", CustomerID: "$_id.CustomerID"},
                    data: {$push: "$$ROOT"}
                }
            },
            {
                $sort: {
                  "_id.PaymentType": 1,
                }
            },
            {
                $group: {
                    _id: {CustomerID: "$_id.CustomerID"},
                    TransactionTypes: {$push: "$$ROOT"}

                }
            }
        ]
        return await usageCollection.aggregate(query).toArray()
    },

    transactionSummary: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {}
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = await filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            Object.assign(condition, {'Type': {$in: filters.transactionType}})
        } else {
            Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        if (filters.paymentType && filters.paymentType.length > 0) {
            Object.assign(condition, {'Print.PaymentType': {"$in": filters.paymentType}})
        }
        if (filters.submissionType && filters.submissionType.length > 0) {
            Object.assign(condition, {'Print.JobDeliveryMethod': {"$in": filters.submissionType}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
            Object.assign(condition, {'Print.ColorType': {"$in": filters.colorType}})
        }
        if (filters.printType && filters.printType.length > 0) {
            Object.assign(condition, {'Print.DocumentType': {"$in": filters.printType}})
        }
        if (filters.orientation && filters.orientation.length > 0) {
            Object.assign(condition, {'Print.Orientation': {"$in": filters.orientation}})
        }
        if (filters.staple !== null && filters.staple !== undefined) {
          const stapleValue = filters.staple
            ? { $nin: ["None", null] }
            : { $in: ["None", null] };
          Object.assign(condition, { "Print.Staple": stapleValue });
        }
        if (filters.duplex !== null && filters.duplex !== undefined) {
            Object.assign(condition, { "Print.Duplex": filters.duplex });
        }
  
        if (filters.paperSize && filters.paperSize.length > 0) {
          Object.assign(condition, {"Print.PaperSize": { $in: filters.paperSize }});
        }

        let query = [
            {
                $match: condition
            },
            {
                $group: {

                    _id: {
                        ThingID: "$ThingID", ThingName : "$Thing", "CustomerID": "$CustomerID",
                        "PaymentType": { $toLower: "$Print.PaymentType"},"TransactionType": "$Print.JobType"
                    },
                    "TotalAmount": {$sum: "$Print.TotalCost" },
                    PageCount: {$sum: "$Print.TotalPages"}
                }
            },
            {
              $sort: {
                "_id.TransactionType": 1,
                "_id.PaymentType": 1
              }
            },
            {
                $group: {
                    _id: {
                        ThingID: "$_id.ThingID", ThingName : "$_id.ThingName", "CustomerID": "$_id.CustomerID", "TransactionType": "$_id.TransactionType"
                    },
                    "data": {$push: "$$ROOT" }
                }
            },
            {
                $group: {
                    _id: {
                        ThingID: "$_id.ThingID", ThingName : "$_id.ThingName", "CustomerID": "$_id.CustomerID"
                    },
                    "TransactionTypes": {$push: "$$ROOT" }
                }
            },
            {
                $group: {
                    _id: {
                        "CustomerID": "$_id.CustomerID"
                    },
                    "Things": {$push: "$$ROOT" }
                }
            }
        ]
        return await usageCollection.aggregate(query).toArray()
    },

    addValueSummary: async (db, filters) => {
        let usageCollection = db.collection('Usage')
        let condition = {Type: 'add_value'}
        if (filters?.isDeleted !==  undefined && (filters?.isDeleted === false || filters?.isDeleted === true)) {
            Object.assign(condition, { "IsDeleted": filters.isDeleted });
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = await filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.valueAddedMethod && filters.valueAddedMethod.length > 0) {
            Object.assign(condition, {"AddValue.ValueAddedMethod": {"$in": filters.valueAddedMethod}})
        }
        let query = [
            {
                $match: condition
            },
            {
                $group: {
                    _id: {CustomerID: "$CustomerID", "Username": "$Username", UserID: "$UserID", ValueAddedMethod: "$AddValue.ValueAddedMethod"},
                    Amount: {$sum: "$AddValue.AddValueAmount"},
                    PaymentType: { $first: "$AddValue.ValueAddedMethod" }
                }
            },
            {
            $sort: {
                "_id.Username": 1
              }
            },
            {
                $group: {
                    _id: "$_id.CustomerID",
                    users: { $push: '$$ROOT' }
                }
            }
        ]
        return await usageCollection.aggregate(query).toArray()
    },

    csvReports: async(db, filters) => {
      let {
        submissionType,
        timezone,
        colorType,
        transactionType,
        orientation,
        staple,
        paperSize,
        duplex,
        customerIds,
        locationIds,
        documentType,
        dateFrom: startDate,
        dateTo: endDate,
      } = filters;
      const { dateFrom, dateTo } = await convertFilterTime(
        startDate,
        endDate,
        timezone,
      );
      const condition = {
        TransactionDate: { $gte: dateFrom, $lte: dateTo },
      };      
      if (Array.isArray(customerIds) && customerIds.length > 0) {
        const objectIds = customerIds.map((cus) =>
          ObjectId.createFromHexString(cus)
        );
        Object.assign(condition, { CustomerID: { $in: objectIds } });
      }
      if (locationIds && locationIds.length > 0) {
        const locationObjectIds = locationIds.map((loc) =>
          ObjectId.createFromHexString(loc)
        );
        Object.assign(condition, { LocationID: { $in: locationObjectIds } });
      }
      if (submissionType && submissionType.length > 0) {
        Object.assign(condition, {
          "Print.JobDeliveryMethod": { $in: submissionType },
        });
      }
      if (colorType && colorType.length > 0) {
        Object.assign(condition, { "Print.ColorType": { $in: colorType } });
      }
      if (documentType && documentType.length > 0) {
        Object.assign(condition, {
          "Print.DocumentType": { $in: documentType },
        });
      }
      if (orientation && orientation.length > 0) {
        Object.assign(condition, {
          "Print.Orientation": { $in: orientation },
        });
      }
      if (staple !== null && staple !== undefined) {
        const stapleValue = staple
          ? { $nin: ["None", null] }
          : { $in: ["None", null] };
        Object.assign(condition, { "Print.Staple": stapleValue });
      }
      if (duplex !== null && duplex !== undefined) {
        Object.assign(condition, { "Print.Duplex": duplex });
      }
      if (paperSize && paperSize.length > 0) {
        Object.assign(condition, {
          "Print.PaperSize": { $in: paperSize },
        });
      }
      if (transactionType && transactionType.length > 0) {
        transactionType = transactionType.map((tran) => tran.toLowerCase());
        Object.assign(condition, { Type: { $in: transactionType } });
      } else {
        Object.assign(condition, {
          Type: { $nin: ["add_value", "deduct_value"] },
        });
      }
      const projection = {
        TransactionDate: 1,
        TransactionStartTime: 1,
        TransactionEndTime: 1,
        Print: 1,
        UserType: 1,
        Customer: 1,
        Location: 1,
        Thing: 1,
        Type: 1,
        BillingAccountId: 1,
        BillingAccountName: 1,
        CurrencyCode: 1
      };
      const finalReport = [];
      const collection = db.collection("Usage");
      const totalCount = await collection.countDocuments(condition);

      let batchSize = 1000;
      if (totalCount > 1000) {
        batchSize = Math.ceil(totalCount / 10);
        if (batchSize > 5000) batchSize = 5000;
      }

      for (let skip = 0; skip < totalCount; skip += batchSize) {
        const csvReports = await collection
          .find(condition, { projection })
          .sort({ TransactionDate: 1, TransactionStartTime: 1 })
          .skip(skip)
          .limit(batchSize)
          // .toArray();
        for await (const data of csvReports) {
          const cleanPrint = data.Print ? { ...data.Print } : null;
          if (cleanPrint?.PrintJobSubmitted) {
            cleanPrint.PrintJobSubmitted = format(
              utcToZonedTime(cleanPrint.PrintJobSubmitted, timezone),
              "MM/dd/yyyy hh:mm:ss aaa"
            );
            cleanPrint.Staple = cleanPrint.Staple ? cleanPrint.Staple : "None";
          }
          const row = {
            TransactionDate: data.TransactionDate
              ? format(
                  utcToZonedTime(data.TransactionDate, timezone),
                  "MM/dd/yyyy hh:mm:ss aaa"
                )
              : "",
            TransactionStartTime: data.TransactionStartTime
              ? format(
                  utcToZonedTime(data.TransactionStartTime, timezone),
                  "MM/dd/yyyy hh:mm:ss aaa"
                )
              : "",
            TransactionEndTime: data.TransactionEndTime
              ? format(
                  utcToZonedTime(data.TransactionEndTime, timezone),
                  "MM/dd/yyyy hh:mm:ss aaa"
                )
              : "",
            UserType: data.UserType || "",
            Staple: data.Print?.Staple || "None",
            Customer: data.Customer || "",
            Location: data.Location || "",
            Thing: data.Thing || "",
            Type: data.Type || "",
            BillingAccountId: data.BillingAccountId || "",
            BillingAccountName: data.BillingAccountName || "",
            CurrencyCode: data.CurrencyCode || "",
            Print: cleanPrint,
          };
          finalReport.push(row);
        }
      }
      const json2csvParser = new Parser({ fields: usageData, del: "," });
      const finalCsvData = json2csvParser.parse(finalReport);
      return  Buffer.from(finalCsvData).toString('base64') 
    }
}
