const UsageResolvers = require('./usages')
const customerResolvers = require('./customers')
const customizationResolvers = require('./customizations')
const locationResolvers = require('./locations')
const areaResolvers = require('./areas')
const groupResolvers = require('./groups')
const deviceResolvers = require('./devices')
const thingResolvers = require('./things')
const settingResolvers = require('./settings')
const loggingResolvers = require('./loggings')
const userResolvers = require('./users')
const bucketUploadResolvers = require('./bucketUploads')
const customizationTextResolvers = require('./customizationText')
const licenseResolvers = require('./licensing')
const PermissioneResolvers = require('./permissions')
const ProfileResolvers = require('./profiles')
const roleResolvers = require('./roles')
const paymentResolvers = require('./payment')
const jobListResolvers = require('./jobList')
const validatorResolvers = require('./validators')
const dropdownResolvers = require('./dropdowns')
const customPermissionsResolvers = require('./customPermissions')
const publicUploadsResolvers = require('./publicUploads')
const partnerResolvers = require('./partners')
const AuthProviderResolvers = require('./authProviders')
const versionResolvers = require('./versions')
const languagesResolvers = require('./langauges')
const papersizesResolvers = require('./paperSizes')
const auditLogsResolvers = require('./auditLogs')
const faxesResolvers = require('./faxes')
const ippSessionResolver = require('./ippSessions')
const accountSync = require('./accountSync')
const protonResolvers = require('./protons')
const accounts = require('./accounts')
const getBillingServices = require('./billingService')
const thirdPartySoftware = require('./thirdPartySoftware')
const emailResolvers = require('./emails')
const handwriteRecognition = require('./handwriteRecognition')
const restorePictures = require('./restorePictures')
const illiad = require('./illiad')
const smartPhoneResolvers = require('./smartphones')  
const FTP = require('./ftp')
const ThirdPartySupportedLanguages = require('./thirdPartySupportedLanguages')
const Abby = require('./abby')
const fax = require('./fax')
const networkResolvers = require('./networks')
const textTranslationResolver = require('./textTranslation')
const audio = require('./audio')
const { GraphQLScalarType, Kind } = require('graphql');
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Custom Date scalar type',
  serialize(value) {
    // Ensure the value is a Date instance
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Check if value is a valid date string
    const date = new Date(value);
    if (!isNaN(date)) {
      return date.toISOString();
    }
    return null;
  },
  parseValue(value) {
    // Parse incoming string to a Date
    const date = new Date(value);
    return !isNaN(date) ? date : null;
  },
  parseLiteral(ast) {
    // Parse literal AST value to a Date
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      return !isNaN(date) ? date : null;
    }
    return null;
  }
});

module.exports = {
  Date: DateScalar,
  Query: {
    ...UsageResolvers.Query,
    ...customerResolvers.Query,
    ...customizationResolvers.Query,
    ...locationResolvers.Query,
    ...areaResolvers.Query,
    ...groupResolvers.Query,
    ...deviceResolvers.Query,
    ...thingResolvers.Query,
    ...settingResolvers.Query,
    ...loggingResolvers.Query,
    ...userResolvers.Query,
    ...licenseResolvers.Query,
    ...customizationTextResolvers.Query,
    ...PermissioneResolvers.Query,
    ...ProfileResolvers.Query,
    ...roleResolvers.Query,
    ...paymentResolvers.Query,
    ...jobListResolvers.Query,
    ...validatorResolvers.Query,
    ...dropdownResolvers.Query,
    ...customPermissionsResolvers.Query,
    ...publicUploadsResolvers.Query,
    ...partnerResolvers.Query,
    ...AuthProviderResolvers.Query,
    ...languagesResolvers.Query,
    ...versionResolvers.Query,
    ...papersizesResolvers.Query,
    ...auditLogsResolvers.Query,
    ...faxesResolvers.Query,
    ...accountSync.Query,
    ...protonResolvers.Query,
    ...accounts.Query,
    ...getBillingServices.Query,
    ...thirdPartySoftware.Query,
    ...emailResolvers.Query,
    ...handwriteRecognition.Query,
    ...restorePictures.Query,
    ...illiad.Query,
    ...smartPhoneResolvers.Query,
    ...FTP.Query,
    ...ThirdPartySupportedLanguages.Query,
    ...Abby.Query,
    ...fax.Query,
    ...textTranslationResolver.Query,
    ...networkResolvers.Query,
    ...audio.Query
  },

  Mutation: {
    ...UsageResolvers.Mutation,
    ...customerResolvers.Mutation,
    ...customizationResolvers.Mutation,
    ...locationResolvers.Mutation,
    ...areaResolvers.Mutation,
    ...groupResolvers.Mutation,
    ...deviceResolvers.Mutation,
    ...thingResolvers.Mutation,
    ...settingResolvers.Mutation,
    ...loggingResolvers.Mutation,
    ...userResolvers.Mutation,
    ...bucketUploadResolvers.Mutation,
    ...licenseResolvers.Mutation,
    ...customizationTextResolvers.Mutation,
    ...PermissioneResolvers.Mutation,
    ...ProfileResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...jobListResolvers.Mutation,
    ...validatorResolvers.Mutation,
    ...publicUploadsResolvers.Mutation,
    ...partnerResolvers.Mutation,
    ...AuthProviderResolvers.Mutation,
    ...versionResolvers.Mutation,
    ...auditLogsResolvers.Mutation,
    ...ippSessionResolver.Mutation,
    ...faxesResolvers.Mutation,
    ...accountSync.Mutation,
    ...protonResolvers.Mutation,
    ...accounts.Mutation,
    ...emailResolvers.Mutation,
    ...handwriteRecognition.Mutation,
    ...restorePictures.Mutation,
    ...illiad.Mutation,
    ...smartPhoneResolvers.Mutation,
    ...FTP.Mutation,
    ...Abby.Mutation,
    ...fax.Mutation,
    ...textTranslationResolver.Mutation,
    ...networkResolvers.Mutation,
    ...audio.Mutation
  }
}
