import express from 'express'
import taskRoutes from './routes/taskRoutes'
import tagRoutes from './routes/tagRoutes'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware pour parser le JSON
app.use(express.json())

// Middleware pour les logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/tasks', taskRoutes)
app.use('/api/tags', tagRoutes)

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
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default app
