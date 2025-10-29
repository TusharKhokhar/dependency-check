const axios = require('axios');
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

const getProtonToken = async (protonConfig) => {
    return new Promise((resolve, reject) => {
        try {
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
                  log.error('error:', error);
                  reject(error);
              });
        } catch (e) {
            log.error('Response status:', e.response);
        }
    })
}

const sendTransaction = async (protonConfig, token, transaction, log) => {
    return new Promise((resolve, reject) => {
        try {
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
                    transactions: [transaction]
                }
            };
            axios(config)
              .then(function (response) {
                  console.log(response.data);
                  log.info('send transaction success');
                  resolve(response?.data?.jobId);
              })
              .catch(function (error) {
                  console.log('Response status:', error?.response?.status);
                  console.log('Response data:', error?.response?.data);
                  reject(error);
              });
        } catch (e) {
            log.error('Response status:', e.response);
        }
    })
}

module.exports = {
    getProtonToken,
    sendTransaction
}