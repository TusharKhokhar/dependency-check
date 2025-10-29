# SMS Services Deployment Guide

This README provides instructions for packaging and deploying the SMS processing services used in the cloud-saas-api project.

## Overview

The SMS services consist of two main components:

1. **SMS Failure Detection** - Processes SMS delivery failure notifications from CloudWatch logs
2. **SMS Processor** - Handles SMS message sending via SQS/SNS

## Prerequisites

- AWS CLI installed and configured
- AWS SAM CLI installed
- Node.js and npm installed
- jq command-line tool installed (`brew install jq`)

## Packaging Lambda Functions and Layers

### 1. Create the Lambda Layer

The SMS functions use a common layer containing MongoDB and AWS4 dependencies. Create this layer first:

```bash
cd /Users/work/Documents/development/cloud-saas-api/smsStack
chmod +x create-lambda-layer.sh
./create-lambda-layer.sh
```

This will create a file called `sms-common-layer.zip` that contains the layer's dependencies.

### 2. Upload the Layer to S3

Upload the layer to your S3 bucket:

```bash
# For audit.yaml template
aws s3 cp sms-common-layer.zip s3://lambda-layer-saas-primary-prod/layers/sms-common-layer.zip

# For sms-consumer.yaml template
aws s3 cp sms-common-layer.zip s3://lambda-layer-saas-primary-prod/lambda/sms-processor/layers/sms-common-layer.zip
```

### 3. Create the Lambda Function Packages

```bash
chmod +x create-lambda-packages.sh
./create-lambda-packages.sh
```

This will create two optimized zip files:
- `sms-failure-detection.zip` - For the SMS failure detection Lambda
- `sms-processor.zip` - For the SMS processor Lambda

## Deployment Steps

### Deploy the SMS Consumer Stack

This stack creates resources for sending SMS messages from a centralized production account.

```bash
cd /Users/work/Documents/development/cloud-saas-api/cross-account-templates
sam deploy \
  --template-file sms-consumer.yaml \
  --stack-name cloud-saas-sms-consumer \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides CodeBucket=lambda-layer-saas-primary-prod
```

Replace placeholders with your actual values.

## Benefits of Using Lambda Layers

1. **Reduced Package Size**: By moving dependencies to a layer, your Lambda function packages are smaller and more focused on your business logic.

2. **Dependency Reuse**: The same layer can be used by multiple Lambda functions, reducing duplication.

3. **Simplified Updates**: You can update dependencies independently of your function code.

4. **Faster Deployments**: Smaller function packages deploy faster.

## CloudFormation Templates

### audit.yaml

This template creates:
- A Lambda function to process SMS failure logs
- IAM roles and permissions
- CloudWatch Logs subscription filter

### sms-consumer.yaml

This template creates:
- SQS queue for SMS message processing
- Dead letter queue for failed messages
- Lambda function to process SQS messages and send SMS
- Cross-account permissions
- SNS topic for alerts

## Monitoring

Each template includes (commented) CloudWatch alarms that can be enabled for monitoring:
- Queue depth alarms
- Dead letter queue message alarms
- Lambda function error alarms

To enable these alarms, uncomment the relevant sections in the templates before deployment.

## Cross-Account Configuration

The SMS consumer template is designed to allow sending SMS messages from development and staging accounts. The template includes parameters for configuring these account IDs.
