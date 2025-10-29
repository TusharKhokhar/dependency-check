const MongoClient = require('mongodb').MongoClient
const { MongoDB, localDatabase, region } = require('./config')
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const stsClient = new STSClient({
    region,
});

let _db
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
    }
}

const connectToServer = async () => {
    const command = new AssumeRoleCommand({
        RoleArn: process.env.MongoDBReadWriteAccess,
        RoleSessionName: "AccessMongoDB",
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
    console.log('Successfully connected to mongo db, returning mongo client');
}