export class CleanupService {
  /**
   * Calculate the cutoff date for cleanup (8 weeks ago)
   */
  static getCleanupCutoffDate(): Date {
    const now = new Date()
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)
    return eightWeeksAgo
  }

  /**
   * Log cleanup operation results
   */
  static logCleanupResult(deletedCount: number, cutoffDate: Date): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🧹 Cleanup completed:`)
    console.log(`   - Deleted ${deletedCount} completed tasks`)
    console.log(`   - Cutoff date: ${cutoffDate.toISOString()}`)
    console.log(`   - Tasks older than 8 weeks were removed`)
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