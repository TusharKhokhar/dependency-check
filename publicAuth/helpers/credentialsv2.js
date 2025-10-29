const localEnvs = require('../config/config')
const AWS_ACCOUNT_NUMBER = process.env.awsAccountNumber || localEnvs.awsAccountNumber
const ROLE_NAME = process.env.roleName ? process.env.roleName : localEnvs.roleName


module.exports.getStsV2Credentials = (policy) => {
    return new Promise((resolve, reject) => {
        const AWS = require('aws-sdk')
        const sts = new AWS.STS()
        const params = {
            RoleArn: `arn:aws:iam::${AWS_ACCOUNT_NUMBER}:role/${ROLE_NAME}`, // env thing needs to be there
            Policy: policy.policy,
            RoleSessionName: Date.now().toString()
        }
        console.log(params)
        sts.assumeRole(params, (err, credentials) => {
              if (err) {
                  reject(err)
              } else {
                  resolve(credentials)
              }
          }
        )
    })
}
