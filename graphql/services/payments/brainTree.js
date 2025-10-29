const braintree = require("braintree");
const { Stage } = require('../../config/config')

const generateBraintreeToken = async (encryptedData) => {
    const { MerchantId, PublicKey, PrivateKey } = encryptedData.Braintree
    try {
        const gateway = new braintree.BraintreeGateway({
            environment: Stage === 'prod' ? braintree.Environment.Production : braintree.Environment.Sandbox,
            merchantId: MerchantId,
            publicKey: PublicKey,
            privateKey: PrivateKey
        })
        const token = await gateway.clientToken.generate({})
        return token.clientToken
    } catch (e) {
        console.log(e);
        throw new Error(e)
    }
}

module.exports = generateBraintreeToken