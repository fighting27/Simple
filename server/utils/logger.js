const dayjs = require('dayjs');

function log(level, message, data = null) {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (level === 'error') {
    console.error(logMessage, data ? JSON.stringify(data) : '');
  } else {
    console.log(logMessage, data ? JSON.stringify(data) : '');
  }
}

module.exports = {
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
};
