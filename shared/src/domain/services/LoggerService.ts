/**
 * Logger service interface (domain contract)
 * Platform-agnostic logging interface for the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  data?: any
  category?: string
}

export interface ILogger {
  debug(message: string, data?: any, category?: string): void
  info(message: string, data?: any, category?: string): void
  warn(message: string, data?: any, category?: string): void
  error(message: string, data?: any, category?: string): void
}

/**
 * Domain service for logging
 * Provides a consistent logging interface across the application
 */
export class LoggerService {
  private logger: ILogger

  constructor(logger: ILogger) {
    this.logger = logger
  }

  debug(message: string, data?: any, category?: string): void {
    this.logger.debug(message, data, category)
  }

  info(message: string, data?: any, category?: string): void {
    this.logger.info(message, data, category)
  }

  warn(message: string, data?: any, category?: string): void {
    this.logger.warn(message, data, category)
  }

  error(message: string, data?: any, category?: string): void {
    this.logger.error(message, data, category)
  }

  /**
   * Log subtask drag and drop operation
   */
  logSubtaskReorder(data: {
    taskId: string
    taskName: string
    oldIndex: number
    newIndex: number
    oldPosition: number
    newPosition: number
    subtasks: Array<{ id: string; name: string; position: number }>
  }): void {
    this.info('Subtask reorder', data, 'DRAG_DROP')
  }
}
