const crypto = require("crypto")
const fs =require( "fs");
const certificate = fs.readFileSync('./rootCAKey.key')

const algorithm = 'aes256'
const key = 'tbs-ppl-encryption'
const text = certificate
const cipher = crypto.createCipher(algorithm, key)
const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
console.log(encrypted)


//rootCAKey.key