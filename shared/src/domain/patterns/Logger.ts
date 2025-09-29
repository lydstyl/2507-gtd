/**
 * Shared logging interface for consistent logging across frontend and backend
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  /**
   * Additional context data
   */
  [key: string]: any
}

export interface LogEntry {
  /**
   * Log level
   */
  level: LogLevel
  /**
   * Log message
   */
  message: string
  /**
   * Timestamp
   */
  timestamp: Date
  /**
   * Context data
   */
  context?: LogContext
  /**
   * Error object (if applicable)
   */
  error?: Error
}

/**
 * Logger interface that can be implemented by different logging backends
 */
export interface ILogger {
  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILogger
}

/**
 * No-op logger for testing or when logging is disabled
 */
export class NoOpLogger implements ILogger {
  debug(message: string, context?: LogContext): void {}
  info(message: string, context?: LogContext): void {}
  warn(message: string, context?: LogContext): void {}
  error(message: string, error?: Error, context?: LogContext): void {}
  child(context: LogContext): ILogger {
    return this
  }
}

/**
 * Console logger for simple logging
 */
export class ConsoleLogger implements ILogger {
  constructor(private context: LogContext = {}) {}

  private formatMessage(level: LogLevel, message: string, additionalContext?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = JSON.stringify({ ...this.context, ...additionalContext })
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr !== '{}' ? contextStr : ''}`
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { error: error.message, stack: error.stack, ...context } : context
    console.error(this.formatMessage('error', message, errorContext))
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger({ ...this.context, ...context })
  }
}

/**
 * Logger factory
 */
export class LoggerFactory {
  private static defaultLogger: ILogger = new ConsoleLogger()

  static setDefaultLogger(logger: ILogger): void {
    this.defaultLogger = logger
  }

  static getLogger(context?: LogContext): ILogger {
    if (context) {
      return this.defaultLogger.child(context)
    }
    return this.defaultLogger
  }

  static createConsoleLogger(context?: LogContext): ILogger {
    return new ConsoleLogger(context)
  }

  static createNoOpLogger(): ILogger {
    return new NoOpLogger()
  }
}