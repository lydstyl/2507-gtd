import app from './app-new'
import { config } from './config'
import { logger } from './shared/logger'

const PORT = config.env.PORT

const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: config.env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid
  })

  if (config.isDevelopment) {
    logger.info('Development endpoints available', {
      api: `http://localhost:${PORT}/api`,
      health: `http://localhost:${PORT}/health`,
      healthDetailed: `http://localhost:${PORT}/health/detailed`
    })
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  })

  // Close server gracefully
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  })

  // Close server gracefully
  server.close(() => {
    process.exit(1)
  })
})

export default server