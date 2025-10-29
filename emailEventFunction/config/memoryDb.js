const setDbString = async () => {
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");

    const mongo = await MongoMemoryServer.create({
      instance: {
        port: 4533, // Specify the fixed port you want to use
      },
    });
    return mongo.getUri();
  } catch (e) {
    return "mongodb://127.0.0.1:4533/";
  }
};

module.exports = { setDbString };
