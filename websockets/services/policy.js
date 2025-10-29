
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

module.exports.lambdaPolicy = () => {
    return new Promise((resolve, reject) => {
        resolve({
            policy: `{
                "Version": "2012-10-17",
                "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction
                    ],
                    "Resource": "*"
                }
            ]
            }`
        })
    })
}

module.exports.websocketPolicy = () => {
    return ({
        policy: `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:Invoke",
                "execute-api:ManageConnections"
            ],
            "Resource": "arn:aws:execute-api:*:*:*"
        }
    ]
}`
    })
}