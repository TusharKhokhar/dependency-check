module.exports = {
  MongoDB: process.env.mongoDBConnection || 'mongodb+srv://easybookingtbs:NMcFlIKjFZrWA6dL@main.uh6ww.mongodb.net/',
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  roleName: process.env.roleName ? process.env.roleName : 'local-sts-credentialTestingRole',
  localDatabase:  process.env.dbName || 'saas-dev',
  stage: process.env.stage ? process.env.stage : 'Prod',
}