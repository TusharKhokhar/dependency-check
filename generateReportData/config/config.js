if(process.env.environment !== 'server'){
    var envJson = require('../../environment.json')
}

module.exports = {
    STANDARD_TIER: 'standard',
    REGION: process.env.region || 'us-east-1',
    API_KEY: process.env.apiKey ?  process.env.apiKey : 'cweex23xieo2hznx2ln3hr8ru23crucl',
    DOMAIN_NAME: process.env.domainName || 'eprintitsaas.org',
    ERROR_MESSAGE: 'Something went wrong while generating reports data',
    FUNCTION_NAME_JS: process.env.functionName || 'bigxpose-staging-WebSocketAPIs-1SJQ7OORS-jsReports-1eII6DeQczCU',
    S3_BUCKET_NAME: process.env.S3BucketTenantUploads
        ? process.env.S3BucketTenantUploads
        : envJson.BUCKETNAME,
    Stage: process.env.stage ? process.env.stage: 'dev',
    secondaryRegion:  process.env.region === 'us-east-1'? 'us-west-2' : 'us-east-1' ,
    localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
    mongoDBLocal: process.env.environment === 'server' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL,
    MongoDB: process.env.environment === 'server' ? process.env.mongoDBConnection
        : envJson.MONGODBLOCAL,
    stage: process.env.stage ? process.env.stage : envJson.STAGE,
    awsAccountNumber: process.env.awsAccountNumber,
    server: process.env.environment,
    ROLE_NAME: process.env.roleName,
}