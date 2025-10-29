const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const {region, FUNCTION_NAME_TRANSLATE} = require('../config/config') // to be defined

module.exports.sendJobToAzureService = async (customerData, jobData, isTranslated) => {
    const lambdaClient = new LambdaClient({ region: region });
    const params = {
        FunctionName: FUNCTION_NAME_TRANSLATE,
        InvocationType: 'Event',
        Payload: JSON.stringify({
            data: {
                customerData, jobData, isTranslated
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
