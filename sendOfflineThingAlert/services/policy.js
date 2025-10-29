module.exports.iotPolicy = () => {
    return new Promise((resolve) => {
        resolve({
            policy: `{
                "Version": "2012-10-17",
                "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "iot:SearchIndex"
                    ],
                    "Resource": "*"
                }
            ]
            }`
        })
    })
}

module.exports.cloudWatchFilterLogsPolicy = () => {
    return new Promise((resolve) => {
        resolve({
            policy: `{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:FilterLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            }`
        })
    })
}