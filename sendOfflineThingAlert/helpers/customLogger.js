const logger = require('./logger')

class CustomLogger {
    constructor() {
        this.logger = logger;
    }

    error(message, error) {
        this.logger.error(message, error);
    }
}

module.exports = CustomLogger;