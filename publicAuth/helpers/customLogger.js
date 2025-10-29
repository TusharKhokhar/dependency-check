const {sanitize} = require('./log.helpers');
const logger = require('./logger')

class CustomLogger {
    constructor() {
        this.logger = logger;
    }

    info(message, logMessage) {
        const sanitizeLogMessage = logMessage ? this.sanitize(logMessage) : logMessage
        const sanitizeMessage = this.sanitize(message)
        if (sanitizeLogMessage){
            return this.logger.info(sanitizeMessage, sanitizeLogMessage);
        } else {
            return this.logger.info(sanitizeMessage);
        }
    }

    error(message, error) {
        if (error?.stack) {
            this.logger.error(message, error, error?.stack);
        } else {
            this.logger.error(message, error);
        }
    }

    getCorrelationId() {
        return this.logger.getCorrelationId()
    }

    warn(message) {
        this.logger.warn(message);
    }

    lambdaSetup(message, component, method) {
        this.logger.setLevel('info')
        this.logger.lambdaSetup(message, component, method);
    }

    sanitize(obj) {
        return sanitize(obj)
    }
}

module.exports = CustomLogger;