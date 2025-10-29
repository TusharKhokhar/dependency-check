if(process.env.environment !== 'server'){
    var envJson = require('../environment.json')
}
module.exports = {
    region: process.env.region ? process.env.region : envJson.REGION,
    localDatabase: process.env.dbName ? process.env.dbName : envJson.DBNAME,
    mongoDBLocal: process.env.environment === 'server' ? process.env.mongoDBConnection : envJson.MONGODBLOCAL,
    MongoDB: process.env.environment === 'server' ? process.env.mongoDBConnection
        : envJson.MONGODBLOCAL,
    secretEncryptionKeys: process.env.secretEncryptionKeys || 'tbs-ppl-encryption',
    algorithmName: process.env.algorithmName || 'aes256',
}
