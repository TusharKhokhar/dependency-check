const { CustomizationTexts } = require("./collections");
const { getObjectId: ObjectId, aliasEmailsGroup } = require("../utils");
const { urlDomain, bucketName } = require("../config");

const customizationTextByCustomerId = async (db, customerId) => {
  const projection = {
    AdvancedEmailConfiguration: 1,
    SelectFileSection: 1,
    MainSection: 1,
    _id: 0,
  };

  const customerCustomizationTextData = await db
    .collection(CustomizationTexts)
    .findOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { projection });

  const topSection = customerCustomizationTextData?.MainSection?.TopSection;
  if (topSection?.CustomerLogo) {
    const logoPath = topSection.CustomerLogo.split("Logos")[1] || "";
    topSection.CustomerLogo = `https://api.${urlDomain}/logo/${bucketName}?image=${Buffer.from(logoPath).toString("base64")}`;
  }

  const emailConfig = customerCustomizationTextData?.AdvancedEmailConfiguration;
  if (emailConfig?.AdvancedEmailAlias?.length > 0) {
    emailConfig.UnGroupedAdvancedEmailAlias = [
      ...emailConfig.AdvancedEmailAlias,
    ];
    emailConfig.AdvancedEmailAlias = aliasEmailsGroup(
      emailConfig.AdvancedEmailAlias
    );
  }

  return customerCustomizationTextData;
};

module.exports = { customizationTextByCustomerId };
