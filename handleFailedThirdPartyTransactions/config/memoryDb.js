

const setDbString = async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    try {
        const mongo = await MongoMemoryServer.create({
            instance: {
                port: 4533 // Specify the fixed port you want to use
            }
        });
        return mongo.getUri();
    } catch (e) {
        console.log('returned already connected server');
        return 'mongodb://127.0.0.1:4533/'
    }
}

module.exports = {setDbString}
