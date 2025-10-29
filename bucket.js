
var aws = require('aws-sdk');
var response = require('cfn-response');
module.exports.handler = function (event, context, callback) {
    console.log('event--->>>',event)
    var s3 = new aws.S3({region: event.ResourceProperties.DestBucketRegion});
    if (event.RequestType == 'Create' || event.RequestType == 'Update') {
        var bucketParams = {
            Bucket: event.ResourceProperties.DestBucketName,
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [{
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
                }, {
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
        var bucketParamsLifeCycle = {
            Bucket: event.ResourceProperties.DestBucketName,
            LifecycleConfiguration: {
                Rules: [
                    {
                        Expiration: {
                            Days: 7
                        },
                        Filter: {
                            Prefix: "PublicUploads/"
                        },
                        ID: "DeletePublicUploadJob1",
                        Status: "Enabled"
                    },
                    {
                        Expiration: {
                            Days: 1
                        },
                        Filter: {
                            Prefix: "Reports/"
                        },
                        ID: "DeletePublicUploadJob2",
                        Status: "Enabled"
                    }
                ]
            }
        }
        var bucketParamsReplication = {
            Bucket: event.ResourceProperties.DestBucketNameConverted,
            ReplicationConfiguration: {
                Role: event.ResourceProperties.S3ExecutionRoleArn,
                Rules: [
                    {
                        Destination: {
                            Bucket: event.ResourceProperties.DestinationBucketArn,
                            StorageClass: "STANDARD"
                        },
                        Prefix: "",
                        Status: "Enabled"
                    }
                ]
            }
        }
        s3.putBucketNotificationConfiguration(bucketParams, function (err, data) {
            if (err) {
                console.log(err, err.stack)
                response.send(event, context, response.FAILED, err)
            } else {
                s3.putBucketLifecycleConfiguration(bucketParamsLifeCycle, function(err, data) {
                    if (err){
                        console.log(err, err.stack);
                        response.send(event, context, response.FAILED, err)
                    } else {
                        response.send(event, context, response.SUCCESS, {}, event.destBucketName);
                    }
                })
            }
        })
    } else {
        response.send(event, context, response.SUCCESS);
        callback(null, 'Job done!');
    }
};