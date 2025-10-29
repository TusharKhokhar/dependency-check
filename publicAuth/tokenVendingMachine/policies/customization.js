const { bucketName, bucketNameConverted } = require('../../config/config')

module.exports.logoUploadPolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "uploadImagesToS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:PutObject",
                        "Resource": "arn:aws:s3:::${bucketName}/PublicUploads/${parameters.customerId}/*"
                    }
                ]
            }`
    })
  })
}

module.exports.fetchSignedUrlPolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/PublicUploads/${parameters.customerId}/*"
                    }
                ]
            }`
    })
  })
}

module.exports.binaryFileSignedUrl = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/IppUploads/${parameters.customerId}/*"
                    },
                    {
                        "Sid": "fetchResponseFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:PutObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/IppUploads/${parameters.customerId}/IppResponse/*"
                    }
                ]
            }`
    })
  })
}

module.exports.versionUrlPolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketName}/Versions/${parameters.Package}"
                    }
                ]
            }`
    })
  })
}
