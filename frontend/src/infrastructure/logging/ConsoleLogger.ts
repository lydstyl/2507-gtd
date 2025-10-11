import { ILogger, LogLevel, LogEntry } from '@gtd/shared'

/**
 * Console-based logger implementation (Infrastructure layer)
 * Logs to browser console with styled output
 */
export class ConsoleLogger implements ILogger {
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const category = entry.category ? `[${entry.category}]` : ''
    return `[${timestamp}] ${entry.level} ${category} ${entry.message}`
  }

  private getLogStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: gray'
      case LogLevel.INFO:
        return 'color: blue'
      case LogLevel.WARN:
        return 'color: orange'
      case LogLevel.ERROR:
        return 'color: red; font-weight: bold'
      default:
        return ''
    }
  }

  debug(message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      data,
      category
    }
    console.log(`%c${this.formatLogEntry(entry)}`, this.getLogStyle(LogLevel.DEBUG), data || '')
  }

  info(message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      data,
      category
    }
    console.log(`%c${this.formatLogEntry(entry)}`, this.getLogStyle(LogLevel.INFO), data || '')
  }

  warn(message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      data,
      category
    }
    console.warn(`%c${this.formatLogEntry(entry)}`, this.getLogStyle(LogLevel.WARN), data || '')
  }

  error(message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      data,
      category
    }
    console.error(`%c${this.formatLogEntry(entry)}`, this.getLogStyle(LogLevel.ERROR), data || '')
  }
}
