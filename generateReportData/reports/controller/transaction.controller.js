const { formatPrinterUsage, formTransactionReportsData, formTransactionSummaryReportsData, formAddValueSummary} = require("../helpers/helpers");
const {uploadJsonToS3} = require("../../uploadToS3");
const {sendJobToJsReports} = require("../../jsReports");
const { transactionReport, transactionSummary, addValueSummary} = require("../model/usages");
const {sendToWss} = require("../helpers/wss");
const DATA_NOT_FOUND = 'Data not available'

module.exports.transactionRep = async (db, filters, customerId, decoded, reportType, templateData, dataUrl, isProcessed, connectionId, logo, dateString) => {
    let reportsData = await transactionReport(db, filters)
    let customerData = await db.collection('Customers').find({}).toArray()
    let customerIds = await customerData.map(customer => customer._id.toString())
    const {formattedData: data, dataAvailable } = await formTransactionReportsData(reportsData, filters, logo, dateString, customerIds, customerData)
    if (dataAvailable) {
        let {dataUrlPath} = await uploadJsonToS3(data, customerId)
        await sendJobToJsReports(dataUrlPath, filters, customerId, decoded, reportType, templateData,
          isProcessed, connectionId, logo)
    } else {
        await sendToWss(connectionId, DATA_NOT_FOUND)
    }
}


module.exports.transactionSummary = async (db, filters, customerId, decoded, reportType, templateData, dataUrl,
                                           isProcessed, connectionId, logo, dateString) => {
    let reportsData = await transactionSummary(db, filters)
    let customerData = await db.collection('Customers').find({}).toArray()
    let customerIds = await customerData.map(customer => customer._id.toString())
    const {formattedData: data, dataAvailable } = await formTransactionSummaryReportsData(reportsData, filters, logo, dateString, customerIds, customerData)
    if (dataAvailable) {
        let {dataUrlPath} = await uploadJsonToS3(data, customerId)
        console.log(dataUrlPath);
        await sendJobToJsReports(dataUrlPath, filters, customerId, decoded, reportType, templateData,
          isProcessed, connectionId, logo)
    } else {
        await sendToWss(connectionId, DATA_NOT_FOUND)
    }
}


module.exports.valueAddSummary = async (db, filters, customerId, decoded, reportType, templateData, dataUrl,
                                           isProcessed, connectionId, logo, dateString) => {
    let reportsData = await addValueSummary(db, filters)
    let customerData = await db.collection('Customers').find({}).toArray()
    let customerIds = await customerData.map(customer => customer._id.toString())
    const {formattedData: data, dataAvailable } = await formAddValueSummary(reportsData, filters, logo, dateString, customerIds, customerData)
    if (dataAvailable) {
        let {dataUrlPath} = await uploadJsonToS3(data, customerId)
        await sendJobToJsReports(dataUrlPath, filters, customerId, decoded, reportType, templateData,
          isProcessed, connectionId, logo)
    } else {
        await sendToWss(connectionId, DATA_NOT_FOUND)
    }
}

