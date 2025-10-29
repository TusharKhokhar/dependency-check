const {ObjectId : mongoObjectId} = require("mongodb");

const crypto = require("crypto");
const {ObjectId} = require("mongodb");
const dot = require('dot-object')


const generateRandomHexString = (length) => {
    // Each byte is represented by 2 hex characters, so we need length / 2 bytes
    const bytes = Math.ceil(length / 2);
    const buffer = crypto.randomBytes(bytes);
    return buffer.toString('hex').slice(0, length);
}
const value = generateRandomHexString(24)
    const id = new ObjectId();
const obj = {
    id: id,
    field: 24,
    gg: '24',
    ff: '24 ss',
}
const run = async () => {

        const { flatten } = await import('flat');
        console.log('*****',flatten(obj, {safe: false}));
}
const container = dot.dot(obj)
console.log('-----',JSON.stringify(container));
console.log(dot.dot(obj));
for (const key in obj) {
    console.log(typeof obj[key]);
    console.log(obj[key].length);
    if (mongoObjectId.isValid(obj[key])) {
        console.log('key*********',key);
        // obj[key] = ObjectId.createFromHexString(obj[key])
    }
}
