const MongoClient = require('mongodb').MongoClient
const {localDatabase, MongoDB, awsAccountNumber, server} = require('./config')
const {
  STS
} = require("@aws-sdk/client-sts")
const { setDbString } = require('./memoryDB');
const sts = new STS();

let _db
let premDb
let client
let credentialsExpiration;
let premConnectDbs = {
}

module.exports = {
  getDb: async () => {
    if (!client || new Date() > new Date(credentialsExpiration)) {
      console.log('Creating new db connection...')
      await connectToServer()
      _db = await client.db(localDatabase)
      return _db
    } else if (!_db) {
      _db = await client.db(localDatabase)
      return _db
    } else {
      console.log('Using already connected database')
      return _db
    }
  },
  closeDb: () => {
    if (client) {
      client.closeDb()
    }
  },
  switchDb: async (db) => {
    if(!_db || new Date() > new Date(credentialsExpiration)){
      await connectToServer()
    }
    premDb = await _db.switchDb(`${localDatabase}-${db}`)
    return premDb
  },
  isolatedDatabase: async (domain) => {
    (!client || new Date() > new Date(credentialsExpiration)) ? await connectToServer() : undefined
    if (!(`${localDatabase}-${domain}` in premConnectDbs)) {
      console.log(`Premium database connection not found so connecting to: ${localDatabase}-${domain}`)
      let connection = client.db(`${localDatabase}-${domain}`)
      console.log('Assigning db connection to premium db object');
      Object.assign(premConnectDbs, {[`${localDatabase}-${domain}`]: connection})
      return connection
    } else {
      console.log(`Accessing premium database: ${localDatabase}-${domain}`)
      return premConnectDbs[`${localDatabase}-${domain}`]
    }
  }
}

const connectToServer = async () => {
  if (server && server === 'test') {
    const conStr = await setDbString()
    process.env.mongoDBConnection = conStr
    client = new MongoClient(conStr)
    return await client.connect()
  } else {
    const { Credentials } = await sts
      .assumeRole({
        RoleArn: `arn:aws:iam::${awsAccountNumber}:role/MongoDBReadWriteAccess`,
        RoleSessionName: 'AccessMongoDB',
      });

    if (!Credentials) {
      throw new Error('Failed to assume mongo db IAM role');
    }
    const { AccessKeyId, SessionToken, SecretAccessKey, Expiration } = Credentials;
    credentialsExpiration = Expiration
    const encodedSecretKey = encodeURIComponent(SecretAccessKey);
    const combo = `${AccessKeyId}:${encodedSecretKey}`;
    const url = new URL(`mongodb+srv://${combo}@${MongoDB}.mongodb.net`);
    url.searchParams.set('authSource', '$external');
    url.searchParams.set(
      'authMechanismProperties',
      `AWS_SESSION_TOKEN:${SessionToken}`,
    );
    url.searchParams.set('w', 'majority');
    url.searchParams.set('retryWrites', 'true');
    url.searchParams.set('authMechanism', 'MONGODB-AWS');
    const mongoClient = new MongoClient(url.toString(), { useUnifiedTopology: true });
    client = await mongoClient.connect();
    console.log('Successfully connected to mongo db, returning mongo client');
  }
}
