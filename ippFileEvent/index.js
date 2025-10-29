const {IoTDataPlaneClient, PublishCommand} = require('@aws-sdk/client-iot-data-plane');
const {ApiGatewayManagementApiClient, PostToConnectionCommand} = require("@aws-sdk/client-apigatewaymanagementapi");
const {getDb} = require("./config/dbHandler");
const {ObjectId} = require("mongodb");
const {IoTClient, DescribeEndpointCommand} = require('@aws-sdk/client-iot');
const {v4: uuidv4} = require('uuid');
const {domainName, region} = require("./config/config");
const websocketApiId = `https://wss.${domainName}`

exports.handler = async (event) => {
    console.log(JSON.stringify(event))
    try {
        const fileName = event.Records[0].s3.object.key;
        const fileMetaData = fileName.split('/')
        const db = await getDb()
        console.log('file*******', fileMetaData[fileMetaData.length - 1]);
        const publicUploadRecord = await db.collection('PublicUploads').findOne(
          {
              'IsProcessedFileName.FileName': fileMetaData[fileMetaData.length - 1],
              CustomerID: ObjectId.createFromHexString(fileMetaData[1])
          })
        const ippSessionRecord = await db.collection('IppSessions').findOne({
            TrackID: publicUploadRecord.TrackID,
            DeviceID: publicUploadRecord.DeviceID,
            CustomerID: publicUploadRecord.CustomerID,
            "IsDeleted": false
        })
        if (fileName?.includes('IppResponse')) {
            const {
                endpoint,
                apiVersion,
                credentials
            } = await ApiGatewayConnector(region)
            const api = new ApiGatewayManagementApiClient({
                endpoint,
                apiVersion,
                credentials
            })
            const params = {
                ConnectionId: publicUploadRecord?.SessionID,
                Data: Buffer.from(JSON.stringify({
                    s3Path: fileName
                }))
            }
            await postDataToSession(api, params)
        } else {
            const thingData = await db.collection('Things').findOne({
                _id: publicUploadRecord.ThingID,
                CustomerID: publicUploadRecord.CustomerID
            })
            const topic = `cmd/eprintit/${fileMetaData[1]}/${publicUploadRecord.LocationID.toString()}/${thingData?.PrimaryRegion?.ThingName}/ippprint`
            console.log("topic", topic)
            const endpoint = await retrieveEndpoint(region)
            const iotDataClient = new IoTDataPlaneClient({
                endpoint: `https://${endpoint}`,
                region: region,
            });
            const iotParams = {
                topic,
                qos: 1,
                payload: JSON.stringify({
                    MessageID: uuidv4(),
                    ReleaseCode: publicUploadRecord.ReleaseCode,
                    SessionId: publicUploadRecord.SessionID,
                    ThingName: thingData?.PrimaryRegion?.ThingName,
                    RequestType: 'ippprint',
                    DeviceName: publicUploadRecord.DeviceName,
                    JobAttributes: ippSessionRecord?.JobAttributes
                })
            };
            await iotDataClient.send(new PublishCommand(iotParams));
            return {
                statusCode: 200,
                body: JSON.stringify({message: 'IoT message sent successfully'}),
            };
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message}),
        };
    }
};

const retrieveEndpoint = async (region) => {
    const iotClient = new IoTClient({
        region: region
    });
    const params = {endpointType: 'iot:Data-ATS'};
    try {
        const command = new DescribeEndpointCommand(params);
        const data = await iotClient.send(command);
        return data.endpointAddress;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const ApiGatewayConnector = async (region) => {
    const endpoint = `${websocketApiId}`
    const apiVersion = '2018-11-29'
    return {
        endpoint,
        apiVersion,
        region
    }
}

const postDataToSession = (api, params) => {
    return new Promise(async (resolve, reject) => {
        try {
            const command = new PostToConnectionCommand(params);
            await api.send(command)
            resolve()
        } catch (e) {
            resolve(e)
        }
    })
}

