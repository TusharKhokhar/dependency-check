const {executiveReports, chartReports} = require('../model/usages')
const {uploadJsonToS3} = require("../../uploadToS3");
const {sendJobToJsReports} = require("../../jsReports");
const {formatExecutiveData} = require("../helpers/helpers");
const moment = require("moment");
const {sendToWss} = require("../helpers/wss");

module.exports = {
    executiveReport: async (db, filters, customerId, decoded,  reportType, templateData, dataUrl, isProcessed, connectionId, logo, dateString) => {
        let reportsData = await executiveReports(db, filters)
        let chartData = await chartReports(db, filters)
        const {finalData: data, dataAvailable} = await formatExecutiveData(reportsData,chartData, filters, logo, dateString)
        if (dataAvailable) {
            let { dataUrlPath } = await uploadJsonToS3(data, customerId)
            await sendJobToJsReports(dataUrlPath, filters, customerId, decoded,  reportType, templateData,
              isProcessed, connectionId, logo)
        } else {
            await sendToWss(connectionId, 'Data not available')
        }
    }
}
