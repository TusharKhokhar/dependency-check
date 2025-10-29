const chromium = require("@sparticuz/chromium")
const JsReport = require('jsreport')
const FS = require('fs-extra')
const path = require('path')
const os = require('os')
const axios = require('axios');
const {
      getSignedUrl
  } = require("@aws-sdk/s3-request-presigner"),
  {
      GetObjectCommand,
      S3, PutObjectCommand, S3Client
  } = require("@aws-sdk/client-s3"),
  {
      STS, STSClient, AssumeRoleCommand
  } = require("@aws-sdk/client-sts");
const stsClient = new STSClient({
    region: process.env.region,
});
chromium.setHeadlessMode = true

const s3 = new S3({
    region: process.env.region
});
const client = new S3Client({
    region: process.env.region
});
const sts = new STS()
let constants = {
    BUCKET_NAME: process.env.S3BucketTenantUploads || 'tenant-948664164116-staging',
    AWS_ACCOUNT_NUMBER: process.env.awsAccountNumber,
    ROLE_NAME: process.env.roleName,
    API_KEY: 'cweex23xieo2hznx2ln3hr8ru23crucl',
    DOMAIN_NAME: process.env.domainName || 'eprintitsaas.org'
}
let { BUCKET_NAME, AWS_ACCOUNT_NUMBER, ROLE_NAME, DOMAIN_NAME, API_KEY } = constants
let jsreport

console.log('starting')

const init = (async () => {
    // this speeds up cold start by some ~500ms
    precreateExtensionsLocationsCache()
    jsreport = JsReport({
        configFile: path.join(__dirname, 'prod.config.json'),
        chrome: {
            launchOptions: {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            }
        }
    })
    await FS.copy(path.join(__dirname, 'data'), '/tmp/data')
    return jsreport.init()
})()

exports.handler = async (event) => {
    try {
        console.log('handling event')
        await init
        console.log('event----------', event);
        let dataUrl = `https:/${BUCKET_NAME}.s3.amazonaws.com/${event.data.dataUrl}`
        console.log('dataUrl: ', dataUrl)
        let templateData = event.data.templateData
        const data = await downloadFromS3(event.data.dataUrl)
        console.log('downloadedData: ', data)
        const requestData = {data: {data: data.dataUrlPath}, template: templateData}
        const res = await jsreport.render(requestData)
        let extension = 'pdf'
        if (templateData.recipe === 'html') {
            extension = 'base64'
            res.content = (res.content).toString('base64');
        }
        if (templateData.recipe === 'html-to-xlsx') {
            extension = 'xlsx'
            res.content = Buffer.from(res.content, 'base64');
        }
        if (templateData.recipe === 'chrome-pdf') {
            extension = 'pdf'
            res.content = Buffer.from(res.content, 'base64');
        }
        const {dataUrlPathURL, dataUrlPath} = await uploadToS3(event.data.customerId, res.content, extension)
        console.log('dataUrlPathURL, dataUrlPath--',dataUrlPathURL, dataUrlPath);
        const policy = await getFilePolicy(dataUrlPath)
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken,
            dataUrlPath: dataUrlPath,
            bucketName: BUCKET_NAME
        };
        const generateProtectedURL = await generatePath(event.data.customerId, extension, accessParams, dataUrlPath)
        console.log('pdf file ', dataUrlPathURL)
        extension === 'base64' ?
          await sendReportsData(event.data.connectionId, 'base64', event.data.dataUrl, true, accessParams)
          : await sendReportsData(event.data.connectionId, generateProtectedURL, event.data.dataUrl, true)

        const response = {
            statusCode: 200,
            body: res.content.toString('base64'),
        }

        return response
    } catch (e) {
        console.log(e);
        await sendReportsData(event.data.connectionId, 'Error occurred in templates while generating reports', '', false)
        throw new Error(e)
    }
}


// let downloadFromS3 = async (url) => {
//     try {
//         const params = {
//             Bucket: BUCKET_NAME,
//             Key: url
//         };
//         const data = await s3.getObject(params);
//         console.log('->>>>>>>>>',data);
//         return {
//             dataUrlPath: JSON.parse(data.Body.transformToString('utf-8'))
//         }
//     } catch (error) {
//         console.log('error:  ',error);
//         return {error: 404}
//     }
// }


let downloadFromS3 = async (url) => {
    const streamToString = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

    const params = {
        "Bucket": BUCKET_NAME,
        "Key": url,
    }
    const command = new GetObjectCommand(params);

    try {
        let response = await s3.send(command);
        const { Body } = response;
        let result = await streamToString(Body);
        return {
            dataUrlPath: JSON.parse(result)
        }
    } catch (error) {
        console.log(error);
        return {error: 404}
    }
}

let generatePath = async (customerId, extension, accessParams, path) => {
    const signedParams = {
        Bucket: BUCKET_NAME,
        Key: `${path}`,
        Expires: 86400
    }
    return await getSignedUrl(s3, new GetObjectCommand(signedParams), {
        expiresIn:86400
    });
}

let uploadToS3 = async (customerId, data, extension) => {
    const fileName = `Reports/file/${customerId.toString()}/${Date.now().toString()}`
    const objectName = `${fileName}.${extension}`;
    console.log('fileName****',fileName);
    try {
        if (extension === 'pdf') {
            console.log('->>>>>>>',typeof data);
            console.log('->>>>>>>',data);
        }
        const params = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: data,
            ServerSideEncryption: 'AES256'
        })
        console.log('params****',params);
        await s3.send(params);
        return {
            dataUrlPath: objectName,
            dataUrlPathURL: `https:/` + BUCKET_NAME + `.s3.amazonaws.com/` + objectName
        }
    } catch (error) {
        console.log('error**************',error)
        return {error: 404}
    }
}

let sendReportsData = async (sessionId, message, dataUrl, status, accessFile) => {
    const config = {
        method: 'post',
        url: `https://api.${DOMAIN_NAME}/public/sendStatus`,
        headers: {
            'apikey': API_KEY
        },
        data: {
            sessionId,
            status: status,
            message: message,
            accessFile: accessFile,
            action: 'reports',
            dataUrl: dataUrl,
            region: process.env.region
        },
    };
    console.log(config.data)
    await axios(config)
      .then(function (response) {
          console.log('RES ', response)
          return JSON.parse(JSON.stringify(response.data));
      })
      .catch(function (error) {
          console.log('ERROR', error)
          return error;
      });
}

let getStsCredentials = async (policy) => {
    const params = {
        RoleArn: `arn:aws:iam::${AWS_ACCOUNT_NUMBER}:role/${ROLE_NAME}`,
        Policy: policy.policy,
        RoleSessionName: Date.now().toString(),
    };

    try {
        const command = new AssumeRoleCommand(params);
        return await stsClient.send(command);
    } catch (error) {
        throw error;
    }
};


let getFilePolicy = (path) => {
    return new Promise((resolve, reject) => {
        const action = 's3:GetObject'
        resolve({
            policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "allowRead",
                        "Effect": "Allow",
                        "Action": "${action}",
                        "Resource": "arn:aws:s3:::${BUCKET_NAME}/${path}"
                    }
                ]
            }`
        })
    })
}


async function precreateExtensionsLocationsCache() {
    const rootDir = path.join(path.dirname(require.resolve('jsreport')), '../../')
    const locationsPath = path.join(rootDir, 'node_modules/locations.json')

    if (FS.existsSync(locationsPath)) {
        console.log('locations.json found, extensions crawling will be skipped')
        const locations = JSON.parse(FS.readFileSync(locationsPath)).locations
        const tmpLocationsPath = path.join(os.tmpdir(), 'jsreport', 'core', 'locations.json')
        FS.ensureFileSync(tmpLocationsPath)
        FS.writeFileSync(tmpLocationsPath, JSON.stringify({
            [path.join(rootDir, 'node_modules') + '/']: {
                rootDirectory: rootDir,
                locations: locations.map(l => path.join(rootDir, l).replace(/\\/g, '/')),
                lastSync: Date.now()
            }
        }))

    } else {
        console.log('locations.json not found, the startup will be a bit slower')
    }
}