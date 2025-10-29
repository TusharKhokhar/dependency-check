const { IoTClient, DescribeEndpointCommand, SearchIndexCommand} = require('@aws-sdk/client-iot');
const { IoTDataPlaneClient, PublishCommand } = require('@aws-sdk/client-iot-data-plane');
const {region}  = require('../config/config');
let fetchIoTEndpoint = (region, accessParams) => {
    return new Promise((resolve, reject) => {
        let iot = new IoTClient({
            region: region,
            credentials: {
                accessKeyId: accessParams.accessKeyId,
                secretAccessKey: accessParams.secretAccessKey,
                sessionToken: accessParams.sessionToken
            }
        });
        let params = {
            endpointType: 'iot:Data-ATS'
        };
        const command = new DescribeEndpointCommand(params)
        iot.send(command, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve('https://' + data.endpointAddress)
            }
        });
    });
}

let publishToTopic = (topic, message, endpoint, accessParams) => {
    const params = {
        topic: topic,
        payload: JSON.stringify(message),
        qos: 1
    };
    const client = new IoTDataPlaneClient({
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        }
    });
    const command = new PublishCommand(params);
    return new Promise((resolve, reject) => {
        client.send(command, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
};

const thingDetails = async (data, accessParams) => {
    const params = {
        queryString: `thingName:${data.PrimaryRegion.ThingName}`
    }
    const iotClient = new IoTClient({
        region: region,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        }
    });
    try {
        const command = new SearchIndexCommand(params);
        return await iotClient.send(command);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    publishToTopic, fetchIoTEndpoint, thingDetails
}
