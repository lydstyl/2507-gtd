import app from './app'
import * as cron from 'node-cron'
import { Container } from './infrastructure/container'
import { CleanupOldCompletedTasksUseCase } from './usecases/cleanup/CleanupOldCompletedTasksUseCase'

// Validation des variables d'environnement requises
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes :', missingVars.join(', '));
  console.error('📝 Copiez .env.example vers .env et configurez les valeurs');
  console.error('💡 Exemple : cp .env.example .env');
  process.exit(1);
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📖 API Documentation available at http://localhost:${PORT}`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)

  // Setup scheduled cleanup job - runs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    const container = Container.getInstance()
    const taskRepository = container.getTaskRepository()
    const cleanupUseCase = new CleanupOldCompletedTasksUseCase(taskRepository)

    try {
      await cleanupUseCase.execute()
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error)
    }
  }, {
    timezone: 'UTC' // Use UTC to avoid timezone issues
  })

  console.log('🧹 Scheduled cleanup job configured (daily at 2 AM UTC)')
})
