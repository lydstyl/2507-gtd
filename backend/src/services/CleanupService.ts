export class CleanupService {
  /**
   * Cutoff for stage 1: notes of completed tasks older than 1 year are cleared
   * (the task itself is kept, only its note is removed to reduce DB size).
   */
  static getNoteCleanupCutoffDate(): Date {
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    return oneYearAgo
  }

  /**
   * Cutoff for stage 2: completed tasks older than 3 years are deleted
   * entirely (task, note, subtasks, tags).
   */
  static getTaskCleanupCutoffDate(): Date {
    const now = new Date()
    const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)
    return threeYearsAgo
  }

  /**
   * Log cleanup operation results
   */
  static logCleanupResult(
    notesClearedCount: number,
    deletedCount: number,
    noteCutoffDate: Date,
    deleteCutoffDate: Date
  ): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🧹 Cleanup completed:`)
    console.log(`   - Cleared notes of ${notesClearedCount} completed tasks (older than 1 year)`)
    console.log(`   - Deleted ${deletedCount} completed tasks (older than 3 years)`)
    console.log(`   - Note cutoff date: ${noteCutoffDate.toISOString()}`)
    console.log(`   - Delete cutoff date: ${deleteCutoffDate.toISOString()}`)
  }

  /**
   * Log cleanup errors
   */
  static logCleanupError(error: Error): void {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ❌ Cleanup failed:`, error.message)
    console.error('Stack trace:', error.stack)
  }

  /**
   * Log cleanup start
   */
  static logCleanupStart(): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🧹 Starting scheduled cleanup of old completed tasks...`)
  }
}
