import express from 'express'
import cors from 'cors'
import { Container } from './infrastructure/container'
import { createTaskRoutes } from './presentation/routes/taskRoutes'
import { createTagRoutes } from './presentation/routes/tagRoutes'
import authRoutes from './presentation/routes/authRoutes'

const app = express()
const PORT = process.env.PORT || 3000

// Configuration CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// Middleware pour parser le JSON
app.use(express.json())

// Middleware pour les logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Dependency injection container
const container = Container.getInstance()

// Routes
app.use('/api/tasks', createTaskRoutes(container.getTaskController()))
app.use('/api/tags', createTagRoutes(container.getTagController()))
app.use('/api/auth', authRoutes)

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'Todo List API',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      tags: '/api/tags',
      health: '/health'
    }
  })
})

// Middleware de gestion d'erreurs
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Something went wrong!' })
  }
)

// Middleware pour les routes non trouvées
//app.use('*', (req, res) => {
//  res.status(404).json({ error: 'Route not found' })
//}) // this make error /home/gbp2204/apps/2507-gtd/node_modules/path-to-regexp/src/index.ts:153
// throw new TypeError(`Missing parameter name at ${i}: ${DEBUG_URL}`);
//  ^
//TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError

export default app
