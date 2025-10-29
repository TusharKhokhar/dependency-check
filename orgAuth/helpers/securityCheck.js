const {getObjectId: ObjectId} = require("./objectIdConvertion");
const {domainName} = require("../config/config");

module.exports.securityInterceptor = async ( authId, orgId, redirectURI, db, res) => {
    if (orgId) {
        if (orgId === "admin") {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unauthorized`)
        }
        const customer =  await db.collection('Customers').findOne({ DomainName: orgId, IsDeleted: false, IsActive: true })
        const identityProviderData = await db.collection('AuthProviders').findOne(
            {
                _id: ObjectId.createFromHexString(authId), IsDeleted: false,
                IsActive: true, CustomerID: customer._id
            })
        if (!identityProviderData) {
            return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unauthorized`)
        } else {
            redirectUrlValidate(redirectURI, orgId, res)
            return true
        }
    }
}

const redirectUrlValidate = (redirectURI, orgId, res) => {
    const whitelistUrls = [
        `https://${orgId}.${domainName}`,
        `https://api.${domainName}`,
        `https://${orgId}.eprintitsaas.org`,
        `https://eprintit.com`,
        'ponauth://oauthredirect',
        `https://mobile.${domainName}`,
        'http://127.0.0.1:12000/index.html',
        `https://pwa.${domainName}`,
    ];

    if (!redirectURI) {
        return true;
    }

    const isWhitelisted = whitelistUrls.some(url => redirectURI.includes(url));

    if (isWhitelisted) {
        return true;
    } else {
        return res.redirect(`https://${orgId}.${domainName}/user/sign-in?error=unauthorized`);
    }
};
