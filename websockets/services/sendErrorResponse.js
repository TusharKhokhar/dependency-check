const {domainName, apiKey:{web: API_KEY}, ERROR_MESSAGE, KIOSK_RESTART, REPORTS} = require("../config/config");
const axios = require('axios')

module.exports.sendError = async (sessionId, flag) => {
    let errorMesg = ''
    let finalMesg = ''
    if( flag===  true || flag === false){
        errorMesg = flag ? KIOSK_RESTART: REPORTS
        finalMesg = ERROR_MESSAGE
    } else {
        errorMesg = null
        finalMesg = flag
    }
    const config = {
        method: 'post',
        url: `https://api.${domainName}/public/sendStatus`,
        headers: {
            'apikey': API_KEY
        },
        data: {
            sessionId,
            status: false,
            message: finalMesg,
            action: errorMesg,
            dataUrl: null
        },
    };
    console.log(config.data);
    await axios(config)
        .then(function (response) {
            console.log('RES ', response)
            return JSON.parse(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log('ERROR', error)
            return error;
        });
}
