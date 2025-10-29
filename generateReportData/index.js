const {getDb, switchDb, isolatedDatabase} = require("./config/db");
const {STANDARD_TIER, API_KEY, DOMAIN_NAME, ERROR_MESSAGE} = require("./config/config");
const {printerUsage} = require("./reports/controller/printUsage.controller");
const {executiveReport} = require("./reports/controller/executive.controller");
const {sendJobToJsReports} = require("./jsReports");
const axios = require("axios")
const {zonedTimeToUtc} = require('date-fns-tz')
const moment = require("moment");
const { getObjectId: ObjectId } = require('./reports/helpers/objectIdConverter')
const {transactionRep, transactionSummary, valueAddSummary} = require("./reports/controller/transaction.controller");
const { csvReport } = require("./reports/controller/csv.controller");
const { normalizeFilter } = require("./reports/helpers/helpers");


module.exports.handler = async (event, context, callback) => {
    let {
        customerId,
        templateData,
        filters,
        reportType, connectionId, decoded, isProcessed, dataUrl, tier, logo
    } = event
    let domainName = decoded.user.TenantDomain
    try {
        filters = normalizeFilter(filters)
        if (isProcessed) {
            await sendJobToJsReports(dataUrl, filters, customerId, decoded, reportType, templateData,
                isProcessed, connectionId, logo)
        } else {
            let dateString = `${moment(filters.dateFrom).format('lll')} - ${moment(filters.dateTo).format('lll')} `
            filters = await convertFilterTime(filters)
            console.log('filters: ',filters);
            let db = tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(domainName)
            if(domainName === 'admin' && filters.customerIds && filters.customerIds.length === 1){
                let customerDomain = await db.collection('Customers').findOne({_id: ObjectId.createFromHexString(filters.customerIds[0])})
                db = customerDomain.Tier === STANDARD_TIER ? await getDb() : await isolatedDatabase(customerDomain.DomainName)
            }
            if (reportType === 'executive report') {
                await executiveReport(db, filters, customerId, decoded, reportType, templateData,
                    dataUrl, isProcessed, connectionId, logo, dateString)
            } else if (reportType === 'printer summary') {
                await printerUsage(db, filters, customerId, decoded, reportType, templateData,
                    dataUrl, isProcessed, connectionId, logo, dateString)
            } else if (reportType === 'payment type summary') {
                await transactionRep(db, filters, customerId, decoded, reportType, templateData,
                    dataUrl, isProcessed, connectionId, logo, dateString)
            } else if (reportType === 'transaction summary report') {
                await transactionSummary(db, filters, customerId, decoded, reportType, templateData,
                    dataUrl, isProcessed, connectionId, logo, dateString)
            } else if (reportType === 'value add summary') {
                await valueAddSummary(db, filters, customerId, decoded, reportType, templateData,
                    dataUrl, isProcessed, connectionId, logo, dateString)
            } else if (reportType === 'csv report') {
                await csvReport(db, filters, customerId, connectionId);
            } else {
                console.log('Invalid report type');
                await sendReportsData(connectionId)
            }
        }
    } catch (e) {
        console.log('error: ', e);
        await sendReportsData(connectionId)
    }
}

let convertFilterTime = async (filters) => {
    if(filters.dateFrom && filters.dateTo){
        filters.dateFrom = await zonedTimeToUtc(filters.dateFrom, filters.timeZone)
        filters.dateTo = await zonedTimeToUtc(filters.dateTo, filters.timeZone)
        filters.dateFrom = new Date(filters.dateFrom)
        filters.dateTo = new Date(filters.dateTo)
        return filters
    } else {
        return filters
    }
}

let sendReportsData = async (sessionId) => {
    const config = {
        method: 'post',
        url: `https://api.${DOMAIN_NAME}/public/sendStatus`,
        headers: {
            'apikey': API_KEY
        },
        data: {
            sessionId,
            status: false,
            message: ERROR_MESSAGE,
            action: 'reports',
            releaseCode: 'reports',
            dataUrl: null
        },
    };
    console.log(config.data)
    await axios(config)
        .then(function (response) {
            // console.log('RES ', response)
            return JSON.parse(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log('ERROR', error)
            return error;
        });
}

//
// handler({
//     // customerId: '622273543579520009ac0d7f',
//     "customerId":"6231ce19932e27000985ba60",
//     "templateData":{"name":"excutive_summary_table_html","engine":"handlebars","recipe":"html","shortid":"IyjmPZUgE"},
//     "filters":{
//         "customerIds":["622273543579520009ac0d7f", "62c7e1062484ff17a2b91516"],
//         "dateTo":"2022-07-31T18:00:00.000Z",
//         "dateFrom":"2022-07-01T06:00:00.000Z",
//         "locationIds":[],"timeZone":"Asia/Calcutta",
//         "submissionType":["web"],"printType":[],"colorType":[]
//     },
//     "isProcessed":false,
//     "tier":"standard",
//     "apiKey":"cweex23xieo2hznx2ln3hr8ru23crucl",
//     "domainName":"admin",
//     reportType: 'executive report',
//     connectionId: '234565432', decoded: {
//         user: {
//             TenantDomain: 'ippl'
//         },
//         customerIdsFilter: []
//     }, dataUrl: ''
// }).then(a => {
//     console.log('done');
// }).catch(err => {
//     console.log(err);
// })
