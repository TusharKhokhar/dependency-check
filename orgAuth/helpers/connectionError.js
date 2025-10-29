const connectionErrorCodes = {
  ECONNREFUSED:
    "The connection was refused by the server. Please check configuration",
  ETIMEDOUT: "The connection attempt timed out. Please check configuration",
  ENOTFOUND: "DNS lookup failed for hostname. Please check configuration",
};

const isConnectionError = (errorCode) => {
  if (errorCode && Object.keys(connectionErrorCodes).includes(errorCode)) {
    return true;
  }
  return false;
};

module.exports = {
  connectionErrorCodes,
  isConnectionError,
};
