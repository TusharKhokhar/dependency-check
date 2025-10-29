const { bucketName } = require('../config/config');

const generatePolicy = (version, statements) => ({
    policy: JSON.stringify({
        Version: version,
        Statement: statements
    })
});

module.exports.iotPolicy = async () => generatePolicy("2012-10-17", [
    {
        "Effect": "Allow",
        "Action": ["iot:*"],
        "Resource": "*"
    }
]);

module.exports.emailPolicy = async () => generatePolicy("2008-10-17", [
    {"Effect": "Allow", "Action": "ses:SendRawEmail", "Resource": "*"},
    {"Effect": "Allow", "Action": "ses:SendEmail", "Resource": "*"}
]);

module.exports.fetchSignedUrlEmailServicePolicy = async (parameters) => generatePolicy("2008-10-17", [
    {
        "Sid": "fetchObjectFromS3Bucket",
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:ListBucket"],
        "Resource": `arn:aws:s3:::${bucketName}/Failed/${parameters.CustomerID}/*`
    },
    {"Effect": "Allow", "Action": ["ses:SendRawEmail", "ses:SendEmail"], "Resource": "*"}
]);