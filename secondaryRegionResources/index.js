const { S3Client, PutBucketNotificationConfigurationCommand } = require("@aws-sdk/client-s3");
const response = require('cfn-response');

module.exports.handler = async (event, context) => {
    const s3 = new S3Client({ region: event.ResourceProperties.DestBucketRegion });

    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
        const bucketParams = {
            Bucket: event.ResourceProperties.DestBucketName,
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [
                    {
                        LambdaFunctionArn: event.ResourceProperties.LambdaArn,
                        Events: ['s3:ObjectCreated:*'],
                        Filter: {
                            Key: {
                                FilterRules: [
                                    {
                                        Name: 'prefix',
                                        Value: 'PublicUploads/'
                                    }
                                ]
                            }
                        },
                        Id: '001'
                    },
                    {
                        LambdaFunctionArn: event.ResourceProperties.EmailLambdaArn,
                        Events: ['s3:ObjectCreated:Put'],
                        Filter: {
                            Key: {
                                FilterRules: [
                                    {
                                        Name: 'prefix',
                                        Value: 'Email/'
                                    }
                                ]
                            }
                        },
                        Id: '002'
                    }
                ]
            }
        };

        try {
            const command = new PutBucketNotificationConfigurationCommand(bucketParams);
            await s3.send(command);
            response.send(event, context, response.SUCCESS, {}, event.ResourceProperties.DestBucketName);
        } catch (err) {
            console.error(err, err.stack);
            response.send(event, context, response.FAILED, err);
        }
    } else {
        response.send(event, context, response.SUCCESS);
    }
};
