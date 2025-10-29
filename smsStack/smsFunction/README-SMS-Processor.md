# SMS Processor Lambda Deployment

This directory contains the AWS Lambda function for processing SMS messages and auditing failed deliveries. The function is deployed using CloudFormation and reads messages from an SQS queue.

## Files

- `sms-processor.js` - The Lambda function code
- `sms-consumer.yaml` - CloudFormation template for creating the SQS queue and Lambda function
- `packageLambda.js` - Script to package and deploy the Lambda function
- `package.json` - Dependencies for the Lambda function

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with appropriate credentials
- An S3 bucket to store the Lambda deployment package

## Packaging and Deploying the Lambda Function

### 1. Install dependencies

```bash
npm install
```

### 2. Package the Lambda function

To create a ZIP file without uploading:

```bash
npm run package
# OR
node packageLambda.js --skip-upload
```

To package and upload to S3:

```bash
node packageLambda.js --bucket=your-s3-bucket-name --key-prefix=lambda/sms-processor
```

Optional parameters:
- `--bucket=your-s3-bucket-name` - The S3 bucket to upload to
- `--key-prefix=lambda/sms-processor` - The S3 key prefix (default: 'lambda/sms-processor')
- `--region=us-east-1` - AWS region for S3 (default: from AWS_REGION env variable or 'us-east-1')
- `--skip-upload` - Skip the S3 upload step

### 3. Deploy using CloudFormation

After uploading the package to S3, deploy the CloudFormation stack:

```bash
aws cloudformation deploy \
  --template-file sms-consumer.yaml \
  --stack-name cloud-saas-sms-processor \
  --parameter-overrides \
    CodeBucket=your-s3-bucket-name \
    S3KeyPrefix=lambda/sms-processor \
    CROSSVALUE=your-api-key
```

### 4. Updating the Lambda function

To update the Lambda function:

1. Make changes to `sms-processor.js`
2. Run the packaging script again
3. Redeploy the CloudFormation stack

## Lambda Function Details

The SMS processor Lambda function:

1. Processes SQS messages containing SMS information
2. Sends SMS messages using Amazon SNS
3. Logs failed messages to your audit API
4. Uses environment-specific API endpoints based on the message content

## Environment Variables

The Lambda function uses these environment variables:

- `ALERT_TOPIC_ARN` - ARN of the SNS topic for alerts (set by CloudFormation)
- `CROSS_VALUE` - API key for the SMS audit API (set via CloudFormation parameter)

## API Endpoints

The Lambda function is configured to call different API endpoints based on the environment:

```javascript
const API_ENDPOINTS = {
    dev: 'https://api.eprintitsaas.org/public/smsAuditLog',
    qa: 'https://api.eprintitsaas.net/public/smsAuditLog',
    prod: 'https://api.eprintitsaas.com/public/smsAuditLog'
};
```

Update these URLs in `sms-processor.js` if your endpoints are different.

## Troubleshooting

- **"No S3 bucket specified"**: Provide a bucket name with `--bucket=your-bucket-name`
- **"Source file not found"**: Ensure `sms-processor.js` exists in the current directory
- **CloudFormation errors**: Check that the S3 bucket and key are accessible and the parameter names match the template
