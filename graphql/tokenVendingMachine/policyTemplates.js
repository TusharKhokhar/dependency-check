const { bucketNameConverted } = require('../config/config')
module.exports.emailPolicy = () => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [{"Effect":"Allow","Action":"ses:SendRawEmail","Resource":"*"}, {"Effect":"Allow","Action":"ses:SendEmail","Resource":"*"}]
            }`
    })
  })
}

module.exports.iotPolicy = () => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2012-10-17",
                "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "iot:*"
                    ],
                    "Resource": "*"
                }
            ]
            }`
    })
  })
}

module.exports.objectDeletePolicy = (path) => {
  return new Promise((resolve, reject) => {
    const action = 's3:DeleteObject'
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "DeleteAllow",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/${path}*"
                    }
                ]
            }`
    })
  })
}
