const {config} = require("../configs/config");
module.exports.getEvent = (body) => {
    return {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(body),
        isBase64Encoded: false,
    };
}