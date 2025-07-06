import { Router } from 'express'
import { TagController } from '../controllers/TagController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createTagRoutes(tagController: TagController): Router {
  const router = Router()

  router.use(authMiddleware)

  // GET /api/tags - Get all tags
  router.get('/', tagController.getAllTags.bind(tagController))

  // POST /api/tags - Create a new tag
  router.post('/', tagController.createTag.bind(tagController))

  // PUT /api/tags/:id - Update a specific tag
  router.put('/:id', tagController.updateTag.bind(tagController))

  // DELETE /api/tags/:id - Delete a specific tag
  router.delete('/:id', tagController.deleteTag.bind(tagController))

  return router
}
