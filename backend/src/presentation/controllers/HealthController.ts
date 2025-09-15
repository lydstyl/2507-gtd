import { Request, Response } from 'express'
import { HealthService } from '../../application/services/HealthService'
import { ResponseBuilder } from '../dto'

export class HealthController {
  constructor(private healthService: HealthService) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealth()

      // Set appropriate HTTP status based on health
      let statusCode = 200
      if (health.status === 'unhealthy') {
        statusCode = 503 // Service Unavailable
      } else if (health.status === 'degraded') {
        statusCode = 200 // OK but with warnings
      }

      res.status(statusCode).json(ResponseBuilder.success(health, undefined, statusCode))
    } catch (error) {
      // Health check should never throw, but handle it gracefully
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      })
    }
  }

  async getHealthSimple(req: Request, res: Response): Promise<void> {
    // Simple health check without detailed diagnostics
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  }
}