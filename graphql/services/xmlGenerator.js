module.exports.buildIdPMetadata = async (db) => {
  const metadata = await db
    .collection("SystemConfigs")
    .findOne({ ConfigType: "SAMLMetaData", IsActive: true });
  return metadata.ConfigValue;
};
