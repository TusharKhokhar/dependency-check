const {TIER} = require("../constants/constants");
const {getDb, isolatedDatabase} = require("../config/db");
const {validateToken} = require("../services/validateToken");
const {iotPolicy} = require("../services/policy");
const {getStsCredentials} = require("../services/credentialsGenerator");
const {fetchIoTEndpoint, publishToTopic} = require("../services/iot-handler");
const {region} = require("../config/config");
const {sendError} = require("../services/sendErrorResponse");

module.exports.restart = async (parsedBody, connectionId) => {
     let {
                tier,
                token,
                apiKey,
                domainName,
                thingName
            } = parsedBody
            try {
                const db = tier === TIER ? await getDb() : await isolatedDatabase(domainName)
                const {error} = await validateToken({token, db, apiKey})
                if (error) {
                    return {
                        error: 401
                    }
                } else {
                    const policy = iotPolicy()
                    const credentials = await getStsCredentials(policy)
                    const accessParams = {
                        accessKeyId: credentials.Credentials.AccessKeyId,
                        secretAccessKey: credentials.Credentials.SecretAccessKey,
                        sessionToken: credentials.Credentials.SessionToken
                    };
                    const message = {
                        SessionID: connectionId,
                        Action: 'RESTART',
                        ThingName: thingName
                    }
                    const topic = `cmd/eprintit/${parsedBody.customerId}/${parsedBody.locationId}/${thingName}/${parsedBody.requestType}`
                    console.log(topic);
                    const endpoint = await fetchIoTEndpoint(region, accessParams)
                    await publishToTopic(topic, message, endpoint, accessParams)
                    return {
                        statusCode: 200
                    }
                    // await db.collection('Things').updateOne({_id: ObjectId(parsedBody.thingId)}, {$set: {RestartStatus: message}})
                }
            } catch (error) {
                console.log(error);
                await sendError(connectionId, true)
            }
}