const { IoTClient, SearchIndexCommand } = require('@aws-sdk/client-iot');
const { region } = require('../config/config');

const onlineStatus = async () => {
  const client = new IoTClient({ region });

  const params = {
    queryString: 'connectivity.connected:true',
    maxResults: 500,
  };

  try {
    const data = await client.send(new SearchIndexCommand(params));
    if (data.nextToken) {
      const moreThings = await anotherFunction(data.nextToken);
      data.things = moreThings.concat(data.things);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

const thingDetails = async (data, accessParams) => {
  const client = new IoTClient({
    region,
    credentials: {
      accessKeyId: accessParams.accessKeyId,
      secretAccessKey: accessParams.secretAccessKey,
      sessionToken: accessParams.sessionToken,
    },
  });

  const params = {
    queryString: `thingName:${data.PrimaryRegion.ThingName}`,
  };

  try {
    const data = await client.send(new SearchIndexCommand(params));
    return data;
  } catch (err) {
    throw err;
  }
};

const anotherFunction = async (token) => {
  const client = new IoTClient({ region });

  const params = {
    queryString: 'connectivity.connected:true',
    maxResults: 500,
    nextToken: token,
  };

  let thingResult = [];
  for (let index = 0; index < 10; index++) {
    try {
      const data = await client.send(new SearchIndexCommand(params));
      thingResult = thingResult.concat(data.things);
      if (!data.nextToken) {
        break;
      }
      params.nextToken = data.nextToken;
    } catch (err) {
      throw err;
    }
  }
  return thingResult;
};

module.exports = { anotherFunction, thingDetails, onlineStatus };