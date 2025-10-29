const { BlobServiceClient, StorageSharedKeyCredential} = require('@azure/storage-blob');

module.exports.uploadFileToAzure = async (azureSecrets, blobName, url) => {
    const accountName = azureSecrets.accountName;
    const accountKey = azureSecrets.accountKey;
    const containerName = 'source';
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new StorageSharedKeyCredential(accountName, accountKey)
    );
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.syncCopyFromURL(url);
        console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.toString());
    } catch (error) {
        console.error('Error uploading file to blob:', error.message);
    }
}

