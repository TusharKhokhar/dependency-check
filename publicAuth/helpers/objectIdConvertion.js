const {ObjectId} = require("mongodb");
const crypto = require('crypto');

module.exports.getObjectId = {
  createFromHexString: (id) => {
    if (!id) {
        console.log('id*****',id);
        return ObjectId.createFromHexString(generateRandomHexString(24))
    }
    if (id instanceof ObjectId) {
        return id;
    }
    try {
        return ObjectId.createFromHexString(id);
    } catch (error) {
        console.error('Invalid ObjectId:', error.message);
        console.error(id);
        throw new Error('Invalid ObjectId');
    }
    }
}

const generateRandomHexString = (length) => {
    // Each byte is represented by 2 hex characters, so we need length / 2 bytes
    const bytes = Math.ceil(length / 2);
    const buffer = crypto.randomBytes(bytes);
    return buffer.toString('hex').slice(0, length);
}