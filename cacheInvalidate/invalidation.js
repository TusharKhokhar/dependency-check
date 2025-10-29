const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const { CodePipelineClient, PutJobSuccessResultCommand } = require("@aws-sdk/client-codepipeline");
const { CloudFrontClient, ListDistributionsCommand, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");

const sts = new STSClient();

module.exports.handler = async (req, res) => {
    const codePipeline = new CodePipelineClient();
    let accessParams = await fetchCredentials(req);
    let reference = Date.now().toString();
    let cloudfront;

    if (accessParams) {
        console.log('accessParams*******', accessParams);
        cloudfront = new CloudFrontClient(accessParams);
        await clearCloudfrontCaches(cloudfront, codePipeline, reference, req);
    } else {
        console.log('No params since no account number is provided');
        cloudfront = new CloudFrontClient();
        await clearCloudfrontCaches(cloudfront, codePipeline, reference, req);
    }
}

const fetchCredentials = async (req) => {
    try {
        let userParams = req['CodePipeline.job']?.data?.actionConfiguration?.configuration?.UserParameters;
        userParams = JSON.parse(userParams);
        let accountNumber = userParams?.AccountNumber;

        if (accountNumber) {
            console.log("accountNumber********", accountNumber);
            const params = {
                RoleArn: `arn:aws:iam::${accountNumber}:role/pipelineRoleCrossAccount`,
                RoleSessionName: Math.random().toString(), // Need to add better logic
                DurationSeconds: 900
            };

            try {
                const command = new AssumeRoleCommand(params);
                const data = await sts.send(command);
                return { credentials: {
                    accessKeyId: data.Credentials.AccessKeyId,
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
                    }
                };
            } catch (err) {
                console.log('err********', err);
                return false;
            }
        } else {
            console.log('No account number found');
            return false;
        }
    } catch (e) {
        console.log('error*****', e);
        return false;
    }
}

const clearCloudfrontCaches = async (cloudfront, codePipeline, reference, req) => {
    try {
        const listDistributionsCommand = new ListDistributionsCommand({});
        const data = await cloudfront.send(listDistributionsCommand);

        if (data.DistributionList.Items.length > 0) {
            console.log(data.DistributionList.Items[0].Id);

            const invalidationParams = (distributionId) => ({
                DistributionId: distributionId,
                InvalidationBatch: {
                    CallerReference: reference,
                    Paths: {
                        Quantity: 1,
                        Items: ['/*']
                    }
                }
            });

            const createInvalidation = async (params) => {
                const command = new CreateInvalidationCommand(params);
                return cloudfront.send(command);
            };

            await Promise.all(data.DistributionList.Items.map((item, index) => createInvalidation(invalidationParams(item.Id))));

            const putJobSuccessResultCommand = new PutJobSuccessResultCommand({ jobId: req["CodePipeline.job"]["id"] });
            await codePipeline.send(putJobSuccessResultCommand);
        }
    } catch (err) {
        console.log(err, err.stack);
        throw err;
    }
}
