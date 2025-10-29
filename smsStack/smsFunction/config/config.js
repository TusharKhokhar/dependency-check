
module.exports = {
  MongoDB: process.env.mongoDBConnection || envJson.MONGODBLOCAL,
  region: process.env.region ? process.env.region : envJson.REGION,
  localDatabase: process.env.dbName || envJson.DBNAME
}
