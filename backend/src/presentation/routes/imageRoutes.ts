import { Router } from 'express'
import { authenticateBearer } from '../middleware/authMiddleware'
import {
  imageUpload,
  uploadImages,
  getImage
} from '../controllers/ImageController'

/**
 * /api/images
 *  - POST /        upload multipart (champ "files", 1..10 images, 20 Mo max)
 *  - GET  /:name   sert l'image
 *
 * Auth : Bearer header (fetch) OU ?token=*** (<img> dans les notes —
 * impossible d'envoyer un header depuis une balise img).
 */
export function createImageRoutes(): Router {
  const router = Router()

  router.use(async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      const headerToken =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : null
      const queryToken = req.query.token ? String(req.query.token) : null
      const token = headerToken ?? queryToken
      console.log('DEBUG imageAuth: headerToken=', headerToken ? headerToken.slice(0, 10) : null, 'queryToken=', queryToken ? JSON.stringify(queryToken.slice(0, 12)) + ' len=' + queryToken.length : null)
      if (!token) {
        res.status(401).json({ error: 'Authorization header with Bearer token is required' })
        return
      }

      await authenticateBearer(req, res, token)
      if (!res.headersSent) next()
    } catch (error) {
      console.error('Erreur auth /api/images:', error)
      res.status(401).json({ error: 'Authentication failed' })
    }
  })

  // On enveloppe multer pour transformer ses erreurs (fileFilter, taille)
  // en réponses 400/413 propres au lieu du 500 générique.
  router.post('/', (req, res, next) => {
    imageUpload.array('files', 10)(req, res, (err?: unknown) => {
      if (err) {
        const code = (err as { code?: string }).code === 'LIMIT_FILE_SIZE' ? 413 : 400
        const message =
          code === 413
            ? 'Fichier trop volumineux (100 Mo maximum)'
            : (err as Error).message || 'Envoi de fichier refusé'
        res.status(code).json({ error: message })
        return
      }
      next()
    })
  }, uploadImages)
  router.get('/:filename', getImage)

  return router
}
