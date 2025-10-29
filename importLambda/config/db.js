const MongoClient = require('mongodb').MongoClient
const { MongoDB, localDatabase, region, server, awsAccountNumber} = require('./config')
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const {setDbString} = require("./memoryDb");

const stsClient = new STSClient({
  region,
});

let _db
let premDb
let client
let credentialsExpiration;
let premConnectDbs = {
}

module.exports = {
  getDb: async (flag) => {
    if (!client || new Date() > new Date(credentialsExpiration)) {
      console.log('Creating new db connection...')
      await connectToServer()
      _db = await client.db(localDatabase)
      return _db
    } else if (!_db) {
      _db = await client.db(localDatabase)
      return _db
    } else if (flag) {
      console.log('topology was closed reconnecting again')
      await connectToServer()
      _db = await client.db(localDatabase)
    } else {
      console.log('Using already connected database')
      return _db
    }
  },
  closeDb: () => {
    if (client) {
      client.disconnect()
    }
  },
  switchDb: async (db) => {
    if (!client || new Date() > new Date(credentialsExpiration)) {
      await connectToServer()
      console.log(`new client connected switching to: ${localDatabase}-${db}`)
      premDb = client.db(`${localDatabase}-${db}`)
      return premDb
    } else {
      console.log(`switching to database: ${localDatabase}-${db}`)
      premDb = client.db(`${localDatabase}-${db}`)
      return premDb
    }
  },
  isolatedDatabase: async (domain) => {
    // eslint-disable-next-line
    (!client || new Date() > new Date(credentialsExpiration)) ? await connectToServer() : undefined
    if (!(`${localDatabase}-${domain}` in premConnectDbs)) {
      console.log(`Premium database connection not found so connecting to: ${localDatabase}-${domain}`)
      const connection = client.db(`${localDatabase}-${domain}`)
      console.log('Assigning db connection to premium db object')
      Object.assign(premConnectDbs, { [`${localDatabase}-${domain}`]: connection })
      return connection
    } else {
      console.log(`Accessing premium database: ${localDatabase}-${domain}`)
      return premConnectDbs[`${localDatabase}-${domain}`]
    }
  }
}

const connectToServer = async () => {
  if (server && server === 'local') {
    client = new MongoClient(MongoDB)
    return await client.connect()
  } else if (server && server === 'test') {
    const conStr = await setDbString()
    process.env.mongoDBConnection = conStr
    client = new MongoClient(conStr)
    return await client.connect()
  }   else {
    const command = new AssumeRoleCommand({
      RoleArn: `arn:aws:iam::${awsAccountNumber}:role/MongoDBReadWriteAccess`,
      RoleSessionName: `AccessMongoDB-${Date.now().toString()}`,
      DurationSeconds: 3600
    });
    const { Credentials } = await stsClient.send(command);
    if (!Credentials) {
      throw new Error('Failed to assume mongo db IAM role');
    }
    const {AccessKeyId, SessionToken, SecretAccessKey, Expiration } = Credentials;
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
    const mongoClient = new MongoClient(url.toString());
    client = await mongoClient.connect();
    console.log('Successfully connected to mongo db, returning mongo client');
  }
}
