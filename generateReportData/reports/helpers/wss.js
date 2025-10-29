const {DOMAIN_NAME, API_KEY, ERROR_MESSAGE} = require("../../config/config");
const axios = require("axios");
module.exports.sendToWss = async (sessionId, message, dataUrl = null, status = false, accessParams) => {
    const config = {
        method: 'post',
        url: `https://api.${DOMAIN_NAME}/public/sendStatus`,
        headers: {
            'apikey': API_KEY
        },
        data: {
            sessionId,
            status: status,
            action: 'reports',
            message: message,
            accessFile: accessParams,
            releaseCode: 'reports',
            region: process.env.region,
            dataUrl: dataUrl
        }
    };
    console.log(config.data)
    await axios(config)
      .then(function (response) {
          // console.log('RES ', response)
          return JSON.parse(JSON.stringify(response.data));
      })
      .catch(function (error) {
          console.log('ERROR', error)
          return error;
      });
}