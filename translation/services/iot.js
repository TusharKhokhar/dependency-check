const { region} = require('../config/config')
const { IoTClient, DescribeEndpointCommand } = require('@aws-sdk/client-iot');
const { IoTDataPlaneClient, PublishCommand } = require('@aws-sdk/client-iot-data-plane');


const publishToken = async (data, region, accessParams, endPoint) => {
    const iotDataClient = new IoTDataPlaneClient({
        endpoint: `https://${endPoint}`,
        region: region,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        }
    });
    const params = {
        topic: data.topic, /* required */
        payload: JSON.stringify(data.payload),
        qos: 0
    }
    try {
        const command = new PublishCommand(params);
        return await iotDataClient.send(command);
    } catch (err) {
        throw err;
    }
}

const retrieveEndpoint = async (region, accessParams) => {
    const iotClient = new IoTClient({
        region: region,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        }
    });
    const params = { endpointType: 'iot:Data-ATS' };
    try {
        const command = new DescribeEndpointCommand(params);
        const data = await iotClient.send(command);
        return data.endpointAddress;
    } catch (err) {
        throw err;
    }
};

const publishToTopic = async (topic, message, endpoint, accessParams) => {
    const iotDataClient = new IoTDataPlaneClient({
        endpoint: `https://${endpoint}`,
        region: region,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        }
    })
    const params = {
        topic: topic,
        payload: JSON.stringify(message),
        qos: 1,
    };
    console.log(params);
    console.log(message);

    try {
        const command = new PublishCommand(params);
        const data = await iotDataClient.send(command);
        console.log(data);
        return data;
    } catch (err) {
        console.log('error ', err);
        throw err;
    }
}
module.exports = { publishToken, retrieveEndpoint, publishToTopic }
