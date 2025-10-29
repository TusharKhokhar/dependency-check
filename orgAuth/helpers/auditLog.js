const utcDateGet = () => {
  const date = new Date()
  const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds())
  return new Date(nowUtc)
}

module.exports = {
  sendAuditLogs: async (db, req, error, context) => {
    let obj = {};
    obj.Type = context.loginType;
    obj.Date = new Date();
    obj.CreatedAt = utcDateGet();
    obj.ErrorMessage = context?.errorCode || error?.code || error?.toString();
    obj.ErrorDescription =
      context?.errorDescription || error?.message || error?.toString();
    obj.StackTrace = error?.stack;
    obj.CustomerID = context?.customerId;
    obj.User = context?.user;
    obj.ApiKey =
      req.headers?.apikey || req.headers?.Apikey || req.headers?.apiKey;
    obj.RequestUrl = error?.config?.url;
    obj.RequestBody = error?.config?.data;
    obj.QueryParams = error?.config?.params;
    obj.RequestHeaders = error?.config?.headers;

    // Remove keys with null or undefined values
    Object.keys(obj).forEach((key) => {
      if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      }
    });
    
    await db.collection("AuditLogs").insertOne(obj);
  },
};