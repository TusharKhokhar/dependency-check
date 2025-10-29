if (process.env.environment !== 'server') {
  var envJson = require('../../environment.json')
}
module.exports = {
  primaryRegion: process.env.region === 'us-east-1' ? 'us-east-1' : 'us-west-2',
  region: process.env.region || 'us-east-1',
  Stage: process.env.Stage ? process.env.Stage : 'dev',
  secondaryRegion: process.env.region === 'us-east-1' ? 'us-west-2' : 'us-east-1',
  localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
  mongoDBLocal: process.env.environment === 'server' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL, // not in use
  // MongoDB: process.env.environment === 'server' ? process.env.mongoDBConnection : "mongodb://localhost:27017",
  MongoDB: process.env.environment === 'server' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL,
  server: process.env.environment ? process.env.environment : envJson.SERVER,
  excludedRoutes: ['/public/domainInfo', '/public/locate'],
  algorithmName: process.env.algorithmName || 'aes256',
  tokenExpiry: process.env.iotTokenExpiry || '12h',
  jwtTokenExpiry: process.env.jwtTokenExpiry || '24',
  refreshTokenExpiry: process.env.refreshTokenExpiry || '2d',
  domainName: process.env.domainName ? process.env.domainName : envJson.DOMAINNAME,
  secretEncryptionKeys: process.env.secretEncryptionKeys || 'tbs-ppl-encryption111111',
  secretEncryptionKeysIoT: process.env.secretEncryptionKeys || 'tbs-ppl-encryption',
  algorithmNameInt: process.env.algorithmNameInt || 'aes-192-cbc',
  ivValue: process.env.algorithmNameInt || 'E-PRINT-IT-SAAS1'
}