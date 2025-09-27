import express, { Application } from 'express'
import cors from 'cors'
import path from 'path'

// Configuration and shared utilities
import { config } from './config'
import { logger } from './shared/logger'

// Infrastructure
import { Container } from './infrastructure/container-new'

// Middleware
import { errorHandler } from './presentation/middleware/errorHandler'
import { requestLogger } from './presentation/middleware/logging'

// Routes
import { createTaskRoutes } from './presentation/routes/taskRoutes'
import { createTagRoutes } from './presentation/routes/tagRoutes'
import authRoutes from './presentation/routes/authRoutes'

const app: Application = express()

// Middleware setup
app.use(cors({
  origin: config.env.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger)

// Dependency injection container
const container = Container.getInstance()

// API routes
app.use('/api/tasks', createTaskRoutes(container.getTaskController()))
app.use('/api/tags', createTagRoutes(container.getTagController()))
app.use('/api/auth', authRoutes)

// Enhanced health endpoints
app.get('/health', async (req, res) => {
  await container.getHealthController().getHealthSimple(req, res)
})

app.get('/health/detailed', async (req, res) => {
  await container.getHealthController().getHealth(req, res)
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GTD Task Management API',
    version: '2.0.0',
    environment: config.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      tasks: '/api/tasks',
      tags: '/api/tags',
      auth: '/api/auth',
      health: '/health',
      healthDetailed: '/health/detailed'
    }
  })
})

// Serve static files from frontend build
if (config.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))

  // SPA fallback - serve index.html for non-API routes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return next()
    }
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

// Error handling middleware (should be last)
app.use(errorHandler)

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await container.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await container.disconnect()
  process.exit(0)
})

export default app