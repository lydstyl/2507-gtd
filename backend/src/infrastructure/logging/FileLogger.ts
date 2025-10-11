import { ILogger, LogLevel, LogEntry } from '@gtd/shared'
import * as fs from 'fs'
import * as path from 'path'

/**
 * File-based logger implementation (Infrastructure layer)
 * Logs to daily files and automatically cleans up old logs
 */
export class FileLogger implements ILogger {
  private logsDir: string

  constructor(logsDir: string = path.join(process.cwd(), 'logs')) {
    this.logsDir = logsDir
    this.ensureLogsDirExists()
    this.cleanupOldLogs()
  }

  private ensureLogsDirExists(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true })
    }
  }

  private getLogFileName(): string {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return path.join(this.logsDir, `${today}.log`)
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const category = entry.category ? `[${entry.category}]` : ''
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    return `[${timestamp}] ${entry.level} ${category} ${entry.message}${dataStr}\n`
  }

  private writeLog(entry: LogEntry): void {
    const logFile = this.getLogFileName()
    const logLine = this.formatLogEntry(entry)

    try {
      fs.appendFileSync(logFile, logLine, 'utf-8')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  debug(message: string, data?: any, category?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      data,
      category
    })
  }

  info(message: string, data?: any, category?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      data,
      category
    })
  }

  warn(message: string, data?: any, category?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      data,
      category
    })
  }

  error(message: string, data?: any, category?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      data,
      category
    })
  }

  /**
   * Clean up log files older than 7 days
   */
  cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logsDir)
      const now = Date.now()
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

      files.forEach(file => {
        if (!file.endsWith('.log')) return

        const filePath = path.join(this.logsDir, file)
        const stats = fs.statSync(filePath)
        const fileAge = now - stats.mtimeMs

        if (fileAge > sevenDaysInMs) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old log file: ${file}`)
        }
      })
    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
    }
  }
}
