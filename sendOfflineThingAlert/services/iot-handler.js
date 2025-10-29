const { IoTClient, SearchIndexCommand } = require("@aws-sdk/client-iot");
const {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();

const MAX_RESULT_PER_PAGE = 100;

const fetchAllOfflineThings = async (region, accessParams) => {
  const currentTime = new Date().getTime();
  const twentyFourHoursAgo = currentTime - 24 * 60 * 60 * 1000;

  const params = {
    queryString: `connectivity.connected:false AND connectivity.timestamp <= ${twentyFourHoursAgo}`,
    maxResults: MAX_RESULT_PER_PAGE,
  };

  try {
    const allThings = await fetchAllThings(params, region, accessParams);
    return allThings;
  } catch (error) {
    throw error;
  }
};

const fetchAllThings = async (params, region, accessParams) => {
  const allThings = [];

  const recursiveFetch = async (params, region) => {
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

      if (data.nextToken) {
        await recursiveFetch({ ...params, nextToken: data.nextToken }, region);
      } else {
        return allThings;
      }
    } catch (error) {
      throw error;
    }
  };

  try {
    await recursiveFetch(params, region);
    return allThings;
  } catch (error) {
    throw error;
  }
};

const fetchAllDuplicateThing = async (region, accessParams, startTime, onBatch) => {
  try {
    const logsClient = new CloudWatchLogsClient({
      region: region,
      credentials: accessParams,
    });
    let nextToken;
    const healthCheckClientId = `healthcheck-iot-service-auto-${region}`;
    const filterPattern = `{ $.disconnectReason = "DUPLICATE_CLIENTID" && $.clientId != "${healthCheckClientId}" }`;

    do {
      const params = {
        logGroupName: "AWSIotLogsV2",
        startTime,
        filterPattern,
        nextToken,
        limit: 10000,
      };

      const result = await logsClient.send(new FilterLogEventsCommand(params));

      if (result.events && result.events.length > 0) {
        const parsed = result.events.map(e => JSON.parse(e.message));
        await onBatch(parsed);
      }

      nextToken = result.nextToken;
    } while (nextToken);

  } catch (error) {
    log.error("Error in fetchAllDuplicateThing:", error)
    throw error;
  }
};

module.exports = { fetchAllThings, fetchAllOfflineThings, fetchAllDuplicateThing };
