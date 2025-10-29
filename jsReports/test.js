const AWS = require('aws-sdk')
const fs = require('fs')

//TODO set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env variables
const lambda = new AWS.Lambda({
  //TODO
  region: 'us-east-1'
})

lambda.invoke({
  //TODO
  FunctionName: 'jsreportsTest',
  Payload: JSON.stringify({
    renderRequest: {
      template: {
        "name": "printer_usage",
        "engine": "handlebars",
        "recipe": "chrome-pdf"
      },
    }
  })
}, (err, res) => {
  if (err) {
    return console.error(err)
  }

  const response = JSON.parse(res.Payload)
  if (response.errorMessage) {
    console.log(response.errorMessage)
    console.log(response.stackTrace)
  } else {
    fs.writeFileSync('report.pdf', Buffer.from(response.body, 'base64'))
  }
})
