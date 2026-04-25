const winston = require('winston');

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Custom format for console (human-readable)
const consoleFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]${requestId ? ` (Req: ${requestId})` : ''}: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json() // Default to JSON for production compatibility
  ),
  transports: [
    new winston.transports.Console({
      // Use colorized human-readable format for development/console
      format: combine(
        colorize({ all: true }),
        align(),
        consoleFormat
      ),
    }),
    // Optionally add file transports
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

module.exports = logger;
