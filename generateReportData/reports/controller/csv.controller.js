const { csvReports } = require("../model/usages");
const { uploadCsvToS3 } = require("../../uploadToS3");
const { sendToWss } = require("../helpers/wss");
const { S3_BUCKET_NAME, awsAccountNumber, ROLE_NAME } = require("../../config/config");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const stsClient = new STSClient({
  region: process.env.region,
});

module.exports = {
  csvReport: async (db, filters, customerId, connectionId) => {
    const reportsData = await csvReports(db, filters);    
    if (reportsData) {
      const { dataUrlPath } = await uploadCsvToS3(reportsData, customerId);
      console.log("csv dataUrlPath=====>>>>", dataUrlPath);
      const policy = await getFilePolicy(dataUrlPath);
      const credentials = await getStsCredentials(policy)
      const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken,
            dataUrlPath: dataUrlPath,
            bucketName: S3_BUCKET_NAME
        };
      await sendToWss(
        connectionId,
        "CSV Report generated successfully",
        dataUrlPath,
        true,
        accessParams
      );
    } else {
      await sendToWss(connectionId, "Data not available");
    }
  },
};

let getFilePolicy = (path) => {
    return new Promise((resolve, reject) => {
        const action = 's3:GetObject'
        resolve({
            policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "allowRead",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}/${path}"
                    }
                ]
            }`
        })
    })
}

let getStsCredentials = async (policy) => {
    const params = {
        RoleArn: `arn:aws:iam::${awsAccountNumber}:role/${ROLE_NAME}`,
        Policy: policy.policy,
        RoleSessionName: Date.now().toString(),
    };

    try {
        const command = new AssumeRoleCommand(params);
        return await stsClient.send(command);
    } catch (error) {
        throw error;
    }
};
