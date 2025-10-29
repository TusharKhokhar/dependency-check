const MongoClient = require('mongodb').MongoClient
const { MongoDB, localDatabase, region } = require('./config')
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const stsClient = new STSClient({
    region,
});

let _db
let premDb
let client
let credentialsExpiration;

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
            client.close()
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
    }
}

let connectToServer = async () => {

    const command = new AssumeRoleCommand({
        RoleArn: process.env.MongoDBReadWriteAccess,
        RoleSessionName: 'AccessMongoDB'+Date.now().toString()
    });
    const { Credentials } = await stsClient.send(command);

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
    const mongoClient = new MongoClient(url.toString());
    client = await mongoClient.connect();
}
