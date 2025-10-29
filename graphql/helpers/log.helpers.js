const log = require('./logger');
const {REDACTED} = require("./constants");

const sanitizeEvent = obj => {
    const keys = [ 'Authorization', 'password', 'Password', 'authorization',
        'Secret', 'ClientId', 'ClientSecret', 'PAPIAccessKey', 'BindCredential', 'Certificate']
    // Check if the object is null or not an object
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    // Iterate through each key in the object
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            keySanitize(keys, key, obj)
        }
    }
    return obj
};

const keySanitize = (keys, key, obj) => {
    // If the current key is 'password', hash its value
    if ((keys.includes(key)) && typeof obj[key] === 'string') {
        obj[key] = REDACTED;
    }
    if (key === 'multiValueHeaders' && typeof obj[key] === 'object') {
        obj[key] = {};
    }
    // If the current value is an object, recursively call the function
    if (typeof obj[key] === 'object') {
        sanitizeEvent(obj[key]);
    }
}

const sanitize = (obj) => {
    try {
        let objectSanitized = ''
        if (typeof obj === 'string') {
            objectSanitized = parsedString(obj)
        } else {
            objectSanitized = parsedJsonString(obj)
        }
        sanitizeEvent(objectSanitized)
        if (objectSanitized?.body) {
            const body = typeof objectSanitized.body === 'string' ? JSON.parse(objectSanitized.body) : objectSanitized.body
            sanitizeEvent(body)
            objectSanitized.body = body
        }
        return objectSanitized
    } catch (error) {
        log.error("error in the sanitization")
        return obj
    }
}

const parsedString = (str) => {
    try {
        return JSON.parse(str)
    } catch (e) {
        return str;
    }
}

const parsedJsonString = (str) => {
    try {
        return JSON.parse(JSON.stringify(str))
    } catch (e) {
        return str;
    }
}

module.exports = { sanitize, sanitizeEvent };