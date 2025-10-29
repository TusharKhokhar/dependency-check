if (process.env.environment !== 'server') {
    var envJson = require('../environment.json')
}
module.exports = {
    apiKey: process.env.publicApiId ?  process.env.publicApiId : 'cweex23xieo2hznx2ln3hr8ru23crucl',
    basePath: process.env.domainName ? `https://${process.env.domainName}/public` : 'http://localhost:4000/public',
    envDomain: process.env.domainName ? process.env.domainName.split('.')[2] : 'org',
    urlDomain: process.env.urlDomain,
    bucketName: process.env.bucketName,
    minimumAttachmentSize: process.env.minimumAttachmentSize ? process.env.minimumAttachmentSize : 7 ,// In Kb
    maximumAttachmentLimit : process.env.maximumAttachmentLimit ? process.env.maximumAttachmentLimit : 25,
    MongoDB: process.env.environment === 'server' || process.env.environment === 'test'
    ? process.env.mongoDBConnection
    : envJson.MONGODBLOCAL,
    localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
    awsAccountNumber: process.env.awsAccountNumber ? process.env.awsAccountNumber : envJson.AWSACCOUNTNUMBER,
    server: process.env.environment ? process.env.environment : envJson.SERVER,
    region: process.env.region ? process.env.region : envJson.REGION,
    axiosMaxRetries: process.env.axiosMaxRetries ? process.env.axiosMaxRetries : "3"
}
