const JWT = require('jsonwebtoken')
const fs = require('fs')
const publicKey = fs.readFileSync('./config/jwtRS256.key.pub')
const {
    apiKey: {web, mobile, desktop, windowsDriver, macOsDriver, hp, kiosk, chromeExtension}
} = require('../config/config')
const {ObjectId} = require("mongodb")

module.exports = {
    validateToken: ({token, db, apiKey}) => {
        return new Promise((resolve, reject) => {
            if (![web, mobile, desktop, windowsDriver, macOsDriver, hp, kiosk, chromeExtension].includes(apiKey) || !token) {
                reject({error: 401})
            } else {
                JWT.verify(token, publicKey, {algorithm: 'RS256'}, async (err, decoded) => {
                    if (err) {
                        reject({error: 401})
                    }
                    try {
                        const user = await db.collection('Users').findOne({_id: new ObjectId(decoded._id)})
                        if (!user || !user.IsActive || user.IsDeleted) {
                            reject({error: 401})
                        } else {
                            const customer = await db.collection('Customers').findOne({
                                _id: user.CustomerID,
                                IsDeleted: false
                            })
                            const customerIdsFilter = customer.SubCustomerID
                              ? customer.SubCustomerID
                              : []
                            customerIdsFilter.push(user.CustomerID)
                            decoded.user = user
                            decoded.customerIdsFilter = customerIdsFilter
                            decoded.customerIdsStrings = customerIdsFilter.length > 0 ?
                              customerIdsFilter.map(cus => cus.toString()) : []
                            resolve({
                                error: null,
                                decoded
                            })
                        }
                    } catch (e) {
                        reject({error: 401})
                    }

                })
            }
        })
    }
}
