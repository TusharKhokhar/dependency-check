const {envDomain} = require('./config')
console.log('envDomain====',envDomain)
const { ObjectId } = require("mongodb");
let extractEmail = async (input, color) => {
    let regex = new RegExp(color + "@eprintitsaas." + envDomain, 'i')
    return regex.exec(input)
}

let testRegexDomain = async (input) => {
    let regex = new RegExp("@eprintitsaas." + envDomain, 'i')
    return regex.test(input);
}

let testRegexBw = async (input) => {
    let regex = new RegExp("bw-.*@eprintitsaas." + envDomain, 'i')
    return regex.test(input);
}

let testRegexColor = async (input) => {
    let regex = new RegExp("color-.*@eprintitsaas." + envDomain, 'i')
    return regex.test(input);
}

const parseCorrectEmail = async (parsed, isLocation) => {
    const correctEmail = await parseDataFromHeaders(parsed)
    console.log('correctEmail*******',correctEmail);
    let { paperSize, duplex, basicEmails } = !isLocation ? await countHyphen(correctEmail) : await countHyphenLocation(correctEmail)
    const subDomain = correctEmail.split('-')[correctEmail.split('-').length - 1]
    console.log('correctEmail ',correctEmail);
    if (await testRegexBw(correctEmail)) return {
        color: 'Grayscale',
        subdomain: subDomain?.split('@')[0],
        paperSize: paperSize,
        duplex: duplex,
        correctEmail,
        basicEmails: basicEmails
    }
    else if (await testRegexColor(correctEmail)) return {
        color: 'Color',
        subdomain: subDomain?.split('@')[0],
        paperSize: paperSize,
        duplex: duplex,
        correctEmail,
        basicEmails: basicEmails
    }
    else if (await testRegexDomain(correctEmail)) return {
        color: null,
        subdomain: correctEmail.split('@')[0],
        paperSize: paperSize,
        duplex: duplex,
        correctEmail,
        basicEmails: basicEmails
    }
}

const parseDataFromHeaders = async (parsed) => {
    const data = parsed.headers.get('received')
    let email = null
    await Promise.all(data.map( async d=> {
        let res =  await extractEmail(d, 'bw-.*')
        res =  !res ? await extractEmail(d, 'color-.*') : res
        res =  !res ? await extractEmail(d, '[A-Za-z]*') : res
        if(res && res[0]){
            email = res[0]
        }
    }))
    return email?.toLowerCase()
}

const countHyphen = async (correctEmail) => {
    let color, paperSize, duplex, emailType = true;
    let attributes = correctEmail.split('-')
    if (attributes.length === 2) {
        color = attributes[0]
        emailType = true
    } else if (attributes.length === 3){
        color = attributes[0]
        duplex = attributes[1].toLowerCase() !== 'onesided'
        emailType = false
    } else if (attributes.length === 4){
        color = attributes[0]
        paperSize = toTitleCase(attributes[2])
        duplex = attributes[1].toLowerCase() !== 'onesided'
        emailType = false
    }
    return {color, paperSize, duplex, basicEmails: emailType}
}

const countHyphenLocation = async (correctEmail) => {
    let color, paperSize, duplex
    let attributes = correctEmail.split('-')
    if (attributes.length === 3) {
        color = attributes[0]
    } else if (attributes.length === 4){
        color = attributes[0]
        duplex = attributes[1].toLowerCase() !== 'onesided'
    } else if (attributes.length === 5){
        color = attributes[0]
        paperSize = toTitleCase(attributes[2])
        duplex = attributes[1].toLowerCase() !== 'onesided'
    }
    return {color, paperSize, duplex, basicEmails: false}
}

const toTitleCase = (str) => {
    return str.replace(
      /\w\S*/g,
      function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
}

const testLocationSenderEmail = async (to, parsed) => {
    let count = to.split('-')
    if (await testRegexBw(to) && count.length === 3 ) return {color: 'Grayscale', subdomain: to.split('-')[to.split('-').length - 1]?.split('@')[0],
        basicEmails: true}
    else if (await testRegexColor(to) && count.length === 3) return {color: 'Color', subdomain: to.split('-')[to.split('-').length - 1]?.split('@')[0],
        basicEmails: true}
    else return await parseCorrectEmail(parsed, true)
}

const getObjectId = {
  createFromHexString: (id) => {
    console.log("id*****", id);
    if (!id) {
      return ObjectId.createFromHexString(generateRandomHexString(24));
    }
    if (id instanceof ObjectId) {
      return id;
    }
    try {
      return ObjectId.createFromHexString(id);
    } catch (error) {
      console.error("Invalid ObjectId:", error.message);
      console.error(id);
      throw new Error("Invalid ObjectId");
    }
  },
};

const aliasEmailsGroup = (advancedEmails) => {
  let finalEmails = {
    bw: [],
    color: [],
  };

  advancedEmails?.forEach((email) => {
    email.CombinationType.split("_")[0] === "bw"
      ? finalEmails.bw.push(email)
      : finalEmails.color.push(email);
  });

  return finalEmails;
};
  
module.exports = {parseCorrectEmail, testRegexBw, testRegexColor, testRegexDomain, testLocationSenderEmail, getObjectId, aliasEmailsGroup}