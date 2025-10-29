const { bucketName, bucketNameConverted } = require('../../config/config')

module.exports.logoUploadPolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    const action = 's3:PutObject'
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "AllowPublicRead",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${bucketName}/Logos/${parameters.customerId}/*"
                    }
                ]
            }`
    })
  })
}

module.exports.fileUploadPolicy = (parameters, customerId, path) => {
  return new Promise((resolve, reject) => {
    const action = 's3:PutObject'
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "uploadFile",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${bucketName}/${path}/${customerId}/*"
                    }
                ]
            }`
    })
  })
}

module.exports.versionUploadPolicy = () => {
  return new Promise((resolve, reject) => {
    const action = 's3:PutObject'
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "allowUploadKiosk",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${bucketName}/Versions/*"
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
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/PublicUploads/${parameters.CustomerID}/*"
                    }
                ]
            }`
    })
  })
}

module.exports.fetchSignedUrlEmailServicePolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketName}/EmailService/${parameters.CustomerID}/*"
                    },
                    {"Effect":"Allow","Action":["ses:SendRawEmail", "ses:sendEmail" ],"Resource":"*"}
                ]
            }`
    })
  })
}

module.exports.faxServicePolicy = (parameters) => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketName}/FaxService/${parameters.CustomerID}/*"
                    },
                    {
                        "Sid": "fetchObjectFromS3BucketList",
                        "Effect": "Allow",
                        "Action":  "s3:ListBucket",
                        "Resource": "arn:aws:s3:::${bucketName}"
                    }
                ]
            }`
    })
  })
}
