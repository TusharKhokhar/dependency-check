const axios = require('axios');

module.exports.startTranslate = async (sourceContainerSasUrl, targetContainerSasUrl,
                                       sourceLang, targetLang, folder, subscriptionKey, translateAccount) => {
    const translateUrl = `https://${translateAccount}.cognitiveservices.azure.com`
    let data = JSON.stringify({
        "inputs": [
            {
                "source": {
                    "sourceUrl": sourceContainerSasUrl,
                    "filter": {
                        "prefix": folder,
                        "suffix": '.pdf'
                    },
                    "language": sourceLang,
                    "storageSource": "AzureBlob"
                },
                "targets": [
                    {
                        "targetUrl": targetContainerSasUrl,
                        "category": "general",
                        "language": targetLang,
                        "storageSource": "AzureBlob"
                    }
                ],
                "storageType": "Folder"
            }
        ]
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${translateUrl}/translator/document/batches?api-version=2024-05-01`,
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/json'
        },
        data : data
    };
    try {
        const response = await axios.request(config)
        return response.data
    } catch (error) {
        console.error(error)
        throw error
    }
}

module.exports.getTranslationStatus = async  (id, subscriptionKey, translateAccount) => {
    const translateUrl = `https://${translateAccount}.cognitiveservices.azure.com`
    const config = {
    method: 'get',
      maxBodyLength: Infinity,
      url: `${translateUrl}/translator/document/batches/${id}?api-version=2024-05-01`,
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
    },
};
    try {
        const response = await axios.request(config)
        console.log(response.data);
        return response.data
    } catch (e) {
        console.log('error: ',e);
        throw e
    }
}