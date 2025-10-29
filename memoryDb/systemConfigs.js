const {getDb, getTestSecretsDb} = require('../publicAuth/config/db')
const collectionName = 'SystemConfigs'

module.exports = {
  addSAMLMetaData: async () => {
    const db = await getDb();
    const testDb = await getTestSecretsDb();
    const configData = await testDb
      .collection("SystemConfigs")
      .findOne({ ConfigType: "SAMLMetaData", IsActive: true });
    const samlMetaData = {
      ConfigType: "SAMLMetaData",
      ConfigValue: configData.ConfigValue,
      IsActive: true,
    };
    const response = await db
      .collection(collectionName)
      .insertOne(samlMetaData);
    return { insertedId: response.insertedId };
  },
  getAttributeByString: (string, value) => {
    const length = value.length;
    const start = string.indexOf(`${value}`) + length;
    const end = string.indexOf('"', start);
    const lastvalue = string.substring(start, end);

    return lastvalue;
  },
  getAttributeByTag: (string, startTag, endTag) => {
    const startValue= startTag;
    const endValue = endTag;
    const formatStart =string.indexOf(startValue) + startValue.length;
    const formatEnd = string.indexOf(endValue);
    const finalFormat = string.substring(
        formatStart,
        formatEnd
    );

    return finalFormat;
  },
};