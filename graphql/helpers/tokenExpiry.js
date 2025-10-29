const {apiKey} = require('../config/config')

module.exports = {
    tokenInvalidateMapper: (user, api, decoded) => {
        try {
            const keyName = Object.keys(apiKey).find(k => apiKey[k] === api);
            return user['LoginSession'][keyName].toString() !== decoded.iat.toString()
        } catch (e) {
            console.log(e);
            return false
        }
    }
}