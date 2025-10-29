if(process.env.environment !== 'server'){
  var envJson = require('../../environment.json')
}

module.exports = {
  MongoDB: process.env.mongoDBConnection || envJson.MONGODBLOCAL,
  region: process.env.region ? process.env.region : envJson.REGION,
  roleName: process.env.roleName ? process.env.roleName : envJson.ROLENAME,
  localDatabase: process.env.dbName || envJson.DBNAME,
  awsAccountNumber: process.env.awsAccountNumber ? process.env.awsAccountNumber : envJson.AWSACCOUNTNUMBER,
}