const AWS = require('@aws-sdk/client-s3');
const csv = require('csv-parser');
const { addLocations, addDevices, addThings, addAccounts } = require("./model");
const { region, bucketName, senderEmail, Stage, domainName} = require("./config/config");
const { ObjectId } = require("mongodb");
const { Parser } = require('json2csv');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {getDb} = require("./config/db");
const emailHandler = require("./services/emailHandler");

/**
 * we are downloading files
 * we are uploading files
 * we are fetching secrets
 * we are sending emails
 * we are reading files
 * we are writing files
 * we are processing files
 * we are processing data
 * we are processing csv files
 * we are processing json files
 * we are processing s3 files
 * we are using aws iot
 * @type {S3Client}
 */

const s3 = new AWS.S3Client({region: region});

const downloadFileFromS3 = async (bucketName, key) => {
    const params = {
        Bucket: bucketName,
        Key: key,
    };
    const command = new AWS.GetObjectCommand(params);
    const { Body } = await s3.send(command);
    return Body
};

const readFile = async (data) => {
    return new Promise((resolve, reject) => {
        const results = [];
        data.pipe(csv({
            quote: '"',          // defines the quote character
            delimiter: ',',      // defines the column delimiter
        }))
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
    });
};

const processS3File = async (bucketName, key, data, type, customerId, fileName) => {
    try {
        data = await readFile(data);
        let failedItems = [];
        switch (type) {
            case 'locations':
                failedItems = await addLocations(data, customerId);
                break;
            case 'devices':
                failedItems = await addDevices(data, customerId);
                break;
            case 'things':
                failedItems = await addThings(data, customerId);
                break;
            case 'accounts':
                failedItems = await addAccounts(data, customerId);
                break;
        }
        console.log(`Failed to add the following ${type}:`, failedItems);
        const json2csvParser = new Parser();
        const csv = failedItems?.length > 0 ? json2csvParser.parse(failedItems) : ''
        fileName = fileName.split('.')[0];
        const db = await getDb()
        const {PrimaryEmail: primaryEmail} = await db.collection('Users').findOne({_id: ObjectId.createFromHexString(fileName)});
        const epochDate = new Date().getTime();
        const filePath = `${fileName}-${epochDate}.csv`;
        console.log(filePath);
        const s3Path = `Failed/${customerId}/${filePath}`
        await uploadToS3(csv, s3Path);
        console.log("CSV file created successfully!");
        await emailHandler.sendEmailAttachments([{ fileName: filePath }], senderEmail, primaryEmail, `ePRINTit SaaS: Import ${type} status`, '', [], customerId, 7, 'Failed', csv);
        console.log('Data added successfully');
    } catch (error) {
        console.error('Error processing S3 file:', error);
        const db = await getDb()
        fileName = fileName.split('.')[0];
        const {PrimaryEmail: primaryEmail} = await db.collection('Users').findOne({_id: ObjectId.createFromHexString(fileName)});
        await emailHandler.sendEmailFailure(senderEmail, primaryEmail, `ePRINTit SaaS: Import ${type} failed`, '', [], customerId, 'failed-status')
    }
};

const uploadToS3 = async (csv, key) => {
    const s3Client = new S3Client({ region: region });
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: csv,
            ContentType: 'text/csv',
            ServerSideEncryption: 'AES256'
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        console.log(`CSV uploaded successfully to s3://${bucketName}/${key}`);
    } catch (error) {
        console.error('Error uploading CSV to S3:', error);
    }
};

const handler = async (event) => {
    const bucketName = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const [folder, type, customerId, fileName] = key.split('/');
    const csvData = await downloadFileFromS3(bucketName, key);
    const customerIdObj = ObjectId.createFromHexString(customerId.toString());
    await processS3File(bucketName, key, csvData, type, customerIdObj, fileName);
    console.log('Lambda execution completed')
};

module.exports = {handler, processS3File}