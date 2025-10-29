const { logoUploadPolicy } = require('../tokenVendingMachine/policies/customization.js')
const localEnvs = require('../config/config.js')
const { getStsCredentials } = require('./credentialsGenerator')
const { objectDeletePolicy } = require('../tokenVendingMachine/policyTemplates')
const { fetchSignedUrlPolicy, versionUploadPolicy, fileUploadPolicy} = require('../tokenVendingMachine/policies/customization')
const { v4: uuidv4 } = require('uuid');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, PutObjectCommand} = require("@aws-sdk/client-s3");
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const {getDb} = require("../config/dbHandler");

const AWS_REGION = process.env.region || localEnvs.region
const S3_BUCKET = process.env.bucketName || localEnvs.bucketName
const S3_BUCKET_CONVERTED = process.env.S3BucketTenantUploadsConverted || localEnvs.bucketNameConverted

const uploadSignedUrl = async (data) => {
  data.policy = await logoUploadPolicy(data)
  const retrieveCredentials = await getStsCredentials(data)
  const accessParams = {
    accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
    secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
    sessionToken: retrieveCredentials.Credentials.SessionToken
  }
  const signedParams = {
    Bucket: S3_BUCKET,
    Key: `Logos/${data.customerId}/${data.logoType}.${data.extension}`,
    ContentType: data.contentType
  }
  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: accessParams.accessKeyId,
      secretAccessKey: accessParams.secretAccessKey,
      sessionToken: accessParams.sessionToken
    },
  });
  const command = new PutObjectCommand(signedParams);
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5000 });
  return {
    signedUrl,
    path: `https://${S3_BUCKET}.s3.amazonaws.com/Logos/${data.customerId}/${data.logoType}.${data.extension}`,
    expiryTime: data.expiry,
    customerId: data.customerId,
    logoType: data.logoType
  }
}

const imageSignedUrl = async (data) => {
  data.requestType = data.upload === true ? 'putObject' : 'getObject'
  data.path = data.customization === true ? 'customizations/logo' : 'publicUploads'
  try {
    data.policy = await logoUploadPolicy(data)
    const retrieveCredentials = await getStsCredentials(data)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `${data.customerId}/${data.path}/${data.fileName}.${data.extension}`,
    }
    if (data.upload) {
      Object.assign(signedParams, { ContentType: data.contentType })
    }
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: accessParams.accessKeyId,
        secretAccessKey: accessParams.secretAccessKey,
        sessionToken: accessParams.sessionToken
      },
    });
    const command = new GetObjectCommand(signedParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: data.expiry });
    return {
      signedUrl,
      expiryTime: data.expiry
    }
  } catch (error) {
    return error
  }
}

const uploadMultipleFiles = async (data, customerId, path, context) => {
  try {
    if (path.includes('Import')) {
      path = path.includes('Device') ? 'Import/devices' : path.includes('Location') ? 'Import/locations' : path.includes('Account') ? 'Import/accounts' : 'Import/things'
    }
    data.policy = await fileUploadPolicy(data, customerId, path)
    const retrieveCredentials = await getStsCredentials(data)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    let signedUrls = []
    for (let metaData of data) {
      const uuidName = path.includes('Import') ? context?.data?._id : uuidv4()
      const signedParams = {
        Bucket: S3_BUCKET,
        Key: `${path}/${customerId}/${uuidName}.${metaData.extension}`,
        ContentType: metaData.contentType,
      }
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: accessParams.accessKeyId,
          secretAccessKey: accessParams.secretAccessKey,
          sessionToken: accessParams.sessionToken
        },
      });
      const command = new PutObjectCommand(signedParams);
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const postSignedMeta = await createPresignedPost(s3Client, signedParams)
      signedUrls.push({
        originalFileName: metaData.fileName,
        newFileName: `${uuidName}.${metaData.extension}`,
        signedUrl,
        postSignedMeta: JSON.stringify(postSignedMeta),
        expiryTime: 3600
      } )
    }
    if (path.includes('TranslationService')) {
      // signed url api logic to store entries in DB
      const db = await getDb()
      const id = await generateLinksPromise(signedUrls, customerId, db)
      return {signedUrls, id}
    }
    return {signedUrls}
  } catch (error) {
    console.error(error)
    return error
  }
}

const uploadMultipleFilesV2 = async (data, customerId, path, context) => {
  try {
    if (path.includes('Import')) {
      path = path.includes('Device') ? 'Import/devices' : path.includes('Location') ? 'Import/locations' : path.includes('Account') ? 'Import/accounts' : 'Import/things'
    }
    data.policy = await fileUploadPolicy(data, customerId, path)
    const retrieveCredentials = await getStsCredentials(data)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    let signedUrls = []
    for (let metaData of data) {
      const uuidName = path.includes('Import') ? context?.data?._id : uuidv4()
      const signedParams = {
        Bucket: S3_BUCKET,
        Key: `${path}/${customerId}/${uuidName}.${metaData.extension}`,
        ContentType: metaData.contentType,
        ServerSideEncryption: 'AES256'
      }
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: accessParams.accessKeyId,
          secretAccessKey: accessParams.secretAccessKey,
          sessionToken: accessParams.sessionToken
        },
      });
      const command = new PutObjectCommand(signedParams);
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      signedParams.Fields = {
        "x-amz-server-side-encryption": "AES256", // Include AES256 encryption header
      }
      signedParams.Conditions = [
        { "x-amz-server-side-encryption": "AES256" }, // Enforce AES256 in the policy
      ]

      const postSignedMeta = await createPresignedPost(s3Client, signedParams)
      signedUrls.push({
        originalFileName: metaData.fileName,
        newFileName: `${uuidName}.${metaData.extension}`,
        signedUrl,
        postSignedMeta: JSON.stringify(postSignedMeta),
        expiryTime: 3600
      } )
    }
    if (path.includes('TranslationService')) {
      // signed url api logic to store entries in DB
      const db = await getDb()
      const id = await generateLinksPromise(signedUrls, customerId, db)
      return {signedUrls, id}
    }
    return {signedUrls}
  } catch (error) {
    console.error(error)
    return error
  }
}

const generateLinksPromise = async (data, customerId, db) => {
  const arrayOfPostData = []
  for (const upload of data) {
    arrayOfPostData.push({ FileName: upload.newFileName, IsProcessed: false })
  }
  await db.collection('TranslationUploads').createIndex( { 'ExpireJobRecord': 1 }, { expireAfterSeconds: 7200 } )
  const {insertedId: id} = await db.collection('TranslationUploads').insertOne({
    IsProcessedFileName: arrayOfPostData
  })
  return id
}

const kioskVersionUpload = async (data) => {
  try {
    data.policy = await versionUploadPolicy(data)
    const retrieveCredentials = await getStsCredentials(data)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `Versions/${data.fileName}.${data.extension}`,
      ContentType: data.contentType
    }
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: accessParams.accessKeyId,
        secretAccessKey: accessParams.secretAccessKey,
        sessionToken: accessParams.sessionToken
      },
    });
    const command = new PutObjectCommand(signedParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      signedUrl,
      expiryTime: 3600,
      path: signedParams.Key
    }
  } catch (error) {
    console.log(error)
    return error
  }
}

const kioskVersionUploadV2 = async (data) => {
  try {
    data.policy = await versionUploadPolicy(data)
    const retrieveCredentials = await getStsCredentials(data)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET,
      Key: `Versions/${data.fileName}.${data.extension}`,
      ContentType: data.contentType,
      ServerSideEncryption: 'AES256'
    }
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: accessParams.accessKeyId,
        secretAccessKey: accessParams.secretAccessKey,
        sessionToken: accessParams.sessionToken
      },
    });
    const command = new PutObjectCommand(signedParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      signedUrl,
      expiryTime: 3600,
      path: signedParams.Key
    }
  } catch (error) {
    console.log(error)
    return error
  }
}

const deleteCredentials = async (data) => {
  try {
    const policy = await objectDeletePolicy(data)
    const retrieveCredentials = await getStsCredentials(policy)
    return {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
  } catch (error) {
    return error
  }
}

const getSignedUrlFile = async (data) => {
  try {
    data.policy = await fetchSignedUrlPolicy(data)
    const retrieveCredentials = await getStsCredentials(data.policy)
    const accessParams = {
      accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
      secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
      sessionToken: retrieveCredentials.Credentials.SessionToken
    }
    const signedParams = {
      Bucket: S3_BUCKET_CONVERTED,
      Key: `PublicUploads/${data.CustomerID}/${data.JobList.NewFileNameWithExt}`,
      // Expires: 3600
    }
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: accessParams.accessKeyId,
        secretAccessKey: accessParams.secretAccessKey,
        sessionToken: accessParams.sessionToken
      },
    });
    const command = new GetObjectCommand(signedParams);
    const signedUrl = await getSignedUrl(s3Client, command, {expiresIn: 3600});
    return {
      signedUrl,
      expiryTime: 3600
    }
  } catch (error) {
    return error
  }
}

module.exports = { imageSignedUrl, uploadSignedUrl, deleteCredentials, getSignedUrlFile,
  kioskVersionUpload, uploadMultipleFiles, uploadMultipleFilesV2, kioskVersionUploadV2 }
