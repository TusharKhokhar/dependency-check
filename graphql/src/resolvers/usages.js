const { GraphQLError } = require('graphql')
const { USAGE_NOT_FOUND } = require('../../helpers/error-messages')
const PublicUploads = require('../../models/publicUploads')
const { fromZonedTime, format, toZonedTime } = require('date-fns-tz')
const { subDays } = require('date-fns')
const { Parser } = require('json2csv')
const { usageData } = require('../../helpers/xlsColumns')
const { formObjectIds, addCreateTimeStamp, getDatabase, getDatabaseOneCustomer, getDatabaseCurrentLogin,
  verifyUserAccess, verifyKioskAndUserAccess, getDatabaseForGetAllAPI, capitalCaseValues, validateInputUsage,
  getUtcTime, utcDateGet
} = require('../../helpers/util')
const { Usages, PublicUploadsCollection, Customers, JobLists, CustomizationTexts, AggregatedDashboardUsage, Protons,
  Locations
} = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {customerSecurity} = require("../../utils/validation");
const model = require("../../models");
const {deductBalanceFromUsersAccount} = require("../../services/deductBalance");
const CustomLogger = require("../../helpers/customLogger");
const { dayWiseData, deliveryWiseData, deliveryByDateWiseData } = require('../../services/dashboardService')
const log = new CustomLogger()
const _ = require("lodash");
const { fetchUsages } = require('../../services/usages')
const {getProtonToken, sendTransaction} = require("../../services/protonService");
const {performDecryption} = require("../../services/authProviders/edService");
const {decryptText} = require("../../helpers/encryptDecrypt");

module.exports = {
  Mutation: {
    async addUsage (_, { addUsageInput }, context, info) {
      log.lambdaSetup(context, 'usages', 'addUsage')
      const {
        Type,
        TransactionDate,
        TransactionStartTime,
        TransactionEndTime,
        TransactionID,
        TimeZone,
        Customer,
        CustomerID,
        Location,
        LocationID,
        Area,
        AreaID,
        Thing,
        ThingID,
        UserType,
        Group,
        GroupID,
        BarcodeNumber,
        FullName,
        EmailAddress,
        Balance,
        Booking,
        Print,
        AddValue,
        FinePayment,
        Username,
        ReleaseCode,
        Fax,
        DeductBalance,
        BillingAccountId,
        BillingAccountName,
        CurrencyCode,
        IsDeleted = false
      } = addUsageInput
      let newUsage = {
        Type,
        TransactionDate,
        TransactionStartTime,
        TransactionEndTime,
        TransactionID,
        TimeZone,
        Customer,
        CustomerID,
        Location,
        LocationID,
        Area,
        AreaID,
        Thing,
        ThingID,
        UserType,
        Group,
        GroupID,
        BarcodeNumber,
        FullName,
        EmailAddress,
        Balance,
        Booking,
        Print,
        AddValue,
        FinePayment,
        Username,
        ReleaseCode,
        Fax,
        BillingAccountName,
        BillingAccountId,
        CurrencyCode,
        IsDeleted,
        DeductBalance
      }
      if(Print.DeviceID){
        Print.DeviceID = ObjectId.createFromHexString(Print.DeviceID)
      }
      log.info(newUsage)
      newUsage = formObjectIds(newUsage)
      newUsage.IsActive = true;
      newUsage = addCreateTimeStamp(newUsage)
      newUsage = capitalCaseValues(newUsage)
      newUsage = validateInputUsage(newUsage)
      log.info('Transaction Data modified', newUsage)
      context.data.isKiosk  ? verifyKioskAndUserAccess(context, newUsage.CustomerID) : verifyUserAccess(context, newUsage.CustomerID)
      const db = await getDatabaseOneCustomer(context, CustomerID)
      const publicUploadCollection = db.collection(PublicUploadsCollection)
      const jobListCollection = db.collection(JobLists)
      const customizationTextCollection = db.collection(CustomizationTexts)
      const locationCollection = db.collection(Locations)
      const jobListData = await jobListCollection.findOne({CustomerID: ObjectId.createFromHexString(CustomerID)})
      const customizationTextData = await customizationTextCollection.findOne({CustomerID: ObjectId.createFromHexString(CustomerID)}, {GlobalDecimalSetting: 1})
      const deleteJobOrNot = jobListData?.DeleteJobAfterPrint
      try {
        if (Print.DocumentName) {
          const splitDoc = Print.DocumentName.split('.')
          Print.DocumentType = splitDoc ? splitDoc[splitDoc.length - 1] : 'unknown'
        }
            if (Print.PaymentType && Print.PaymentType.toLowerCase() !== 'free' &&
                Print.PaymentType.toLowerCase() !== 'multi' &&
              Print.PaymentType.toLowerCase() !== 'cash' &&
              Print.PaymentType.toLowerCase() !== 'cbord' &&
              Print.PaymentType.toLowerCase() !== 'credit card' &&
              Print.PaymentType.toLowerCase() !== 'creditcard'
            ){
              //deduct balance
              let response = await deductBalanceFromUsersAccount(newUsage, db, customizationTextData)
              if(response.statusCode){
                newUsage.DeductBalance = response.deductInfo
              } else {
                throw  new Error(response.message)
              }
            } else if (Print.PaymentType && Print.PaymentType.toLowerCase() !== 'free' &&
                Print.PaymentType.toLowerCase() === 'multi'){
              //deduct balance
              let actualCost = newUsage.Print.TotalCost
              // this is to over ride the cost to be deducted from account balances
              newUsage.Print.TotalCost = newUsage?.Print?.PaymentBy?.Account
              let response = await deductBalanceFromUsersAccount(newUsage, db, customizationTextData)
              newUsage.Print.TotalCost = actualCost
              if(response.statusCode){
                newUsage.DeductBalance = response.deductInfo
              } else {
                throw  new Error(response.message)
              }
            } else {
              newUsage.DeductBalance = []
            }
        if (Print.ReleaseCode) {
          await PublicUploads.updateReleaseCode(Print.ReleaseCode, db, publicUploadCollection)
        }
        if (Print.SystemFileName) {
          const record = await PublicUploads.updateFilePrintHistory(Print.ReleaseCode, Print.SystemFileName, db, publicUploadCollection, deleteJobOrNot)
          log.info(record);
          newUsage = await updateTheDeviceIfRequired(record, newUsage, db)
          log.info(newUsage);
        }
        if (Print?.ReleaseCode && (!Print?.Orientation || Print?.Orientation.toLowerCase() === "assaved")) {
          newUsage = await assignDefaultOrientation(
            newUsage,
            CustomerID,
            publicUploadCollection,
            Print
          );
        }
        const { insertedId } = await db.collection(Usages).insertOne(newUsage)
        newUsage._id = insertedId
        const locationDetails = await locationCollection.findOne({ _id: ObjectId.createFromHexString(newUsage.LocationID) })
        const jobId = await sendTransactionToProtonServer(newUsage, db, locationDetails)
        await addValueDeductRecord(db, newUsage)
        const usageResponse =  await db.collection(Usages).findOne({ _id: insertedId })
        if (jobId) {
          Object.assign(usageResponse, {
            ThirdPartyTrackID: jobId,
          })
        }
        return usageResponse
      } catch (error) {
        log.error(error)
        throw new Error(error)
      }
    }
  },

  Query: {
    async getUsages (_, { paginationInput, customerIds, filters }, context) {
      log.lambdaSetup(context, 'usages', 'getUsages')
      let {
        pageNumber,
        limit,
        sort,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      return await fetchUsages({
        paginationInput,
        customerIds,
        filters,
        context,
        useUserNameFilter: false,
      });
    },

    async getUsage (_, { usageId, customerId }, context) {
      log.lambdaSetup(context, 'usages', 'getUsage')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const usage = await db.collection(Usages).findOne({ _id: ObjectId.createFromHexString(usageId) })
        if (usage) {
          return usage
        } else {
          throw new GraphQLError(USAGE_NOT_FOUND, {
            extensions: {
              code: '401'
            }
          })
        }
      } catch (err) {
        throw new Error(err)
      }
    },

    async dashboard (_, { timeZone }, context, info) {
      log.lambdaSetup(context, 'usages', 'dashboard')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const db = await getDatabaseCurrentLogin(context)
        const query = {}
        if (context.data && context.data.customerIdsFilter && context.data.customerIdsFilter.length > 0) {
          Object.assign(query, { CustomerID: { $in: context.data.customerIdsFilter } })
        }
        const dashboardReports = {}
        const aggregatedData = await db.collection(AggregatedDashboardUsage).find(query).toArray()

        const periodStartDate = aggregatedData?.[0]?.PeriodStartDate
        const periodEndDate = aggregatedData?.[0]?.PeriodEndDate

        log.info("periodStartDate===", periodStartDate);
        log.info("periodEndDate===", periodEndDate);
        
        const currentUTCDate = utcDateGet();

        log.info("currentUTCDate===", currentUTCDate)
        const currentLocalDate = toZonedTime(currentUTCDate, timeZone)
        const localStartDate = subDays(currentLocalDate, 29) // 30 days including today

        const firstDay = {
          dateFrom: fromZonedTime(localStartDate, timeZone),
          dateTo: periodStartDate
        }
        const thirtiethDay = {
          dateFrom: periodEndDate,
          dateTo: fromZonedTime(currentLocalDate, timeZone)
        }

        log.info({ firstDay, thirtiethDay });

        const firstDayCondition = createDashboardQueryCondition(
          firstDay,
          context?.data?.customerIdsFilter
        );
        
        const thirtiethDayCondition = createDashboardQueryCondition(
          thirtiethDay,
          context?.data?.customerIdsFilter
        );
        
        log.info({
          message: "*** condition ***",
          firstDayCondition,
          thirtiethDayCondition,
        });
    
        const collection = await db.collection(Usages);

        log.info("query START ===", Date.now())
        
        const [firstDayRawData, thirtiethDayRawData] = await Promise.all([
          collection.find(firstDayCondition)
          .project({ _id: 1, TransactionDate: 1, "Print.TotalPages": 1, "Print.JobDeliveryMethod": 1 })
          .toArray(),
          collection.find(thirtiethDayCondition)
          .project({ _id: 1, TransactionDate: 1, "Print.TotalPages": 1, "Print.JobDeliveryMethod": 1 })
          .toArray(),
        ]);

        log.info("query END ===****", Date.now())

        const [
          finalDayWiseData,
          finalDeliveryWiseData,
          finalDeliveryByDateWiseData,
        ] = await Promise.all([
          dayWiseData(aggregatedData, firstDayRawData, thirtiethDayRawData),
          deliveryWiseData(
            aggregatedData,
            firstDayRawData,
            thirtiethDayRawData
          ),
          deliveryByDateWiseData(
            aggregatedData,
            firstDayRawData,
            thirtiethDayRawData
          ),
        ]);
        dashboardReports.DayWiseData = [...finalDayWiseData]
        dashboardReports.DeliveryWiseData = finalDeliveryWiseData
        dashboardReports.DeliveryByDateWiseData = finalDeliveryByDateWiseData
        return dashboardReports
      } catch (e) {
        log.error("Error in dashboard", e)
        throw new Error(e)
      }
    },

    async userPortalDashboard (_, { timeZone }, context, info) {
      log.lambdaSetup(context, 'users', 'addUser')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        const date = new Date()
        const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
            date.getUTCDate(), date.getUTCHours(),
            date.getUTCMinutes(), date.getUTCSeconds())
        const dateFrom = new Date(new Date(nowUtc).getTime() - ((24 * 29) * 60 * 60 * 1000))
        let userName = context.data.user.Username
        const filters = await convertFilterTime(dateFrom, nowUtc, timeZone, true)
        log.info(context.data.user.CustomerID);
        const condition = {
          Type: 'print', TransactionDate: { $gte: filters.dateFrom, $lte: filters.dateTo },
          Username: userName, CustomerID: context.data.user.CustomerID
        }
        // query to fetch data for last 30 days
        const query = [
          {
            $match: condition
          },
          {
            $group: {
              _id:
                  { $dateToString: { format: '%m-%d-%Y', date: '$TransactionDate' } },
              count: { $sum: '$Print.TotalPages' }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ]
        const queryPrintJobs = [
          {
            $match: condition
          },
          {
            $group: {
              _id: { key: '$Username' },
              jobs: { $sum: 1 }
            }
          },
          {
            $project: {
              Username: '$_id.key',
              Jobs: '$jobs'
            }
          }
        ]
        const queryPrintPages = [
          {
            $match: condition
          },
          {
            $group: {
              _id: { key: '$Username' },
              page: { $sum: '$Print.TotalPages' }
            }
          },
          {
            $project: {
              Username: '$_id.key',
              Page: '$page'
            }
          }
        ]
        const db = await getDatabaseCurrentLogin(context)
        const collection = db.collection(Usages)
        const dashboardReports = {}
        const dayWiseData = await collection.aggregate(query).toArray()
        const queryPrintJobsRes = await collection.aggregate(queryPrintJobs).toArray()
        const queryPrintPagesRes = await collection.aggregate(queryPrintPages).toArray()
        log.info(context.data.user.Username);
        let balance = context.data.user.DebitBalance ? context.data.user.DebitBalance : 0
        let quotaBalance = context.data.user.GroupQuotas ?
            context.data.user.GroupQuotas.map(group => group.QuotaBalance) : []
        let groupIdUserList = context.data.user.GroupQuotas ?
            context.data.user.GroupQuotas.map(group => group.GroupID) : []
        let groupIdList = context.data.user.GroupID ?
            context.data.user.GroupID.map(group => ObjectId.createFromHexString(group)) : []
        quotaBalance = await quotaBalance.reduce((partialSum, a) => partialSum + a, 0);
        let accountInfo = []
        let groupIds = await db.collection('Groups').find({_id: {$in: groupIdUserList}}).toArray()
        let permGroup = await db.collection('Groups').findOne({_id: {$in: groupIdList}, GroupType: 'Permissions'})
        let debitBalancePriority = permGroup && permGroup.DebitBalancePriority ? permGroup.DebitBalancePriority : 0
        permGroup = permGroup && permGroup.AssociatedQuotaBalance ? permGroup.AssociatedQuotaBalance.map(gr => gr.toString()) : []
        let groupSeq = groupIds ? await groupIds.map(gr => gr._id.toString())  : []
        await context.data.user.GroupQuotas && context.data.user.GroupQuotas.forEach(gr => {
          let gro = groupIds[groupSeq.indexOf(gr.GroupID.toString())]
          accountInfo.push({AccountName: gro.GroupName, Balance: gr.QuotaBalance, Priority: permGroup.indexOf(gro._id.toString())})
        })
        log.info(accountInfo);
        accountInfo = accountInfo.length > 0 ? accountInfo.sort((a, b) => {
          return a.Priority - b.Priority;
        }) : []
        accountInfo.length > 0  ? accountInfo.splice(debitBalancePriority, 0,
            {AccountName: 'Debit', Balance: balance, Priority: debitBalancePriority})  : []
        dashboardReports.DayWiseData = []
        dashboardReports.PrintJobs = queryPrintJobsRes[0] ? queryPrintJobsRes[0] : {}
        dashboardReports.PrintPages = queryPrintPagesRes[0] ? queryPrintPagesRes[0] : {}
        dashboardReports.Balance = balance ? balance + quotaBalance : 0 + quotaBalance
        dashboardReports.AccountInfo = accountInfo
        dayWiseData && await dayWiseData.forEach(data => {
          dashboardReports.DayWiseData.push({ date: data._id, count: data.count })
        })
        log.info(dashboardReports);
        return dashboardReports
      } catch (e) {
        log.error(e);
        throw new Error(e)
      }
    },

    async csvReport (_, { filters, customerId }, context, info) {
      log.lambdaSetup(context, 'usages', 'csvReport')
      try {
        let {
          customerId: customerIds,
          locationId,
          startDate,
          endDate,
          submissionType,
          colorType,
          documentType,
          transactionType,
          timezone
        } = filters
        verifyUserAccess(context, customerId)
        timezone = timezone || 'America/Chicago'
        const { dateFrom, dateTo } = await convertFilterTime(startDate, endDate, timezone, false)
        const condition = {
          TransactionDate: { $gte: dateFrom, $lte: dateTo }
        }
        if (context.data && context.data.customerIdsFilter && context.data.customerIdsFilter.length > 0) {
          customerIds = customerIds.concat(context.data.customerIdsFilter)
        }
        if (customerIds && customerIds.length > 0) {
          customerIds = await customerIds.map(cus => ObjectId.createFromHexString(cus))
          Object.assign(condition, { CustomerID: { $in: customerIds } })
        }
        if (locationId && locationId.length > 0) {
          locationId = await locationId.map(loc => ObjectId.createFromHexString(loc))
          Object.assign(condition, { LocationID: { $in: locationId } })
        }
        if (submissionType && submissionType.length > 0) {
          Object.assign(condition, { 'Print.JobDeliveryMethod': { $in: submissionType } })
        }
        if (colorType && colorType.length > 0) {
          colorType = await colorType.map(color => new RegExp(`^${color}$`, 'i'))
          Object.assign(condition, { 'Print.ColorType': { $in: colorType } })
        }
        if (documentType && documentType.length > 0) {
          Object.assign(condition, { 'Print.DocumentType': { $in: documentType } })
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
        if (transactionType && transactionType.length > 0) {
          transactionType = transactionType.map( tran => tran.toLowerCase())
          Object.assign(condition, {'Type': {$in: transactionType}})
        } else {
          Object.assign(condition, {'Type': {$nin: ["add_value", 'deduct_value']}})
        }
        const finalReport = []
        const db = await getDatabaseOneCustomer(context, customerId)
        const collection = db.collection(Usages)
        const csvReports = await collection.find(condition).sort({ TransactionDate: 1, TransactionStartTime: 1 }).toArray()
        await csvReports.forEach(data => {
          const obj = {}
          Object.assign(obj, data)
          obj.TransactionDate = format(toZonedTime(data.TransactionDate, timezone), 'MM/dd/yyyy hh:mm:ss aaa')
          obj.TransactionStartTime = format(toZonedTime(data.TransactionStartTime, timezone), 'MM/dd/yyyy hh:mm:ss aaa')
          obj.TransactionEndTime = format(toZonedTime(data.TransactionEndTime, timezone), 'MM/dd/yyyy hh:mm:ss aaa')
          obj.Print.PrintJobSubmitted = format(toZonedTime(data.Print.PrintJobSubmitted, timezone), 'MM/dd/yyyy' +
            ' hh:mm:ss aaa')
          obj.Customer = data.Customer
          obj.Location = data.Location
          obj.Thing = data.Thing
          // Add "None" in Staple column if Staple is null or doesn't exist
          if (!data.Print?.Staple) {
            data.Print["Staple"] =  "None"
          }
          finalReport.push(obj)
        })
        const json2csvParser = new Parser({ fields: usageData, del: ',' })
        const finalCsvData = await json2csvParser.parse(finalReport)
        return { base64: Buffer.from(finalCsvData).toString('base64') }
      } catch (e) {
        log.error(e)
        throw new Error(e)
      }
    }

  }
}

const convertFilterTime = async (dateFrom, nowUtc, timeZone, dashboard = false) => {
  if (dateFrom && nowUtc) {
    dateFrom = await fromZonedTime(dateFrom, timeZone)
    nowUtc = dashboard ? nowUtc : await fromZonedTime(nowUtc, timeZone)
    dateFrom = new Date(dateFrom)
    nowUtc = new Date(nowUtc)
    return { dateFrom, dateTo: nowUtc, timeZone }
  }
}


let convertFilterTimeFilters = async (filters) => {
  log.info(filters);
  if(filters && filters.dateFrom && filters.dateTo){
    filters.dateFrom = await fromZonedTime(filters.dateFrom, filters.timeZone)
    filters.dateTo = await fromZonedTime(filters.dateTo, filters.timeZone)
    filters.dateFrom = new Date(filters.dateFrom)
    filters.dateTo = new Date(filters.dateTo)
    return filters
  } else {
    return filters
  }
}

const updateTheDeviceIfRequired = async (record, newUsage, db) => {
  if (record?.PrintHistory) {
    for( let device of record.PrintHistory) {
      if (device.FileName && device.FileName === newUsage.Print.SystemFileName && device.DeviceName !== newUsage.Print.Device) {
        const deviceData = await db.collection('Devices').findOne({CustomerID: newUsage.CustomerID, IsDeleted: false, Device: device.DeviceName })
        if (deviceData) {
          newUsage.Print.DeviceID = deviceData._id
          newUsage.Print.Device = deviceData.Device
        }
      }
    }
    return newUsage
  }
  return newUsage
}
const addValueDeductRecord = async (db, newUsage) => {
  try {
    const deductRecords = []
    for (const deductionData of newUsage.DeductBalance) {
      const record = {
        Type : 'deduct_value',
        TransactionDate : utcDateGet(),
        TransactionStartTime : utcDateGet(),
        TransactionEndTime : utcDateGet(),
        UsageID: newUsage._id,
        Customer : newUsage.Customer,
        CustomerID : newUsage.CustomerID,
        FullName : newUsage.FullName,
        EmailAddress : newUsage.EmailAddress,
        Username : newUsage.Username,
        UserID : newUsage.UserID,
        DeductValue: {
          Deducted: true,
          DeductedAmount: deductionData.AmountDeducted,
          DeductedMethod: deductionData?.AccountName?.toLowerCase() === 'debit' ? 'debit' : 'quota',
          JobType: newUsage.Type,
          AccountID: deductionData.GroupID,
          AccountName: deductionData.AccountName
        },
        createdAt: utcDateGet(),
        updatedAt: utcDateGet(),
        IsDeleted: false
      }
      deductRecords.push(record)
    }
    await db.collection('Usage').insertMany(deductRecords)
  } catch (err) {
    log.error(err)
  }
}

const addProtonTransactionRecord = async (
  db,
  newUsage,
  jobId,
  transactionObj
) => {
  try {
    const thirdPartyTransactionRecord = {
      Type: "Standard",
      CustomerID: newUsage?.CustomerID,
      Customer: newUsage?.Customer,
      BillingAccountId: newUsage?.BillingAccountId,
      BillingAccountName: newUsage?.BillingAccountName,
      UsageID: newUsage._id,
      ThirdPartyTransactionID: jobId,
      LocationID: newUsage?.LocationID,
      Thing: newUsage?.Thing,
      ThingID: newUsage?.ThingID,
      TransactionPayload: {
        ContactId: transactionObj?.contactId,
        StartDate: transactionObj?.startDate,
        LocationNumber: transactionObj?.locationNumber,
        ServiceId: transactionObj?.serviceId,
        Quantity: transactionObj?.quantity,
        CurrencyCode: transactionObj?.currencyCode,
        TransactionId: transactionObj?.transactionId,
      },
      CreatedAt: utcDateGet(),
      ExpireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
    await db.collection("AuditProtonTransaction").insertOne(thirdPartyTransactionRecord);
  } catch (error) {
    log.error("Error in AuditProtonTransaction:", error);
  }
};

const assignDefaultOrientation = async (
  newUsage,
  CustomerID,
  publicUploadCollection,
  Print
) => {
  try {
    const PublicUploadData = await publicUploadCollection.findOne({
      CustomerID: ObjectId.createFromHexString(CustomerID),
      ReleaseCode: Print.ReleaseCode,
    });
    if (
      PublicUploadData &&
      PublicUploadData.JobList &&
      Array.isArray(PublicUploadData.JobList)
    ) {
      for (let job of PublicUploadData.JobList) {
        if (job?.NewFileNameWithExt === Print?.SystemFileName) {
          newUsage.Print.Orientation =
            job.Orientation.toLowerCase() === "assaved" ? "Portrait" : job.Orientation;
          break;
        }
      }
    }
    return newUsage;
  } catch (error) {
    console.error("Error in assignDefaultOrientation:", error);
    return newUsage;
  }
};

const createDashboardQueryCondition = (dateFilter, customerIdsFilter = []) => {
  const condition = {
    TransactionDate: { $gte: dateFilter.dateFrom, $lte: dateFilter.dateTo },
    Type: "print",
    
  };
  if (!_.isEmpty(customerIdsFilter)) {
    condition.CustomerID = { $in: customerIdsFilter };
  }
  return condition;
};
const sendTransactionToProtonServer = async (newUsage, db, locationDetails) => {
  let transaction = {}
  try {
    let protonConfig = await db.collection(Protons).findOne({CustomerID: newUsage.CustomerID,
      IsDeleted: false, "ThirdPartySoftwareType" : "ProtonIntegration"})
    let serviceDetails = await db.collection('BillingServices').find({}).toArray()
    let serviceId = getServiceId(newUsage, serviceDetails)
    if (protonConfig && protonConfig.IsActive && newUsage?.BillingAccountId) {
      protonConfig.ClientSecret = await decryptText(protonConfig.ClientSecret)
      log.info('proton service enabled for this customer')
      transaction = {
        contactId: newUsage?.BillingAccountId,
        startDate: newUsage?.TransactionEndTime,
        locationNumber: parseInt(newUsage?.Location),
        serviceId: serviceId,
        quantity: newUsage?.Print?.TotalPages * newUsage?.Print?.Copies,
        currencyCode: locationDetails?.CurrencyCode,
        transactionId: newUsage?._id.toString(),
      }
      log.info('transaction object: ',transaction)
      const protonResponse = await getProtonToken(protonConfig)
      log.info('initiate send transaction api: ',transaction)
      console.log('protonResponse_____',protonResponse);
      const jobId = await sendTransaction(protonConfig, protonResponse?.token, transaction, log)
      log.info('transaction sent', jobId)
      if (!jobId) {
        await sendAuditLogs(db, {
          error: "Failed",
          protonPayload: transaction,
          usageData: newUsage,
        });
      }
      if (jobId) {
        await addProtonTransactionRecord(db, newUsage, jobId, transaction);
      }
      return jobId
    } else {
      log.info('proton service not enabled for this customer or billing account id not found')
      return false
    }
  } catch (error) {
    log.error('Error in sending transaction to proton server')
    log.error(error);
    if (!error?.response?.data) {
        error.response = {
            data: {
            message: 'Invalid configurations'
            }
        }
    }
    log.error('Response status:', error?.response?.status);
    log.error('Response data:', error?.response?.data);
    let firstKey = error?.response?.data?.modelState && Object.keys(error?.response?.data?.modelState)[0] || undefined;
    let errorMessage = firstKey && error?.response?.data?.modelState[firstKey] ||
      error?.response?.data && formatInvalidTransactions(error?.response?.data) || ''
    
    let retry = true;
    log.error('errorMessage: ', errorMessage);

    if (
      errorMessage &&
      typeof errorMessage === "object" &&
      errorMessage?.message
    ) {      
      retry = errorMessage?.retry ? errorMessage?.retry : false
      errorMessage = errorMessage.message;
    }
    
    await sendAuditLogs(db, {
      error: error.response.data?.message
        ? error.response.data?.message + errorMessage
        : errorMessage,
      shouldRetry: retry,
      protonPayload: transaction,
      usageData: newUsage,
    });
  }
}

const formatInvalidTransactions = (response) => {
  if (!response || !response.invalidTransactions) {
    return "";
  }

  let hasInvalidValue = false;
  let hasEmptyValue = false;

  const messages = response?.invalidTransactions?.map(transaction => {
    const errorMessages = transaction.errors.map(err => {
      if (err.fieldName === 'LocationNumber') {
        if (err.code === 'InvalidValue') hasInvalidValue = true;
        if (err.code === 'EmptyValue') hasEmptyValue = true;
      }
      return `${err.fieldName}: ${err.message} (${err.code})`
    }).join(", ") || '';

    return `${errorMessages}`;
  }).join("; ");

  return {
    message: messages,
    retry: !hasInvalidValue && !hasEmptyValue
  };
}

const getServiceId = (newUsage, serviceDetails) => {
  const serviceType = `${newUsage?.Type.toLowerCase()}`
  const colorType = `${newUsage?.Print?.ColorType.toLowerCase() === 'color' ? 'colour' : 'black & white'}`
  const paperSize = `${newUsage?.Print?.PaperSize.toLowerCase()}`
  let serviceId = ''
  serviceDetails.forEach(service => {
    const serviceName = service?.ServiceName.toLowerCase()
    if (serviceId === '' && serviceType === 'scan' && serviceName === 'document scanning') {
      serviceId = service.ServiceID
    } else if (serviceName.includes(serviceType) && serviceName.includes(colorType) && serviceName.includes(paperSize)) {
      serviceId = service.ServiceID
    }
  })
  return serviceId
}

const sendAuditLogs = async (db, event) => {
  let { error, protonPayload, usageData, shouldRetry } = event;
  
  let logRecord = {
    Type: "ProtonService",
    Date: new Date(),
    ReleaseCode: usageData?.Print?.ReleaseCode,
    ErrorMessage: error?.toString() || "Failed to send transaction to Proton",
    ShouldRetry: shouldRetry === false ? false : true,
    CustomerID: usageData?.CustomerID,
    Customer: usageData?.Customer,
    BillingAccountName: usageData?.BillingAccountName,
    ProtonPayload: protonPayload,
    UsageID: usageData?._id,
    LocationID: usageData?.LocationID,
    Thing: usageData?.Thing,
    ThingID: usageData?.ThingID,
    RetryCount: 0,
    Status: 'Failed',
    LastRetry: null,
  }
  try {
    const { insertedId } = await db.collection('AuditLogs').insertOne(logRecord);
    log.info('Inserted audit log with ID:', insertedId);
  } catch (err) {
    log.error('Error inserting audit log:', err);
  }
}