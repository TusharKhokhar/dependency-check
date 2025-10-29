const {encryptText, decryptText} = require("./encryptDecrypt");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
    performEncryption: async (data) => {
        try {
        if (data.AuthProvider === 'oidc' && data.OpenIdConfig.ClientID && data.OpenIdConfig.ClientSecret) {
            data.OpenIdConfig.ClientID = await encryptText(data.OpenIdConfig.ClientID)
            data.OpenIdConfig.ClientSecret = await encryptText(data.OpenIdConfig.ClientSecret)
            return data
        }
        if (data.AuthProvider === 'saml' && data.SamlConfig.Certificate) {
            data.SamlConfig.Certificate = await encryptText(data.SamlConfig.Certificate)
            return data
        }
        if (data.AuthProvider === 'ldap' && data.LdapConfig.BindCredential) {
            data.LdapConfig.BindCredential = await encryptText(data.LdapConfig.BindCredential)
            data.LdapConfig.CaCert = data.LdapConfig.CaCert ? await encryptText(data.LdapConfig.CaCert) : null
            return data
        }
        if (data.AuthProvider === 'azuread' && data.AadConfig.ClientId && data.AadConfig.ClientSecret) {
            data.AadConfig.ClientId = await encryptText(data.AadConfig.ClientId)
            data.AadConfig.ClientSecret = await encryptText(data.AadConfig.ClientSecret)
            return data
        }
        if (data.AuthProvider === 'gsuite' && data.GSuiteConfig.ClientId && data.GSuiteConfig.ClientSecret) {
            data.GSuiteConfig.ClientId = await encryptText(data.GSuiteConfig.ClientId)
            data.GSuiteConfig.ClientSecret = await encryptText(data.GSuiteConfig.ClientSecret)
            return data
        }
        if (data.AuthProvider === 'innovative' && data.InnovativeConfig.ClientId && data.InnovativeConfig.ClientSecret) {
            data.InnovativeConfig.ClientId = await encryptText(data.InnovativeConfig.ClientId)
            data.InnovativeConfig.ClientSecret = await encryptText(data.InnovativeConfig.ClientSecret)
            data.InnovativeConfig.Password = data.InnovativeConfig?.Password ? await encryptText(data.InnovativeConfig.Password) : null
            return data
        }
        if (data.AuthProvider === 'sirsi' && data.SirsiConfig.ClientId && data.SirsiConfig.AppId) {
            data.SirsiConfig.ClientId = await encryptText(data.SirsiConfig.ClientId)
            data.SirsiConfig.AppId = await encryptText(data.SirsiConfig.AppId)
            data.SirsiConfig.Password = data?.SirsiConfig?.Password ? await encryptText(data.SirsiConfig.Password) : null
            return data
        }
        if (data.AuthProvider === 'polaris') {
            data.PolarisConfig.PAPIAccessId = data?.PolarisConfig?.PAPIAccessId ?
              await encryptText(data.PolarisConfig.PAPIAccessId) : null
            data.PolarisConfig.PAPIAccessKey = data?.PolarisConfig?.PAPIAccessKey ?
              await encryptText(data.PolarisConfig.PAPIAccessKey) : null
            data.PolarisConfig.Password = data?.PolarisConfig?.Password ?
              await encryptText(data.PolarisConfig.Password) : null
            return data
        }
        if (data.AuthProvider === 'sip2' && data.Sip2Config.Password) {
            data.Sip2Config.Password = await encryptText(data.Sip2Config.Password)
            return data
        }
        if (data.AuthProvider === 'externalCardValidation') {
            data.ExternalCardValidationConfig.ClientId = data?.ExternalCardValidationConfig?.ClientId ? await encryptText(data.ExternalCardValidationConfig.ClientId) : null
            data.ExternalCardValidationConfig.ClientSecret = data?.ExternalCardValidationConfig?.ClientSecret ? await encryptText(data.ExternalCardValidationConfig.ClientSecret) : null
            return data
        }
        if (data.AuthProvider === 'wkp') {
            data.WkpConfig.ClientId = data?.WkpConfig?.ClientId ? await encryptText(data.WkpConfig.ClientId) : null
            data.WkpConfig.ClientSecret = data?.WkpConfig?.ClientSecret ? await encryptText(data.WkpConfig.ClientSecret) : null
            return data
        }
        return data
        } catch (error) {
            log.error("Error in performEncryption:", error)
        }
    },
    performDecryption: async (data) => {
        try {
            if (data.AuthProvider === 'oidc' && data.OpenIdConfig.ClientID && data.OpenIdConfig.ClientSecret) {
                data.OpenIdConfig.ClientID = await decryptText(data.OpenIdConfig.ClientID)
                data.OpenIdConfig.ClientSecret = await decryptText(data.OpenIdConfig.ClientSecret)
                return data
            }
            if (data.AuthProvider === 'saml' && data.SamlConfig.Certificate) {
                data.SamlConfig.Certificate = await decryptText(data.SamlConfig.Certificate)
                return data
            }
            if (data.AuthProvider === 'ldap' && data.LdapConfig.BindCredential) {
                data.LdapConfig.BindCredential = await decryptText(data.LdapConfig.BindCredential)
                data.LdapConfig.CaCert = data.LdapConfig.CaCert ? await decryptText(data.LdapConfig.CaCert) : null
                return data
            }
            if (data.AuthProvider === 'azuread' && data.AadConfig.ClientId && data.AadConfig.ClientSecret) {
                data.AadConfig.ClientId = await decryptText(data.AadConfig.ClientId)
                data.AadConfig.ClientSecret = await decryptText(data.AadConfig.ClientSecret)
                return data
            }
            if (data.AuthProvider === 'gsuite' && data.GSuiteConfig.ClientId && data.GSuiteConfig.ClientSecret) {
                data.GSuiteConfig.ClientId = await decryptText(data.GSuiteConfig.ClientId)
                data.GSuiteConfig.ClientSecret = await decryptText(data.GSuiteConfig.ClientSecret)
                return data
            }
            if (data.AuthProvider === 'innovative' && data.InnovativeConfig.ClientId && data.InnovativeConfig.ClientSecret) {
                data.InnovativeConfig.ClientId = await decryptText(data.InnovativeConfig.ClientId)
                data.InnovativeConfig.ClientSecret = await decryptText(data.InnovativeConfig.ClientSecret)
                data.InnovativeConfig.Password = data.InnovativeConfig?.Password ? await decryptText(data.InnovativeConfig.Password) : null
                return data
            }
            if (data.AuthProvider === 'sirsi' && data.SirsiConfig.ClientId && data.SirsiConfig.AppId) {
                data.SirsiConfig.ClientId = await decryptText(data.SirsiConfig.ClientId)
                data.SirsiConfig.AppId = await decryptText(data.SirsiConfig.AppId)
                data.SirsiConfig.Password = data?.SirsiConfig?.Password  ? await decryptText(data.SirsiConfig.Password) : null
                return data
            }
            if (data.AuthProvider === 'polaris') {
                data.PolarisConfig.PAPIAccessId = data?.PolarisConfig?.PAPIAccessId ?
                  await decryptText(data.PolarisConfig.PAPIAccessId) : null
                data.PolarisConfig.PAPIAccessKey = data?.PolarisConfig?.PAPIAccessKey ?
                  await decryptText(data.PolarisConfig.PAPIAccessKey) : null
                data.PolarisConfig.Password = data?.PolarisConfig?.Password ?
                  await decryptText(data.PolarisConfig.Password) : null
                return data
            }
            if (data.AuthProvider === 'sip2' && data.Sip2Config.Password) {
                data.Sip2Config.Password = await decryptText(data.Sip2Config.Password)
                return data
            }
            if (data.AuthProvider === 'externalCardValidation') {
                data.ExternalCardValidationConfig.ClientId = data?.ExternalCardValidationConfig?.ClientId ? await decryptText(data.ExternalCardValidationConfig.ClientId) : null
                data.ExternalCardValidationConfig.ClientSecret = data?.ExternalCardValidationConfig?.ClientSecret ? await decryptText(data.ExternalCardValidationConfig.ClientSecret) : null
                return data
            }
            if (data.AuthProvider === 'wkp') {
                data.WkpConfig.ClientId = data?.WkpConfig?.ClientId ? await decryptText(data.WkpConfig.ClientId) : null
                data.WkpConfig.ClientSecret = data?.WkpConfig?.ClientSecret ? await decryptText(data.WkpConfig.ClientSecret) : null
                return data
            }
        } catch (error) {
            log.info("Decryption failed, returning data without decryption.")
            return data;
        }
        return data;
    }
}