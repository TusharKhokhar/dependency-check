const forge = require('node-forge')

const makeNumberPositive = (hexString) => {
  let mostSignificativeHexDigitAsInt = parseInt(hexString[0], 16)

  if (mostSignificativeHexDigitAsInt < 8) return hexString

  mostSignificativeHexDigitAsInt -= 8
  return mostSignificativeHexDigitAsInt.toString() + hexString.substring(1)
}

// Get Certificate Expiration Date (Valid for 50 Years)
const getCertNotAfter = (notBefore) => {
  const ninetyDaysLater = new Date(notBefore.getTime())
  const year = ninetyDaysLater.getFullYear() + 50
  const month = (ninetyDaysLater.getMonth() + 1).toString().padStart(2, '0')
  const day = ninetyDaysLater.getDate()
  return new Date(`${year}-${month}-${day} 23:59:59Z`)
}

// Generate a random serial number for the Certificate
const randomSerialNumber = () => {
  return makeNumberPositive(forge.util.bytesToHex(forge.random.getBytesSync(20)))
}

// Get the Not Before Date for a Certificate (will be valid from 2 days ago)
const getCertNotBefore = () => {
  const twoDaysAgo = new Date(Date.now() - 60 * 60 * 24 * 2 * 1000)
  const year = twoDaysAgo.getFullYear()
  const month = (twoDaysAgo.getMonth() + 1).toString().padStart(2, '0')
  const day = twoDaysAgo.getDate()
  return new Date(`${year}-${month}-${day} 00:00:00Z`)
}

const DEFAULT_C = 'US'
const DEFAULT_ST = 'Illinois'
const DEFAULT_L = 'Willowbrook'
const DEFAULT_O = 'ePRINTit USA'
const DEFAULT_OU = 'ePRINTit Saas Solution'

const createDeviceCert = (certificatePem, encryptedPrivateKey, thingName) => {
  const rootCAObject = { certificate: certificatePem, privateKey: encryptedPrivateKey }
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line prefer-promise-reject-errors
      if (!rootCAObject || !rootCAObject.hasOwnProperty('certificate') || !rootCAObject.hasOwnProperty('privateKey')) reject('"rootCAObject" must be an Object with the properties "certificate" & "privateKey"');
      // Convert the Root CA PEM details, to a forge Object
      const caCert = forge.pki.certificateFromPem(rootCAObject.certificate)
      const caKey = forge.pki.privateKeyFromPem(rootCAObject.privateKey)

      // Create a new Keypair for the Host Certificate
      const hostKeys = forge.pki.rsa.generateKeyPair(2048)

      // Define the attributes/properties for the Host Certificate
      const attributes = [{
        shortName: 'C',
        value: DEFAULT_C
      }, {
        shortName: 'ST',
        value: DEFAULT_ST
      }, {
        shortName: 'L',
        value: DEFAULT_L
      }, {
        shortName: 'O',
        value: DEFAULT_O
      }, {
        shortName: 'OU',
        value: DEFAULT_OU
      }
      ]

      const extensions = [{
        name: 'basicConstraints',
        cA: false
      }, {
        name: 'nsCertType',
        server: true
      }, {
        name: 'subjectKeyIdentifier'
      }, {
        name: 'authorityKeyIdentifier',
        authorityCertIssuer: true,
        serialNumber: caCert.serialNumber
      }, {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true
      }, {
        name: 'extKeyUsage',
        serverAuth: true
      }]

      // Create an empty Certificate
      const newHostCert = forge.pki.createCertificate()

      // Set the attributes for the new Host Certificate
      newHostCert.publicKey = hostKeys.publicKey
      newHostCert.serialNumber = randomSerialNumber()
      newHostCert.thingName = thingName
      newHostCert.validity.notBefore = getCertNotBefore()
      newHostCert.validity.notAfter = getCertNotAfter(newHostCert.validity.notBefore)
      newHostCert.setSubject(attributes)
      newHostCert.setIssuer(caCert.subject.attributes)
      newHostCert.setExtensions(extensions)

      // Sign the new Host Certificate using the CA
      newHostCert.sign(caKey, forge.md.sha512.create())

      // Convert to PEM format
      const pemHostCert = forge.pki.certificateToPem(newHostCert)
      const pemHostKey = forge.pki.privateKeyToPem(hostKeys.privateKey)

      resolve({ certificate: pemHostCert, privateKey: pemHostKey, notAfter: newHostCert.validity.notAfter })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = { createDeviceCert }
