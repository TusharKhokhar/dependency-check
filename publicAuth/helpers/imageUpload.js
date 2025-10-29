const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getSignedUrlCommand } = require("@aws-sdk/s3-request-presigner");
const { logoUploadPolicy, fetchSignedUrlPolicy, versionUrlPolicy } = require('../tokenVendingMachine/policies/customization.js');
const localEnvs = require('../config/config.js');
const { getStsCredentials } = require('./credentialGenerator');
const { v4: uuidv4 } = require('uuid');
const { objectDeletePolicy } = require('../tokenVendingMachine/policyTemplates');
const {getStsV2Credentials} = require("./credentialsv2");
const {binaryFileSignedUrl} = require("../tokenVendingMachine/policies/customization");

const AWS_REGION = process.env.region || localEnvs.region;
const S3_BUCKET = process.env.S3BucketTenantUploads || localEnvs.bucketName;
const S3_BUCKET_CONVERTED = process.env.S3BucketTenantUploadsConverted || localEnvs.bucketNameConverted;

const imageSignedUrl = async (data) => {
  try {
    data.policy = await logoUploadPolicy(data);
    const retrieveCredentials = await getStsCredentials(data.policy);
    const newFileName = uuidv4();
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: accessParams,
    });

    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `PublicUploads/${data.customerId}/${newFileName}.${data.extension}`,
      ContentType: data.contentType,
      Metadata: {
        filename: data.fileName,
        extension: data.extension,
        customerId: data.customerId || '',
        source: 'web',
        customerDomain: data.domain,
      },
    };
    const command = new PutObjectCommand(signedParams);
    const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: 3600 });
    return {
      signedUrl,
      expiryTime: 3600,
      newFileName: `${newFileName}.pdf`,
    };
  } catch (error) {
    return error;
  }
};

const binarySignedUrl = async (data) => {
  try {
    data.policy = await binaryFileSignedUrl(data);
    const retrieveCredentials = await getStsCredentials(data.policy);
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: accessParams,
    });

    const signedParams = {
      Bucket: S3_BUCKET_CONVERTED,
      Key: `IppUploads/${data.customerId}/IppResponse/${data.fileName}`,
      ContentType: 'application/octet-stream',
    };
    const command = new PutObjectCommand(signedParams);
    const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: 3600 });
    return {
      signedUrl,
      expiryTime: 3600,
      newFileName: `${data.fileName}`,
    };
  } catch (error) {
    console.log('---------------',error);
    return error;
  }
};

const accessKeysHead = async (data) => {
  try {
    data.policy = await fetchSignedUrlPolicy(data);
    const retrieveCredentials = await getStsCredentials(data.policy);
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };
    return { accessParams };
  } catch (error) {
    return error;
  }
};

// const getSignedUrl = async (data) => {
//   try {
//     data.policy = await fetchSignedUrlPolicy(data);
//     const retrieveCredentials = await getStsCredentials(data.policy);
//     const accessParams = {
//       accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
//       secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
//       sessionToken: retrieveCredentials.Credentials.SessionToken,
//     };
//
//     const s3Client = new S3Client({
//       region: AWS_REGION,
//       credentials: accessParams
//     });
//
//     const signedParams = {
//       Bucket: S3_BUCKET_CONVERTED,
//       Key: `PublicUploads/${data.customerId}/${data.NewFileNameWithExt}`,
//     };
//     const command = new GetObjectCommand(signedParams);
//     const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: 3600 });
//     return {
//       signedUrl,
//       expiryTime: 3600,
//     };
//   } catch (error) {
//     return error;
//   }
// };
//
const getSignedUrl = async (data) => {
  try {
    const AWS = require('aws-sdk')
    data.policy = await fetchSignedUrlPolicy(data)
    const retrieveCredentials = await getStsV2Credentials(data.policy)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET_CONVERTED,
      Key: `PublicUploads/${data.customerId}/${data.NewFileNameWithExt}`,
      Expires: 3600
    }
    const s3 = new AWS.S3(accessParams)
    const signedUrl = s3.getSignedUrl('getObject', signedParams)
    return {
      signedUrl,
      expiryTime: 3600
    }
  } catch (error) {
    return error
  }
}

const getBinaryFileSignedUrl = async (data) => {
  try {
    const AWS = require('aws-sdk')
    data.policy = await binaryFileSignedUrl(data)
    const retrieveCredentials = await getStsV2Credentials(data.policy)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET_CONVERTED,
      Key: `IppUploads/${data.customerId}/${data.NewFileNameWithExt}`,
      Expires: 3600
    }
    const s3 = new AWS.S3(accessParams)
    const signedUrl = s3.getSignedUrl('getObject', signedParams)
    return {
      signedUrl,
      expiryTime: 3600
    }
  } catch (error) {
    return error
  }
}

const getVersionSignedUrl = async (data) => {
  try {
    data.policy = await versionUrlPolicy(data);
    const retrieveCredentials = await getStsCredentials(data.policy);
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: accessParams,
    });
    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `Versions/${data.Package}`,
    };
    const command = new GetObjectCommand(signedParams);
    const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: 3600 });

    return {
      signedUrl,
      expiryTime: 3600,
    };
  } catch (error) {
    return error;
  }
};

const deleteCredentials = async (data) => {
  try {
    const policy = await objectDeletePolicy(data);
    const retrieveCredentials = await getStsCredentials(policy);
    return {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };
  } catch (error) {
    return error;
  }
};

/**
 * Generate signed URLs with guaranteed server-side encryption (V2)
 * This version ensures AES256 encryption is applied
 */
const imageSignedUrlV2 = async (data) => {
  try {
    data.policy = await logoUploadPolicy(data);
    const retrieveCredentials = await getStsCredentials(data.policy);
    const newFileName = uuidv4();
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken,
    };

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: accessParams,
    });

    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `PublicUploads/${data.customerId}/${newFileName}.${data.extension}`,
      ContentType: data.contentType,
      ServerSideEncryption: 'AES256', // Ensuring server-side encryption with AES256
      Metadata: {
        filename: data.fileName,
        extension: data.extension,
        customerId: data.customerId || '',
        source: 'web',
        customerDomain: data.domain,
      },
    };
    const command = new PutObjectCommand(signedParams);
    const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: 3600 });
    return {
      signedUrl,
      expiryTime: 3600,
      newFileName: `${newFileName}.pdf`,
    };
  } catch (error) {
    return error;
  }
};

module.exports = {
  imageSignedUrl,
  imageSignedUrlV2,
  binarySignedUrl,
  getSignedUrl,
  accessKeysHead,
  getBinaryFileSignedUrl
};
