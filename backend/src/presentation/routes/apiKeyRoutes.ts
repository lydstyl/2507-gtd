import { Router } from 'express'
import { ApiKeyController } from '../controllers/ApiKeyController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createApiKeyRouter(controller: ApiKeyController): Router {
  const router = Router()

  router.use(authMiddleware)
  router.get('/', (req, res) => controller.list(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.post('/:id/regenerate', (req, res) => controller.regenerate(req, res))
  router.delete('/:id', (req, res) => controller.revoke(req, res))

  return router
}
