const axios = require('axios')
const {apiKey, contentType, path, pathServices} = require('./config');

exports.handler = function (event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    if (key.includes('TranslationService')) {
        if (key.includes('Converted')){
            console.log('skipping translation converted event');
        } else {
            translationJob(key).then(response => {
                console.log('status sent', response);
            }).catch(error => {
                console.log('error occurred', error);
            })
        }
    } else {
        let splitKey = key.split('/')
        let customerId = splitKey[1]
        let fileName = splitKey[splitKey.length - 1]
        const config = {
            method: 'put',
            url: `https://${process.env.domainName}/${path}`,
            headers: {'apikey': apiKey['web'], 'Content-Type': contentType},
            data: {
                "fileName": fileName,
                "customerId": customerId
            },
        };
        axios(config)
          .then(function (response) {
              return JSON.parse(JSON.stringify(response.data));
          })
          .catch(function (error) {
              return error;
          });
    }
};


const translationJob = async (key) => {
    let splitKey = key.split('/')
    let customerId = splitKey[2]
    let fileName = splitKey[splitKey.length - 1]
    const config = {
        method: 'put',
        url: `https://${process.env.domainName}/${pathServices}`,
        headers: {'apikey': apiKey['web'], 'Content-Type': contentType},
        data: {
            "fileName": fileName,
            "customerId": customerId
        },
    };
    axios(config)
      .then(function (response) {
          return JSON.parse(JSON.stringify(response.data));
      })
      .catch(function (error) {
          return error;
      });
}