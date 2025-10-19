import winston from 'winston'
import path from 'path'

// Create logs directory path
const logsDir = path.join(__dirname, '../../../logs')

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`
    }

    // Add stack trace if present
    if (stack) {
      msg += `\n${stack}`
    }

    return msg
  })
)

// Create Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // File transport for chat-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'chat.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
})

// Create a specialized chat logger
export const chatLogger = {
  info: (message: string, metadata?: any) => {
    logger.info(`[CHAT] ${message}`, metadata)
  },
  error: (message: string, error?: any, metadata?: any) => {
    logger.error(`[CHAT] ${message}`, { error, ...metadata })
  },
  debug: (message: string, metadata?: any) => {
    logger.debug(`[CHAT] ${message}`, metadata)
  },
  warn: (message: string, metadata?: any) => {
    logger.warn(`[CHAT] ${message}`, metadata)
  }
}

// Log startup
logger.info('Logger initialized', {
  logsDir,
  level: process.env.LOG_LEVEL || 'debug'
})
