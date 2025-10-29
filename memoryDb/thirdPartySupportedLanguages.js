const { getDb } = require("../publicAuth/config/db");
const collectionName = "ThirdPartySupportedLanguages";

module.exports = {
  addThirdPartySupportedLanguages: async () => {
    const db = await getDb();
    const thirdPartySupportedLanguagesData = {
      AbbyIntegration: {
        abby: [
          { Language: "Afrikaans", Code: "af" },
          { Language: "Arabic", Code: "ar" },
          { Language: "Bulgarian", Code: "bg" },
          { Language: "Catalan", Code: "ca" },
          { Language: "Chinese Simplified", Code: "zh-CN" },
          { Language: "Chinese Traditional", Code: "zh-TW" },
          { Language: "Croatian", Code: "hr" },
        ],
      },
    };
    const data = await db
      .collection(collectionName)
      .insertOne(thirdPartySupportedLanguagesData);
    return {
      insertedId: data.insertedId,
      ops: thirdPartySupportedLanguagesData,
    };
  },
};
