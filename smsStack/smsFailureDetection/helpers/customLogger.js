class CustomLogger {
  constructor() {
    this.environment = process.env.environment || 'development';
  }

  info(message, data = {}) {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      data
    }));
  }

  error(message, error = {}) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      error: error.message || error,
      stack: error.stack
    }));
  }

  warn(message, data = {}) {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      data
    }));
  }
}

module.exports = CustomLogger;
