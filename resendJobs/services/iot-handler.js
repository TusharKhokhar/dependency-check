const { IoTClient, DescribeEndpointCommand, SearchIndexCommand } = require('@aws-sdk/client-iot');
const { IoTDataPlaneClient, PublishCommand } = require('@aws-sdk/client-iot-data-plane');

const retrieveEndpoint = (region, accessParams) => {
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

const publishToTopic = (topic, message, endpoint, accessParams) => {
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

const onlineStatus = async (params, region, accessParams) => {
  const allThings = [];
  return new Promise((resolve, reject) => {
    console.log(data);
    let params = {
      queryString: `thingName:${data.PrimaryRegion.ThingName}`
    };
    const iotClient = new IoTClient({
      region,
      credentials: {
        accessKeyId: accessParams.accessKeyId,
        secretAccessKey: accessParams.secretAccessKey,
        sessionToken: accessParams.sessionToken,
      },
    });
    try {
      const command = new SearchIndexCommand(params);
      const data = await iotClient.send(command);
      allThings.push(...(data.things || []));
    } catch (error) {
      throw error;
    }
  })
};

module.exports = {retrieveEndpoint, publishToTopic, onlineStatus }
