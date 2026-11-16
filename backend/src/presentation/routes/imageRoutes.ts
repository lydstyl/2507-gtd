import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import {
  imageUpload,
  uploadImages,
  getImage
} from '../controllers/ImageController'

/**
 * /api/images
 *  - POST /        upload multipart (champ "files", 1..10 images, 20 Mo max)
 *  - GET  /:name   sert l'image (auth header OU ?token=***
 */
export function createImageRoutes(): Router {
  const router = Router()

  // Auth : accepte aussi le token en query string (balises <img> dans les notes)
  router.use((req, res, next) => {
    if (!req.headers.authorization && req.query.token) {
      req.headers.authorization = `Bearer ${String(req.query.token)}`
    }
    authMiddleware(req, res, next)
  })

  router.post('/', imageUpload.array('files', 10), uploadImages)
  router.get('/:filename', getImage)

  return router
}
