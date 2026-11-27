import { Router } from 'express'
import { MaintenanceController } from '../controllers/MaintenanceController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createMaintenanceRoutes(maintenanceController: MaintenanceController): Router {
  const router = Router()

  router.use(authMiddleware)

  // POST /api/maintenance/cleanup - Déclenche le nettoyage maintenant
  router.post('/cleanup', maintenanceController.runCleanup.bind(maintenanceController))

  return router
}
