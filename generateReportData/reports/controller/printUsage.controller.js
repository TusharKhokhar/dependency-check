const { formatPrinterUsage} = require("../helpers/helpers");
const {uploadJsonToS3} = require("../../uploadToS3");
const {sendJobToJsReports} = require("../../jsReports");
const { printUsageReport} = require("../model/usages");
const {sendToWss} = require("../helpers/wss");

module.exports.printerUsage = async (db, filters, customerId, decoded, reportType, templateData, dataUrl, isProcessed, connectionId, logo, dateString) => {
    let reportsData = await printUsageReport(db, filters)
    let customerData = await db.collection('Customers').find({}).toArray()
    let customerIds = await customerData.map(customer => customer._id.toString())
    const {formattedData: data, dataAvailable } = await formatPrinterUsage(reportsData, filters, logo, dateString, customerIds, customerData)
    if (dataAvailable) {
        let {dataUrlPath} = await uploadJsonToS3(data, customerId)
        await sendJobToJsReports(dataUrlPath, filters, customerId, decoded, reportType, templateData,
          isProcessed, connectionId, logo)
    } else {
        await sendToWss(connectionId, 'Data not available')
    }
}
