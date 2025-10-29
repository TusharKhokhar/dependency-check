const crypto = require('crypto')
const { region, certSec, algorithmName, domainName} = require('../config/config')

const { IoTClient, DescribeEndpointCommand, DescribeCertificateCommand, SearchIndexCommand } = require('@aws-sdk/client-iot');
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
  return `iot.${domainName}`;
};

const decryptIoTCertificate = (certificate) => {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line node/no-deprecated-api
      const decipher = crypto.createDecipher(algorithmName, certSec)
      const decrypted = decipher.update(certificate, 'hex', 'utf8') + decipher.final('utf8')
      resolve(decrypted)
    } catch (e) {
      reject(e)
    }
  })
}

const fetchCertificatesById = async (data, region, accessParams) => {
  const iotClient = new IoTClient({
    region: region,
    credentials: {
      accessKeyId: accessParams.accessKeyId,
      secretAccessKey: accessParams.secretAccessKey,
      sessionToken: accessParams.sessionToken
    }
  });
    const params = { certificateId: data };
    try {
      const command = new DescribeCertificateCommand(params);
      return await iotClient.send(command);
    } catch (err) {
      throw err;
    }
}

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

module.exports = { publishToken, retrieveEndpoint, decryptIoTCertificate, fetchCertificatesById, publishToTopic, thingDetails }
