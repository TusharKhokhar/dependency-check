const { bucketName, bucketNameConverted, awsAccountNumber, region } = require('../config/config')

module.exports.iotConnectPolicy = (iotData) => {
    return new Promise((resolve, reject) => {
      resolve({
        policy: `{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": "iot:Connect",
          "Resource": "arn:aws:iot:${region}:${awsAccountNumber}:client/${iotData.thingName}"
        },
        {
          "Effect": "Allow",
          "Action": "iot:Subscribe",
          "Resource": "arn:aws:iot:${region}:${awsAccountNumber}:topicfilter/cmd/+/${iotData.customerId}/+/${iotData.thingName}/+"
        },
        {
          "Effect": "Allow",
          "Action": "iot:Publish",
          "Resource": "arn:aws:iot:${region}:${awsAccountNumber}:topic/cmd/*/${iotData.customerId}/*/${iotData.thingName}/*"
        },
        {
          "Effect": "Allow",
          "Action": "iot:Receive",
          "Resource": "arn:aws:iot:${region}:${awsAccountNumber}:topic/cmd/*/${iotData.customerId}/*/${iotData.thingName}/*"
        }]
      }`
      })
    })
  }