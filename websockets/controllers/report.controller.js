const {reportHandler} = require("../services/reportHandler");
module.exports.reports = async (connectionId, parsedBody) => {
    try {
        let {
            tier,
            domain,
            customerId,
            templateData,
            filters,
            reportType,
            token, apiKey,
            isProcessed,
            dataUrl,
            domainName,
            logo
        } = parsedBody
        await reportHandler({
            tier,
            domain,
            customerId,
            templateData,
            filters,
            reportType,
            token, apiKey,
            isProcessed,
            dataUrl,
            connectionId,
            domainName,
            logo
        })
        return {
            statusCode: 200
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 200
        }
    }
}