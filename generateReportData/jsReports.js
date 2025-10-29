const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const {REGION, FUNCTION_NAME_JS} = require('./config/config')

module.exports.sendJobToJsReports = async (dataUrl, filters, customerId, decoded,  reportType, templateData,
                                           isProcessed, connectionId, logo) => {
    const lambdaClient = new LambdaClient({ region: REGION });                                           
    console.log(templateData);

    const params = {
        FunctionName: FUNCTION_NAME_JS,
        InvocationType: 'Event',
        Payload: JSON.stringify({
            renderRequest: {
                template: templateData
            },
            data: {
                dataUrl, filters, customerId, decoded,  reportType, templateData,
                isProcessed, connectionId, logo
            }
        })
    };
    try {
        const invokeRes = await lambdaClient.send(new InvokeCommand(params));
        console.log(invokeRes);
        return invokeRes;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
