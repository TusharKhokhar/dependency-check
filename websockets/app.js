const {getDb} = require('./config/db')
const {lmsValidate} = require("./controllers/lmsValidate.controller");
const {createSession} = require("./controllers/createSession.controller");
const {restart} = require("./controllers/restart.controller");
const {reports} = require("./controllers/report.controller");
const { getNayaxStatus } = require("./controllers/nayaxStatus.controller");
const {
    KIOSK_RESTART_ACTION, region
} = require('./config/config')
const {validateRequest} = require("./services/token-interceptor");
const {getOnlineStatus} = require("./controllers/things.controller");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { websocketApiId } = require('./config/config')
const {websocketPolicy} = require("./services/policy");
const {getStsCredentials} = require("./services/credentialsGenerator");
const API_AWS_VERSION = '2018-11-29'

module.exports.handler = async (event, context) => {
    try {
    console.log('logging the full event body: ', event)
    const {
        requestContext: {connectionId, routeKey},
    } = event;
    console.log('logging the body received in websockets', event.requestContext)
    if (routeKey === "$connect") {
        const {authentic: flag, accessKey, CustomerID} = await validateApiKey(event)
        if(flag){
            return await connect(connectionId, routeKey, accessKey, CustomerID)
        } else {
            return {
                statusCode: 401
            }
        }
    } else if (routeKey === "$disconnect") {
        return await disconnect(connectionId)
    } else if (routeKey === "sendmessage") {
        let parsedBody = JSON.parse(event.body).body;
        console.log('parsedBody: ', parsedBody)
        switch (parsedBody.actionItem) {
            case 'lmsValidateSession': {
                return await lmsValidate(connectionId, parsedBody)
            }
            case 'createSession': {
                return await createSession(connectionId, parsedBody)
            }
            case 'getReports': {
                return await reports(connectionId, parsedBody)
            }
            case KIOSK_RESTART_ACTION: {
                return await restart(parsedBody, connectionId)
            }
            case 'getNayaxStatus': {
                return await getNayaxStatus(connectionId, parsedBody)
            }
            case 'onlineStatus': {
                const db = await getDb()
                const {accessKey, CustomerID} = await db.collection('Connections').findOne({connectionId: connectionId})
                const onlineStatus =  await getOnlineStatus(accessKey, parsedBody, CustomerID)
                console.log('onlineStatus****',onlineStatus);
                const { endpoint,
                    apiVersion,
                    credentials
                } = await ApiGatewayConnector(region)
                const api = new ApiGatewayManagementApiClient({
                    endpoint,
                    apiVersion,
                    credentials
                })
                const params = {
                    ConnectionId: connectionId,
                    Data: Buffer.from(JSON.stringify({
                        onlineStatus: onlineStatus,
                        sessionId: connectionId
                    }))
                }
                console.log('params*****',params);
                await postDataToSession(api, params)
                return {
                    statusCode: 200,
                }
            }
            default: {
                return {
                    statusCode: 200
                }
            }
        }
    } else {
        return {
            statusCode: 400
        }
    }
    } catch (error) {
        console.error("Error in websocket handler", error?.response || error);
    }
};

const connect = async (connectionId, routeKey, accessKey, CustomerID) => {
    const data = {
        connectionId, routeKey, accessKey, CustomerID, Date: new Date()
    }
    const instance = await getDb()
    await instance.collection('Connections').insertOne(data)
    return {
        statusCode: 200
    }
}

const validateApiKey = async (event) => {
    if (event.headers.Host.includes('partner-wss')){
        const authorization = event.headers.Authorization || event.headers.authorization
        return await validateRequest(authorization)
    } else {
        // const apiKey = ''
        // return [web, mobile, desktop, windowsDriver, macOsDriver, hp, kiosk, chromeExtension].includes(apiKey)
        return {authentic: true}
    }
}

const disconnect = async (connectionId) => {
    const instance = await getDb()
    await instance.collection('Connections').deleteOne({connectionId: connectionId})
    return {
        statusCode: 200
    }
}

const ApiGatewayConnector = async (region) => {
    const policy = websocketPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
    }
    const endpoint = `${websocketApiId}`
    const apiVersion = API_AWS_VERSION
    return {endpoint,
        apiVersion,
        credentials: accessParams,
        region}
}

const postDataToSession = (api, params) => {
    return new Promise(async (resolve, reject) => {
        try {
            const command = new PostToConnectionCommand(params);
            await api.send(command)
            resolve()
        } catch (e) {
            console.log('e***',e);
            resolve(e)
        }
    })
}
