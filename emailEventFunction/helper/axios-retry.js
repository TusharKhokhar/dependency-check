const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const { axiosMaxRetries } = require('../config')

async function axiosWithRetry(config = {}) {
  const axiosClient = axios.create();

  axiosRetry(axiosClient, {
    retries: parseInt(axiosMaxRetries),
    retryDelay: axiosRetry.exponentialDelay,
    onRetry: (retryCount, error) => {
      console.log(
        `Retrying request (attempt ${retryCount}) → ${error.message}`
      );
    },
    retryCondition: (error) =>
      error.response?.status === 503 || error.response?.status === 500,
  });

  const response = await axiosClient(config);
  return response?.data;
}

module.exports = axiosWithRetry;
