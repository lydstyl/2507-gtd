export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, any>
  stack?: string
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel

  private constructor() {
    const env = process.env.NODE_ENV || 'development'
    this.logLevel = env === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatLog(level: string, message: string, context?: Record<string, any>, stack?: string): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(stack && { stack })
    }

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry)
    }

    // Human-readable format for development
    let output = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`
    if (context) {
      output += ` | Context: ${JSON.stringify(context)}`
    }
    if (stack) {
      output += `\n${stack}`
    }
    return output
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const stack = error?.stack
    const logMessage = this.formatLog('error', message, context, stack)
    console.error(logMessage)
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    const logMessage = this.formatLog('warn', message, context)
    console.warn(logMessage)
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    const logMessage = this.formatLog('info', message, context)
    console.info(logMessage)
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const logMessage = this.formatLog('debug', message, context)
    console.debug(logMessage)
  }

  http(method: string, path: string, statusCode: number, responseTime?: number): void {
    const context = {
      method,
      path,
      statusCode,
      ...(responseTime && { responseTime: `${responseTime}ms` })
    }

    this.info('HTTP Request', context)
  }
}

export const logger = Logger.getInstance()