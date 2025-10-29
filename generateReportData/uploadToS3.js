const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {S3_BUCKET_NAME, REGION} = require("./config/config");
const s3Client = new S3Client({ region: REGION });

/**
 * Uploads a file to AWS S3
 * @param {Object} params
 * @param {string} params.bucket - S3 bucket name
 * @param {string} params.key - Object key (file path in S3)
 * @param {Buffer|string} params.body - Data to upload
 * @param {string} params.contentType - MIME type
 * @returns {Promise<Object>}
 */
const uploadToS3 = async ({ bucket, key, body, contentType }) => {
    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            ServerSideEncryption: 'AES256'
        });

        await s3Client.send(command);

        return {
            dataUrlPath: key,
            dataUrlPathURL: `https://${bucket}.s3.amazonaws.com/${key}`,
        };
    } catch (error) {
        console.error("S3 Upload Error:", error);
        return { error: "S3 upload failed", details: error };
    }
};

/**
 * Generates a unique file name based on customer ID and timestamp
 * @param {string|number} customerId
 * @param {string} extension
 * @returns {string}
 */
const generateS3Key = (customerId, extension) => {
    return `Reports/data/${customerId}/${Date.now().toString()}.${extension}`;
};

module.exports = {
    /**
     * Uploads JSON data to S3
     * @param {Object} data - JSON data to upload
     * @param {string|number} customerId
     */
    uploadJsonToS3: async (data, customerId) => {
        const key = generateS3Key(customerId, "json");
        return await uploadToS3({
            bucket: S3_BUCKET_NAME,
            key,
            body: JSON.stringify(data),
            contentType: "application/json",
        });
    },

    /**
     * Uploads base64 CSV data to S3
     * @param {string} base64Data - Base64 encoded CSV data
     * @param {string|number} customerId
     */
    uploadCsvToS3: async (base64Data, customerId) => {
        const key = generateS3Key(customerId, "csv");
        return await uploadToS3({
            bucket: S3_BUCKET_NAME,
            key,
            body: Buffer.from(base64Data, "base64"),
            contentType: "text/csv",
        });
    },
};
