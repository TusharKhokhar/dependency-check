const axios = require('axios')
const simpleParser = require('mailparser').simpleParser
const bluebird = require("bluebird");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client();
const CustomLogger = require("./helper/customLogger");
const log = new CustomLogger()

const {basePath, apiKey, urlDomain, bucketName, minimumAttachmentSize, maximumAttachmentLimit} = require('./config')
const {testRegexBw, testRegexColor, testRegexDomain, parseCorrectEmail, testLocationSenderEmail} = require("./utils");
const { getDb } = require("./config/db");
const { customerDataByDomainName } = require("./models/customers");
const { jobListByCustomerId } = require("./models/jobLists");
const { locationByCustomerId } = require("./models/locations");
const {
  customizationTextByCustomerId,
} = require("./models/customizationTexts");
const { generateApiResponse } = require('./helper/handler-response');
const axiosWithRetry = require('./helper/axios-retry');
const paperSizeEnums = ['Letter', 'Legal', 'Ledger', 'Tabloid', 'A4', 'A3'];

module.exports.handler = async (event, context) => {
    try {
    const data = await getFileData(event)
    const parsed = await simpleParser(data.Body)
    // checking for spam or virus
    const isSpamOrVirusVerdict = checkForSpamOrVirus(parsed)
    const isValid =
      parsed &&
      parsed.from?.value?.[0]?.address &&
      parsed.to?.value?.[0]?.address;
      if (isSpamOrVirusVerdict || !isValid) {
        log.info("spam or not a valid to email", parsed);
        return
    }
    if (isValid) {
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase();
        let toEmail = parsed.to?.value?.[0]?.address?.toLowerCase()
        log.info("fromEmail====",fromEmail);
        log.info("toEmail====",toEmail);
        let { subdomain, color, paperSize, duplex, correctEmail, basicEmails, locationId } = await testSenderEmail(toEmail, parsed)
        log.info("sender email details-----__>>>>>>>>>>>>>>", {
          subdomain,
          color,
          paperSize,
          duplex,
          correctEmail,
          basicEmails,
        });
        if (!subdomain) {
            log.info('Subdomain could not be retrieved', parsed);
        } else {
            const db = await getDb();
            const customerData = await customerDataByDomainName(db, subdomain);
            if(!customerData) {
                throw new Error("Customer Not Found");
            }
              customerData.id = customerData._id.toString();
              delete customerData._id;
            const {
              id: customerId,
              CustomerName: customerName,
              DomainName,
              Tier,
            } = customerData;
            log.info("customerData >>>>>>>>>>>>>>",{ customerId, Tier, DomainName, customerName});
            const jobList = await jobListByCustomerId(db, customerId);
            log.info("jobLists >>>>>>>>>>>>>>", jobList);
            const customizationsText = await customizationTextByCustomerId(db,customerId);
            log.info("customizationsText >>>>>>>>>>>>>>",customizationsText);
            const locations = await locationByCustomerId(db, customerId);
            log.info("locations >>>>>>>>>>>>>>", locations);
            
            if (isAttachmentLimitExceeded(parsed.attachments)) {
                return await sendAttachmentLimitExceededNotification(fromEmail, customerName, DomainName, Tier);
            }
            const isLocationEmail = await locationChecker(locations, correctEmail, toEmail, parsed)
            log.info("isLocationEmail==========",isLocationEmail);
            if (isLocationEmail.isValid) {
                subdomain = isLocationEmail.subdomain
                color = isLocationEmail.color
                paperSize = isLocationEmail.paperSize
                duplex = isLocationEmail.duplex
                locationId = isLocationEmail.locationId
            } else if (!basicEmails && correctEmail && customizationsText?.AdvancedEmailConfiguration?.Enabled) {
                const aliasEmails = await customizationsText?.AdvancedEmailConfiguration?.UnGroupedAdvancedEmailAlias
                  .map(email => email.Email.toLowerCase())
                let paperSizeLowerCase = paperSizeEnums.map( paper => paper.toLowerCase())
                paperSize = paperSize ? paperSizeEnums[paperSizeLowerCase.indexOf(paperSize.toLowerCase())] : null
                if (!aliasEmails.includes(correctEmail.toLowerCase())) {
                    log.info('Invalid Email found', correctEmail)
                    return generateApiResponse(400, "Invalid email found for alias check");
                }
            } else if (!basicEmails && !isLocationEmail.isValid) {
                log.info('Invalid Email found', correctEmail)
                return generateApiResponse(400, "Invalid email found for location check");
            }
            const supportedFileFormats = customizationsText?.SelectFileSection?.SupportedFileTypes
            let automaticDelivery = jobList.AutomaticPrintDelivery
            let attachments = parsed.attachments
            let { attachmentsUnderMinSize, validAttachments } = await checkAttachmentsSize(attachments);
            attachments = validAttachments
            const bodyContent = parsed.html ||  parsed.textAsHtml || parsed.text
            const htmlPage = formatHtmlAttachment(bodyContent)
            attachments.push(htmlPage)
            const {
                dataSetArray: dataSet,
                filesNotSupported, newAttachments
            } = await createSignedUrlDataSet(attachments, supportedFileFormats)
            attachments = newAttachments
            if (filesNotSupported && filesNotSupported.length > 0) {
                let params = {
                    email: fromEmail,
                    files: filesNotSupported,
                    customerName,
                    reason: 'FILE_NOT_SUPPORTED',
                    customerUrl: customizationsText.MainSection &&
                    customizationsText.MainSection.TopSection &&
                    customizationsText.MainSection.TopSection.CustomerLogo
                      ? customizationsText.MainSection.TopSection.CustomerLogo
                      : ''
                }
                await sendFailedNotification(params, DomainName, Tier)
            } else if (attachmentsUnderMinSize && attachmentsUnderMinSize.length > 0) {
                return await handleAttachmentsUnderMinSize(fromEmail, attachmentsUnderMinSize, customerName, DomainName, Tier)
            } else {
                let {
                    data: {
                        arrayOfLinks: signedUrlsArray,
                        id: recordId
                    }
                } = await createSignedURLs(dataSet, subdomain, Tier)
                const mergedData = await mergeSignedUrlAndAttachments(signedUrlsArray, attachments)
                let confirmUploadData = await confirmUploadDataForm(jobList, color, mergedData, paperSize, duplex)
                const user =  await getUserName(subdomain, fromEmail, Tier)
                log.info('user *************',user)
                await confirmFileUploadPromise(confirmUploadData, fromEmail, customerId, recordId, Tier,
                  automaticDelivery, subdomain, user, locationId)
                await uploadAttachmentsFiles(mergedData)
                return;
            }
        }
    }
    } catch (error) {
        log.error("An unexpected error occurred in email file upload=====>",error?.response?.data || error?.response || error);
    }
    
}

// 1) need to add logic to skip file which are not supported in the print job - ask Paul
// 2) if we are skipping to we need to update user about the same
// 3) stop sending the email confirmation until all files are processed - this will require changes in confirm file
// upload api
// 4) add some logic to trigger email or sms once the job is processed
// 5) if job fails in containerized lambda then create an event to update the user about the job failure


const formatHtmlAttachment = (html) => {
    return {
        type: 'attachment',
        content: html,
        contentType: 'text/html',
        filename: 'email.html'
    }
}

const confirmFileUploadPromise = (data, email, customerId, recordId, Tier, automaticDelivery, domainName, user, locationId) => {
    return new Promise((resolve, reject) => {
        let newData = {
            "notification": {
                "email": email
            },
            "data": data,
            "customerId": customerId,
            "locationId": locationId,
            "recordId": recordId,
            "userName": user?.data?.Username ? user.data.Username : '',
            "automaticDelivery": !!automaticDelivery
        }
        const config = {
            method: 'post',
            url: `${basePath}/confirmFileUpload`,
            headers: {
                'tier': Tier,
                'apiKey': apiKey,
                'Content-Type': 'application/json',
                'subdomain': domainName
            },
            data: newData
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response.data)));
          })
          .catch(function (error) {
              console.log(error);
              reject(error);
          });
    })
}

const confirmUploadDataForm = (data, color, signedUrlObject, paperSize, duplex) => {
    let {
        DefaultValues: {
            Duplex: Duplex,
            PaperSize: PaperSize,
            Orientation: Orientation,
            Color: ColorDefault
        },
    } = data
    PaperSize = paperSize ? paperSize : PaperSize
    Duplex = duplex ? duplex : Duplex
    let confirmUploadArray = []
    return new Promise((resolve, reject) => {
        signedUrlObject.forEach(uploadSet => {
            confirmUploadArray.push({
                "color": color ? color : ColorDefault,
                "duplex": Duplex,
                "paperSize": PaperSize,
                "copies": uploadSet.copies ? uploadSet.copies : 1,
                "totalPagesPerFile": 1,
                "orientation": Orientation,
                "pageRange": "1-1",
                "originalFileNameWithExt": uploadSet.filename,
                "newFileName": uploadSet.newFileName,
                "uploadStatus": true,
                "uploadedFrom": 'email'
            })
        })
        resolve(confirmUploadArray)
    })
}

const domainInfo = (domain) => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'get',
            url: `${basePath}/domainInfo?domain=${domain}`,
            headers: {
                'apiKey': apiKey
            },
            data: ''
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response.data)));
          })
          .catch(function (error) {
              console.log(error?.response?.data);
              reject(error);
          });
    })
}

const getUserName = (domain, emailAddress, tier) => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'post',
            url: `${basePath}/getUserEmailAddress`,
            headers: {
                'apiKey': apiKey,
                'subdomain': domain,
                'tier': tier
            },
            data: {email: emailAddress}
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response.data)));
          })
          .catch(function (error) {
              console.log(error);
              reject(error);
          });
    })
}

const mergeSignedUrlAndAttachments = (signedUrls, uploadAttachments) => {
    return new Promise((resolve, reject) => {
        let finalArray = []
        Promise.all([signedUrls.forEach(async (data, index) => {
            data.content = uploadAttachments[index].content
            data.totalPagesPerFile = 1
            const splitDoc = uploadAttachments[index].filename.split('.')
            const fileNameArray = uploadAttachments[index].filename.split('.')
            fileNameArray.pop()
            data.filename = `${fileNameArray.join('.')}.${splitDoc[splitDoc.length - 1].toLowerCase()}`
            data.contentType = uploadAttachments[index].contentType
            finalArray.push(data)
        })]).then(
          reso => {
              resolve(finalArray)
          }
        ).catch(error => {
            console.log('Error: ', error)
            resolve(finalArray)
        })
    })
}

const uploadAttachmentsFiles = async (data) => {
    await bluebird.Promise.map(data, async (upload) => {
        const config = {
            method: 'put',
            url: upload.signedUrl,
            headers: {
                'Content-Type': upload.contentType
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            data: upload.content
        };
        await axiosWithRetry(config);
    }, {concurrency: 3});
}

const createSignedURLs = (data, domainName, Tier) => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'post',
            url: `${basePath}/signedUrls`,
            headers: {
                'tier': Tier,
                'apiKey': apiKey,
                'subdomain': domainName,
                'Content-Type': 'application/json'
            },
            data: {uploadObjectsDetails: data}
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response.data)))
          })
          .catch(function (error) {
              console.log(error);
              reject(error)
          });
    })
}

const sendFailedNotification = (data, domainName, Tier) => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'post',
            url: `${basePath}/job/fail`,
            headers: {
                'tier': Tier,
                'apiKey': apiKey,
                'subdomain': domainName,
                'Content-Type': 'application/json'
            },
            data: data
        };
        axios(config)
          .then(function (response) {
              resolve(JSON.parse(JSON.stringify(response.data)))
          })
          .catch(function (error) {
              console.log(error);
              reject(error)
          });
    })
}

const createSignedUrlDataSet = (data, supportedFilesFormat) => {
    return new Promise((resolve, reject) => {
        let dataSetArray = []
        let filesNotSupported = []
        let newAttachments = []
        data.forEach(upload => {
            if (!upload.related) {
                const splitDoc = upload.filename.split('.')
                const fileNameArray = upload.filename.split('.')
                fileNameArray.pop()
                const fileName = `${fileNameArray.join()}.${splitDoc[splitDoc.length - 1].toLowerCase()}`
                const extension = splitDoc ? splitDoc[splitDoc.length - 1].toLowerCase() : 'pdf'
                if (supportedFilesFormat.includes(extension.toLowerCase())) {
                    dataSetArray.push({
                        contentType: upload.contentType,
                        fileName: fileName,
                        extension: extension
                    })
                } else {
                    filesNotSupported.push(upload.filename)
                }
                newAttachments.push(upload)
            }
        })
        resolve({dataSetArray, filesNotSupported, newAttachments})
    })
}

const getFileData = async (event) => {
    const srcBucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        const command = new GetObjectCommand(params);
        return await s3.send(command);
    } catch (error) {
        console.log(error);
        return error;
    }
}

const testSenderEmail = async (to, parsed) => {
    let count = to.split('-')
    if (await testRegexBw(to) && count.length === 2 ) return {color: 'Grayscale', subdomain: to.split('-')[1]?.split('@')[0],
        basicEmails: true}
    else if (await testRegexColor(to) && count.length === 2) return {color: 'Color', subdomain: to.split('-')[1]?.split('@')[0],
        basicEmails: true}
    else if (await testRegexDomain(to) && count.length === 1) return {color: null, subdomain: to.split('@')[0],
        basicEmails: true}
    else return await parseCorrectEmail(parsed)
}

const locationChecker = async (locations, correctEmail, to, parsed) => {
    const obj = {}
    for (const loc of locations) {
        let modifiedEmail = correctEmail;

        if (!await testRegexBw(correctEmail) && !await testRegexColor(correctEmail)) {
            modifiedEmail = `${loc.ShortName}-${correctEmail}`;
        }

        const emailAddresses = (loc?.AdvancedEmails?.AdvancedEmailAlias || []).map(email => email.Email);

        if (emailAddresses.includes(to) || emailAddresses.includes(modifiedEmail)) {
            obj.locationId = loc._id;
            break;
        }
    }
    if (obj.locationId) {
        const values = await testLocationSenderEmail(to, parsed)
        Object.assign(obj, values)
        obj.isValid = true
    } else {
        return obj.isValid = false
    }

    return obj;
}

let checkForSpamOrVirus = (parsed) => {
  const headers = parsed.headers;
  const spamVerdictStatus = headers.get("x-ses-spam-verdict");
  const virusVerdictStatus = headers.get("x-ses-virus-verdict");

  if (virusVerdictStatus === "FAIL") {
    console.log("Virus verdict email found : ", JSON.stringify(parsed));
    console.log("headers : ", JSON.stringify(parsed?.headers));
    return true;
  }

  if (spamVerdictStatus === "FAIL") {
    console.log("Spam email found : ", JSON.stringify(parsed));
    console.log("headers : ", JSON.stringify(parsed?.headers));
    const subject = parsed?.subject ? parsed.subject.trim() : "";
    const body = parsed?.text ? parsed.text.trim() : "";

    if (!subject || !body) {
      console.log("Spam verdict email found but empty subject/body — bypassing check");
      return false;
    }
    return true;
  }
  return false
};

let handleAttachmentsUnderMinSize = async (
  email,
  invalidAttachments,
  customerName,
  DomainName,
  Tier
) => {
  if (invalidAttachments && invalidAttachments.length > 0) {
    let params = {
      email: email,
      files: invalidAttachments,
      customerName: customerName,
      reason: "invalid-attachment-size",
      message: `We regret to inform you that some of your attached files were below our minimum size (${minimumAttachmentSize}kb) requirement and couldn't be processed successfully.`,
    };
    await sendFailedNotification(params, DomainName, Tier);
  }
};

let checkAttachmentsSize = async (allAttachments) => {
  try {
    const minAttachmentSize = 1024 * minimumAttachmentSize; // converting kb to bytes
    const attachmentsUnderMinSize = [];
    const validAttachments = [];

    for (const attachment of allAttachments) {
      if (attachment.size < minAttachmentSize && !attachment.related) {
        attachmentsUnderMinSize.push(attachment.filename);
      } else {
        validAttachments.push(attachment);
      }
    }
    return {
      attachmentsUnderMinSize,
      validAttachments,
    };
  } catch (error) {
    throw error;
  }
};

let isAttachmentLimitExceeded = (attachmentList) => {
  const attachmentWithoutEmailSignature = attachmentList.filter(
    (attachment) => !attachment.related
  );

  if (attachmentWithoutEmailSignature.length > maximumAttachmentLimit) {
    return true;
  }
  return false;
};

let sendAttachmentLimitExceededNotification = async (
  email,
  customerName,
  DomainName,
  Tier
) => {
  let params = {
    email: email,
    customerName: customerName,
    reason: "attachment-limit-exceeded",
    message: `Your submission includes more than ${maximumAttachmentLimit} attachments. Please reduce the number of attachments in the email and try again.`,
  };
  return await sendFailedNotification(params, DomainName, Tier);
};