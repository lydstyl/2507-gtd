import { PrismaClient } from '@prisma/client'
import { config } from '../../config'
import { logger } from '../../shared/logger'

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheckResult
    memory: HealthCheckResult
    disk?: HealthCheckResult
  }
}

export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  details?: Record<string, any>
  error?: string
}

export class HealthService {
  constructor(private prisma: PrismaClient) {}

  async getHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    logger.debug('Starting health check')

    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory()
    }

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail')
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn')

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (hasFailures) {
      overallStatus = 'unhealthy'
    } else if (hasWarnings) {
      overallStatus = 'degraded'
    }

    const health: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env.NODE_ENV,
      checks
    }

    const totalTime = Date.now() - startTime
    logger.debug('Health check completed', {
      status: overallStatus,
      totalTime: `${totalTime}ms`,
      checks: Object.fromEntries(
        Object.entries(checks).map(([key, value]) => [key, value.status])
      )
    })

    return health
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Try a simple query to test connectivity
      await this.prisma.$queryRaw`SELECT 1`

      const responseTime = Date.now() - startTime

      // Check response time thresholds
      let status: 'pass' | 'warn' = 'pass'
      if (responseTime > 1000) {
        status = 'warn' // Slow database response
      }

      return {
        status,
        responseTime,
        details: {
          connected: true,
          provider: 'sqlite' // Could be made dynamic based on config
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        details: {
          connected: false
        }
      }
    }
  }

  private checkMemory(): HealthCheckResult {
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal
    const usedMemory = memoryUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100

    // Define thresholds
    let status: 'pass' | 'warn' | 'fail' = 'pass'
    if (memoryPercentage > 90) {
      status = 'fail'
    } else if (memoryPercentage > 80) {
      status = 'warn'
    }

    return {
      status,
      details: {
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        external: this.formatBytes(memoryUsage.external),
        rss: this.formatBytes(memoryUsage.rss),
        usagePercentage: Math.round(memoryPercentage * 100) / 100
      }
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'

    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}