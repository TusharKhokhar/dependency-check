if (process.env.environment !== 'server') {
  // eslint-disable-next-line
  var envJson = require('../../environment.json')
}

module.exports = {
  ERROR_MESSAGE: 'Request received is invalid',
  REPORTS: 'reports',
  KIOSK_RESTART: 'kiosk restart',
  KIOSK_RESTART_ACTION: 'restartKiosk',
  bucketName: process.env.S3BucketTenantUploads,
  roleArn: process.env.roleName,
  region: process.env.region,
  primaryRegion: process.env.region === 'us-east-1'? 'us-east-1' : 'us-west-2' ,
  Stage: process.env.Stage ? process.env.Stage: 'dev',
  secondaryRegion:  process.env.region === 'us-east-1'? 'us-west-2' : 'us-east-1' ,
  secretAccessKey: process.env.dbName,
  accessKeyId: process.env.dbName,
  awsAccountNumber: process.env.awsAccountNumber,
  roleName: process.env.roleName,
  domainName: process.env.domainName,
  localDatabase: process.env.dbName,
  graphQlEndpoint: '',
  mongoDBLocal: process.env.mongoDBConnection,
  MongoDB: process.env.mongoDBConnection,
  bucketNameConverted: process.env.S3BucketTenantUploadsConverted,
  stage: process.env.stage,
  server: process.env.environment ? process.env.environment : envJson.SERVER,
  algorithmName: process.env.algorithmName || 'aes256',
  algorithmNameInt: process.env.algorithmNameInt || 'aes-192-cbc',
  ivValue: process.env.algorithmNameInt || 'E-PRINT-IT-SAAS1',
  secretEncryptionKeys: process.env.secretEncryptionKeys || 'tbs-ppl-encryption111111',
  secretEncryptionKeysIoT: process.env.secretEncryptionKeys || 'tbs-ppl-encryption',
  websocketApiId: process.env.websocketApiId,
  basePath: process.env.domainName ? `https://${process.env.domainName}/public` : 'http://localhost:4000/public',
  envDomain: process.env.domainName ? process.env.domainName.split('.')[2] : '3000'

}
