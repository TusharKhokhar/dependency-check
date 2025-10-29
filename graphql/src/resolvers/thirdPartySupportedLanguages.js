const { getDb } = require("../../config/dbHandler");
const { GraphQLError } = require("graphql");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger();

module.exports = {
  Query: {
    async getThirdPartySupportedLanguages(
      _,
      { thirdPartySupportedLanguagesInput },
      context
    ) {
      log.lambdaSetup(
        context,
        "thirdPartySupportedLanguages",
        "getThirdPartySupportedLanguages"
      );
      try {
        const { ThirdPartySoftwareType } = thirdPartySupportedLanguagesInput;
        const db = await getDb();
        const collection = db.collection("ThirdPartySupportedLanguages");

        const languagesList = await collection.findOne({});

        if (!languagesList)
          throw new GraphQLError("No Third-Party Supported Languages found");

        const languages = languagesList[ThirdPartySoftwareType] || [];

        const result = {
          _id: languagesList._id,
          ThirdPartySoftwareType,
          AbbyIntegration: null,
          TextTranslationIntegration: null,
          AudioIntegration: null,
        };

        result[ThirdPartySoftwareType] = languages;
        return result;
      } catch (error) {
        log.error("getThirdPartySupportedLanguages error ***", error);
        throw new GraphQLError(
          error?.message || "Failed to fetch Third-Party Supported Languages"
        );
      }
    },
  },
};
