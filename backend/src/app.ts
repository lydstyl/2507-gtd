import express from 'express'
import cors from 'cors'
import path from 'path'
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

// Routes API
app.use('/api/tasks', createTaskRoutes(container.getTaskController()))
app.use('/api/tags', createTagRoutes(container.getTagController()))
app.use('/api/auth', authRoutes)

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Route API racine
app.get('/api', (req, res) => {
  res.json({
    message: 'Todo List API',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      tags: '/api/tags',
      auth: '/api/auth',
      health: '/health'
    }
  })
})

// Servir les fichiers statiques du frontend buildé
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// Middleware pour servir index.html pour toutes les routes frontend (SPA)
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Ne pas intercepter les routes API
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next()
    }

    // Servir le fichier index.html du frontend
    res.sendFile(path.join(frontendPath, 'index.html'))
  }
)

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

export default app
