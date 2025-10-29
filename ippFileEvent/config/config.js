if (process.env.environment !== 'server') {
  // eslint-disable-next-line
  var envJson = require('../../environment.json')
}

module.exports = {
  region: process.env.region ? process.env.region : envJson.REGION,
  primaryRegion: process.env.region === 'us-east-1' ? 'us-east-1' : 'us-west-2',
  secondaryRegion: process.env.region === 'us-east-1' ? 'us-west-2' : 'us-east-1',
  awsAccountNumber: process.env.awsAccountNumber ? process.env.awsAccountNumber : envJson.AWSACCOUNTNUMBER,
  domainName: process.env.domainName ? process.env.domainName : envJson.DOMAINNAME,
  localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
  mongoDBLocal: process.env.environment === 'server'  || process.env.environment === 'test' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL,
  MongoDB: process.env.environment === 'server' || process.env.environment === 'test'
    ? process.env.mongoDBConnection
    : envJson.MONGODBLOCAL,
  server: process.env.environment ? process.env.environment : envJson.SERVER,
  bucketNameConverted: process.env.S3BucketTenantUploadsConverted || envJson.BUCKETNAMECONVERTED,
}
