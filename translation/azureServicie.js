const { StorageSharedKeyCredential, generateBlobSASQueryParameters, SASProtocol,
    AccountSASPermissions
} = require('@azure/storage-blob');
const dayjs = require('dayjs');

module.exports.generateSASToken =  async (azureSecrets, containerName) => {
    const accountName = azureSecrets.accountName;
    const accountKey = azureSecrets.accountKey;
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const startDate = new Date();
    const expiryDate = dayjs(startDate).add(1, 'hour').toDate();
    const permissions = new AccountSASPermissions();
    permissions.write = true;
    permissions.read = true;
    permissions.list = true;
    const sasToken = generateBlobSASQueryParameters({
        containerName,
        permissions,
        startsOn: startDate,
        expiresOn: expiryDate,
        protocol: SASProtocol.Https
    }, sharedKeyCredential).toString();
    return `https://${accountName}.blob.core.windows.net/${containerName}/?${sasToken}`;
}

module.exports.generateSASTokenBlob =  async (azureSecrets, containerName, blobName) => {
    const accountName = azureSecrets.accountName;
    const accountKey = azureSecrets.accountKey;
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const startDate = new Date();
    const expiryDate = dayjs(startDate).add(1, 'hour').toDate();
    const permissions = new AccountSASPermissions();
    permissions.write = true;
    permissions.read = true;
    permissions.list = true;
    const sasToken = generateBlobSASQueryParameters({
        containerName,
        permissions,
        startsOn: startDate,
        expiresOn: expiryDate,
        protocol: SASProtocol.Https
    }, sharedKeyCredential).toString();
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}