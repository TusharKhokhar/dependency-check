const log = require('loglevel');
const base64url = require('base64url');
const { v4: uuidv4 } = require('uuid');

module.exports = (function logWrapper() {
    let _correlationId;
    let _clientId;
    let _userId;
    let _microservice;
    let _methodName;
    let _otherVars;
    let _logWithTimestamp = true;
    // eslint-disable-next-line max-len
    let _env = 'prod';
    const UNKNOWN = 'UNKNOWN';

    const newMethods = {
        getCorrelationId() {
            return _correlationId;
        },
        setCorrelationId(correlationId) {
            _correlationId = correlationId;
        },
        setEnv(env) {
            _env = env;
        },
        setClientId(clientId) {
            _clientId = clientId;
        },
        setUserId(userId) {
            _userId = userId;
        },
        setMicroservice(microservice) {
            _microservice = microservice;
        },
        setMethodName(methodName) {
            _methodName = methodName;
        },
        setOtherVars(otherVars) {
            _otherVars = otherVars;
        },
        setLogWithTimestamp(boolVal) {
            _logWithTimestamp = boolVal;
        },
        getCorrelationIdFromHeaders(event) {
            return uuidv4();
        },
        // eslint-disable-next-line max-len
        logSetup(correlationId, clientId, userId, microservice, methodName, otherVars, logWithTimestamp) {
            _correlationId = correlationId || _correlationId;
            _clientId = clientId || _clientId;
            _userId = userId || _userId;
            _microservice = microservice || _microservice;
            _methodName = methodName || _methodName;
            _otherVars = otherVars || _otherVars;
            if (typeof logWithTimestamp !== 'undefined') {
                _logWithTimestamp = logWithTimestamp;
            }
        },
        lambdaSetup(event, microservice, methodName, otherVars, logWithTimestamp) {
            const warnStack = [];

            if (microservice) {
                _microservice = microservice;
            } else {
                warnStack.push('microservice not specified.');
            }

            if (methodName) {
                _methodName = methodName;
            } else {
                warnStack.push('methodName not specified.');
            }

            try {
                _correlationId = uuidv4();
            } catch (e) {
                warnStack.push(`Auth not found: ${e.message}.`);
            }
            if (event.headers.Authorization || event.headers.authorization) {
                try {
                    let token = event.headers.Authorization || event.headers.authorization;
                    let [,tokenPayload] = token.split('.');
                    tokenPayload = JSON.parse(base64url.decode(tokenPayload));
                    _clientId = tokenPayload?.CustomerID;
                    if (tokenPayload?._id) {
                        _userId = tokenPayload?._id;
                    }
                } catch (e) {
                    console.log(e);
                    warnStack.push(`Auth not found: ${e.message}.`);
                }
            }
            _otherVars = otherVars;

            if (typeof logWithTimestamp !== 'undefined') {
                _logWithTimestamp = logWithTimestamp;
            }

            if (warnStack.length) {
                log.warn(...warnStack);
            }
        }
    };

    const originalFactory = log.methodFactory;
    log.methodFactory = function newMethodFactory(logMethodName, logLevel, loggerName) {
        const rawMethod = originalFactory(logMethodName, logLevel, loggerName);

        return function toLog(...args) {
            const messages = [];
            for (let i = 0; i < args.length; i += 1) {
                let message;
                switch (typeof args[i]) {
                    case 'object':
                        message = JSON.stringify(args[i]);
                        if (message === '{}') {
                            message = args[i].toString();
                        }
                        messages.push(message);
                        break;
                    case 'undefined':
                        messages.push('UNDEFINED');
                        break;
                    default:
                        messages.push(args[i].toString());
                }
            }

            const formattedMessages = Object.assign({
                correlationId: _correlationId || UNKNOWN,
                env: _env,
                clientId: _clientId || UNKNOWN,
                userId: _userId || UNKNOWN,
                microservice: _microservice || UNKNOWN,
                methodName: _methodName || UNKNOWN,
                logLevel: logMethodName,
                message: messages.join(' ')
            }, _otherVars);

            if (_logWithTimestamp) {
                formattedMessages.timestamp = new Date().toISOString();
            }

            rawMethod.apply(undefined, [JSON.stringify(formattedMessages)]);
        };
    };
    log.setLevel(log.getLevel());
    return Object.assign(log, newMethods);
}());