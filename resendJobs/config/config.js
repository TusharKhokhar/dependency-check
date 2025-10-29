if(process.env.environment !== 'server'){
  var envJson = require('../../environment.json')
}
module.exports = {
  bucketName: process.env.S3BucketTenantUploads
      ? process.env.S3BucketTenantUploads
      : envJson.BUCKETNAME,
  roleArn: process.env.roleName ? process.env.roleName : envJson.ROLENAME,
  region: process.env.region ? process.env.region : envJson.REGION,
  primaryRegion: process.env.region === 'us-east-1'? 'us-east-1' : 'us-west-2' ,
  Stage: process.env.Stage ? process.env.Stage: 'dev',
  secondaryRegion:  process.env.region === 'us-east-1'? 'us-west-2' : 'us-east-1' ,
  secretAccessKey: process.env.dbName ? process.env.dbName : envJson.SECRETACCESSKEY,
  accessKeyId: process.env.dbName ? process.env.dbName : envJson.ACCESSKEYID,
  awsAccountNumber: process.env.awsAccountNumber ? process.env.awsAccountNumber : envJson.AWSACCOUNTNUMBER,
  roleName: process.env.roleName ? process.env.roleName : envJson.ROLENAME,
  domainName: process.env.domainName ? process.env.domainName : envJson.DOMAINNAME,
  localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
  graphQlEndpoint: '',
  mongoDBLocal: process.env.environment === 'server' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL,
  MongoDB: process.env.environment === 'server' ? process.env.mongoDBConnection
      : envJson.MONGODBLOCAL,
  bucketNameConverted: process.env.S3BucketTenantUploadsConverted || envJson.BUCKETNAMECONVERTED,
  senderEmail: process.env.senderEmail ? process.env.senderEmail : envJson.SENDEREMAIL,
  clientDomain: process.env.clientDomain ? process.env.clientDomain : envJson.CLIENTDOMAIN,
  stage: process.env.stage ? process.env.stage : envJson.STAGE,
  server: process.env.environment ? process.env.environment : envJson.SERVER,
  websocketApiId: process.env.websocketApiId ? process.env.websocketApiId : envJson.WEBSOCKETAPIID,
  apiKey: {
      iOS: '3003a191-8f1c-4d81-a3c6-33eaebf60f18',
      android: '2a91bcb7-ba51-4760-91f4-c6aff09787bb',
      mobile: '266268a4-e631-45c6-8c38-2ecfce753794',
      web: 'cweex23xieo2hznx2ln3hr8ru23crucl',
      hp: '9f1bce25-d999-43a4-8986-ef4d671700c9',
      kiosk: '6ebc45b5-4c81-4f44-b7a2-6e912d59ff5e',
      desktop: 'bf9efb57-38da-4bb8-af47-0306c3730a9c',
    windowsDriver: '5f109aa7-b3c9-43e7-9a97-f98782eea3ee',
    chromeExtension: '9aacc070-f42b-49c5-8b75-be09a7ac441e',
    macOsDriver: '9f3b7652-dc01-431d-974d-51ead8f66806'
  },
  excludedRoutes: ['/public/domainInfo', '/public/locate'],
  OTP_EXPIRY: 600000,
  OTP_LENGTH: 6,
  jwtTokenExpiry: process.env.jwtTokenExpiry || '24',
  refreshTokenExpiry: process.env.refreshTokenExpiry || '2d',
  iotTokenExpiry: process.env.iotTokenExpiry  || '12h'
}
