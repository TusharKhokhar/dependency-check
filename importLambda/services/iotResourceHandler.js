const {iotPolicy} = require("./policy");
const {getStsCredentials} = require("./sts");
const {
    createThing,
    fetchCaCertificate,
    getPrivateKeyToSignCert,
    registerDeviceCert,
    createPolicy,
    attachPrincipalPolicy,
    attachCertificateWithThing,
    encryptIoTCertificate
} = require("./iot-handler");
const {createDeviceCert} = require("./cert");

const createIoTResources = async (data, region) => {
    try {
        const policy = await iotPolicy();
        const credentials = await getStsCredentials(policy);
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken,
        };
        const iotData = await createThing(data, region, accessParams);
        const { certificateDescription: { certificatePem } } = await fetchCaCertificate(region, accessParams);
        const signerPrivateKey = await getPrivateKeyToSignCert(region);
        const { certificate: deviceCerts, privateKey: devicePrivateKey } = await createDeviceCert(certificatePem, signerPrivateKey, data.iotThingName);
        const certificateData = await registerDeviceCert(region, accessParams, deviceCerts, certificatePem);
        const policyData = await createPolicy(data, iotData, region, accessParams);
        await attachPrincipalPolicy(policyData, certificateData, region, accessParams);
        await attachCertificateWithThing(iotData, certificateData, region, accessParams);
        const privateKey = await encryptIoTCertificate(devicePrivateKey);
        return { iotData, certificateData, policyData, privateKey, deviceCerts };
    } catch (e) {
        console.log("e********", e);
        return e;
    }
};

const createIoTResourcesSecondaryRegion = async (data, region, deviceCerts, devicePrivateKey) => {
    const policy = await iotPolicy();
    const credentials = await getStsCredentials(policy);
    const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken,
    };
    const iotData = await createThing(data, region, accessParams);
    const { certificateDescription: { certificatePem } } = await fetchCaCertificate(region, accessParams);
    const certificateData = await registerDeviceCert(region, accessParams, deviceCerts, certificatePem);
    const policyData = await createPolicy(data, iotData, region, accessParams);
    await attachPrincipalPolicy(policyData, certificateData, region, accessParams);
    await attachCertificateWithThing(iotData, certificateData, region, accessParams);
    return { iotData, certificateData, policyData, deviceCerts, devicePrivateKey };
};

module.exports = {
    createIoTResources,
    createIoTResourcesSecondaryRegion
};