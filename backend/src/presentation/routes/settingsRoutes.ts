import { Router } from 'express'
import { SettingController } from '../controllers/SettingController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createSettingsRoutes(settingController: SettingController): Router {
  const router = Router()

  router.use(authMiddleware)

  // GET /api/settings - Renvoie tous les réglages (défauts inclus)
  router.get('/', settingController.getSettings.bind(settingController))

  // PUT /api/settings - Met à jour un ou plusieurs réglages (clé/valeur)
  router.put('/', settingController.updateSettings.bind(settingController))

  return router
}
