
module.exports.emailPolicy = () => {
  return new Promise((resolve, reject) => {
    resolve({
      policy: `{
                "Version": "2008-10-17",
                "Statement": [{"Effect":"Allow","Action":"ses:SendRawEmail","Resource":"*"}]
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


module.exports.websocketPolicy = () => {
  // return new Promise((resolve, rej) => {
    return({
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
    // })
  })
}
