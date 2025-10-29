const axios = require('axios');

const getProtonToken =  (protonConfig) => {
    return new Promise((resolve, reject) => {
        const url = `${protonConfig?.TokenAPIEndpoint}/${protonConfig?.ClientId}?secret=${protonConfig?.ClientSecret}`
        const config = {
            method: 'GET',
            url: url,
            headers: {
                'Ocp-Apim-Subscription-Key': protonConfig?.OcpApimSubscriptionKey,
            }
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response?.data)));
          })
          .catch(function (error) {
              console.log(error);
              resolve(error.response.data)
          });
    })
}

const sendTransaction = (protonConfig, token, transaction) => {
    return new Promise((resolve, reject) => {
        const url = `${protonConfig?.TransactionServicesAPIEndpoint}`
        const config = {
            method: 'POST',
            url: url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': protonConfig?.TransactionOcpApimSubscriptionKey,
            },
            data: {
                transactions: transaction
            }
        };
        axios(config)
          .then(function (response) {
              console.log(response.data);
              resolve(response.data);
          })
          .catch(function (error) {
              resolve(error.response.data)
          });
    })
}

module.exports = {
    getProtonToken,
    sendTransaction
}