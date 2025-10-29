#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const AdmZip = require('adm-zip');

// Configuration
const config = {
  sourceFile: path.join(__dirname, 'sms-processor.js'),
  outputZip: path.join(__dirname, 'sms-processor.zip'),
  defaultBucket: process.env.S3_BUCKET || '',
  defaultKeyPrefix: 'lambda/sms-processor',
  region: process.env.AWS_REGION || 'us-east-1'
};

// Parse command line arguments
const args = process.argv.slice(2);
const bucketArg = args.find(arg => arg.startsWith('--bucket='));
const keyPrefixArg = args.find(arg => arg.startsWith('--key-prefix='));
const regionArg = args.find(arg => arg.startsWith('--region='));
const skipUploadArg = args.includes('--skip-upload');

const bucketName = bucketArg ? bucketArg.split('=')[1] : config.defaultBucket;
const keyPrefix = keyPrefixArg ? keyPrefixArg.split('=')[1] : config.defaultKeyPrefix;
const region = regionArg ? regionArg.split('=')[1] : config.region;

// Check if source file exists
if (!fs.existsSync(config.sourceFile)) {
  console.error(`Source file not found: ${config.sourceFile}`);
  process.exit(1);
}

// Create a zip file with the Lambda function
async function createZipFile() {
  console.log('Creating zip file...');

  try {
    // Create a new zip file
    const zip = new AdmZip();

    // Add the Lambda function to the zip
    zip.addFile('index.js', fs.readFileSync(config.sourceFile));

    // Check if package.json exists and add dependencies if needed
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      console.log('Found package.json, installing dependencies...');

      // Create a temp directory for node_modules
      const tempDir = path.join(__dirname, 'temp_node_modules');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      // Copy package.json to temp directory
      fs.copyFileSync(packageJsonPath, path.join(tempDir, 'package.json'));

      // Install production dependencies only
      execSync('npm install --production', { cwd: tempDir });

      // Add node_modules to the zip
      const nodeModulesPath = path.join(tempDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('Adding node_modules to zip...');

        // Read all files in node_modules recursively
        function addDirectoryToZip(directory, zipPath) {
          const files = fs.readdirSync(directory);

          for (const file of files) {
            const filePath = path.join(directory, file);
            const zipFilePath = path.join(zipPath, file);

            if (fs.statSync(filePath).isDirectory()) {
              addDirectoryToZip(filePath, zipFilePath);
            } else {
              zip.addFile(zipFilePath, fs.readFileSync(filePath));
            }
          }
        }

        addDirectoryToZip(nodeModulesPath, 'node_modules');
      }

      // Clean up temp directory
      execSync(`rm -rf ${tempDir}`);
    } else {
      console.log('No package.json found, skipping dependencies installation');
    }

    // Write the zip file
    zip.writeZip(config.outputZip);
    console.log(`Zip file created at: ${config.outputZip}`);

    return true;
  } catch (error) {
    console.error('Error creating zip file:', error);
    return false;
  }
}

// Upload the zip file to S3
async function uploadToS3() {
  if (skipUploadArg) {
    console.log('Skipping S3 upload (--skip-upload flag provided)');
    return true;
  }

  if (!bucketName) {
    console.error('No S3 bucket specified. Use --bucket=your-bucket-name or set S3_BUCKET environment variable');
    return false;
  }

  console.log(`Uploading to S3 bucket: ${bucketName}, key: ${keyPrefix}/sms-processor.zip`);

  try {
    // Create S3 client
    const s3Client = new S3Client({ region });

    // Read the zip file
    const fileContent = fs.readFileSync(config.outputZip);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${keyPrefix}/sms-processor.zip`,
      Body: fileContent,
      ContentType: 'application/zip'
    });

    await s3Client.send(command);
    console.log('Upload successful!');

    console.log('\nTo deploy with CloudFormation, use:');
    console.log(`aws cloudformation deploy \\
  --template-file sms-consumer.yaml \\
  --stack-name cloud-saas-sms-processor \\
  --parameter-overrides \\
    CodeBucket=${bucketName} \\
    S3KeyPrefix=${keyPrefix} \\
    CROSSVALUE=your-api-key`);

    return true;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return false;
  }
}

// Main execution
async function main() {
  const zipCreated = await createZipFile();
  if (!zipCreated) {
    process.exit(1);
  }

  const uploadSuccess = await uploadToS3();
  if (!uploadSuccess && !skipUploadArg) {
    process.exit(1);
  }

  console.log('Packaging and upload completed successfully!');
}

main();
