const axios = require("axios");
const {domainName} = require("../config/config");
const CustomLogger = require("../helpers/customLogger");
const {GraphQLError} = require("graphql");
const log = new CustomLogger()

module.exports = {
   srFaxCall: async ({
                         faxCredential, senderFaxNumber, senderEmailAddress, sendTo,
                         fileName, contentBase64, subject, body, domain, CoverPageEnabled: coverPageEnabled,
                         FromCoverPage: fromCoverPage,
                         ToCoverPage: toCoverPage
                     }) => {
       const data = {
           sCoverPage: coverPageEnabled ? 'Standard' : null,
           action: 'Queue_Fax',
           access_id: faxCredential.srfaxId,
           access_pwd: faxCredential.srfaxPassword,
           sCallerID: senderFaxNumber,
           sSenderEmail: senderEmailAddress,
           sFaxType: 'SINGLE',
           sToFaxNumber: sendTo,
           sResponseFormat: 'JSON',
           sAccountCode: domain,
           sNotifyURL: `https://api.${domainName}/public/fax/notify`,
           sFileName_x: fileName,
           sFileContent_x: contentBase64 ? Buffer.from(contentBase64).toString('base64') : null,
           sCPSubject: subject,
           sCPFromName: fromCoverPage,
           sCPToName: toCoverPage,
           sCPComments: body

       }
       return await axios.post('https://www.srfax.com/SRF_SecWebSvc.php', data ).then((responseReceived) => {
            const response = responseReceived.data
            if (response?.Status === 'Failed' ) {
                log.info('Fax Failed', response.Result);
                throw new GraphQLError(response.Result, {
                    extensions: {
                        code: '400'
                    }
                })
            } else {
                log.info('Fax sent');
                return response
            }
        }).catch((error) => {
            log.error('Fail while sending')
            log.error(error)
            throw new Error(error)
        })
    }
}