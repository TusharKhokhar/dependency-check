module.exports = {
  securityCode: (code) => `ePRINTit: Your security code\n is:${code}. It expires in 10\n minutes. Don't share this\n code with anyone.\n Reply STOP to opt-out. Msg&data rates may apply`,
  // notifyUser: (customerLocation, releaseCode, guestInfo, fileList, customerName) => `(ePRINTit Printing) Your submission was\nreceived successfully at\n${customerName},\nCard Number: ${cardNumber},\nFile Name: ${fileList}`,
  loginTemplate: (cardNumber, fileList, customerName, LoginDisplayText) =>
      `(ePRINTit) Received at \n${customerName}, \n${LoginDisplayText}: ${cardNumber}\n, Files: ${fileList}. Reply STOP to opt-out. Msg & data rates may apply.`,
  guestTemplate: (guestInfo, fileList, customerName, GuestDisplayText) =>
      `(ePRINTit) Received at \n${customerName}, \n${GuestDisplayText}: ${guestInfo}\n Files: ${fileList}. Reply STOP to opt-out. Msg & data rates may apply.`,
  releaseCodeTemplate: (releaseCode, fileList, customerName, ReleaseCodeDisplayText) =>
      `(ePRINTit) Received at \n${customerName}, \n${ReleaseCodeDisplayText}: ${releaseCode}\n Files: ${fileList}. Reply STOP to opt-out. Msg & data rates may apply.`
}
