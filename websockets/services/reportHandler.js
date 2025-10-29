const {getDb, switchDb, isolatedDatabase} = require('../config/db')
const {validateToken} = require('./validateToken')
const { Lambda } = require('@aws-sdk/client-lambda');
const {TIER, GENERATE_REPORT_LAMBDA, REGION} = require("../constants/constants");
const {sendError} = require("./sendErrorResponse");
const {iotPolicy, lambdaPolicy} = require("./policy");
const {getStsCredentials} = require("./credentialsGenerator");

module.exports = {
    reportHandler: async ({
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
                          }) => {
        try {
            const db = tier === TIER ? await getDb() : await isolatedDatabase(domainName)
            const {error, decoded} = await validateToken({token, db, apiKey})
            if (error) {
                // await sendError(connectionId)
                return {
                    error: 401
                }
            } else {
                if(domainName !== 'admin'){
                    console.log('********',filters.customerIds);
                    console.log('********',decoded.customerIdsStrings);
                    if(filters.customerIds.length > 0 && !filters.customerIds.every(v => decoded.customerIdsStrings.includes(v))){
                        await sendError(connectionId)
                        throw new Error(error)
                    } else {
                        filters.customerIds = filters.customerIds.length > 0 ?
                          filters.customerIds : decoded.customerIdsFilter.concat(filters.customerIds)
                    }
                }
                console.log('reached till here')

                const policy = lambdaPolicy()
                const credentials = await getStsCredentials(policy)
                const accessParams = {
                    accessKeyId: credentials.Credentials.AccessKeyId,
                    secretAccessKey: credentials.Credentials.SecretAccessKey,
                    sessionToken: credentials.Credentials.SessionToken
                };
                const lambda = new Lambda({
                    region: REGION,

                    credentials: {
                        accessKeyId: accessParams.accessKeyId,
                        secretAccessKey: accessParams.secretAccessKey,
                        sessionToken: accessParams.sessionToken,
                    },
                })
                const response = await lambda.invoke({
                    FunctionName: GENERATE_REPORT_LAMBDA,
                    InvocationType: 'Event',
                    Payload: JSON.stringify({
                        customerId,
                        templateData,
                        filters,
                        reportType, connectionId, decoded, isProcessed, dataUrl,
                        tier, domainName, logo
                    }),
                });
                console.log('triggered=', response);
                return response
            }
        } catch (error) {
            await sendError(connectionId)
            throw new Error(error)
        }
    }
}
