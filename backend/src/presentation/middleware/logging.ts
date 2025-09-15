import { Request, Response, NextFunction } from 'express'
import { logger } from '../../shared/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    logger.http(req.method, req.path, res.statusCode, responseTime)
  })

  next()
}