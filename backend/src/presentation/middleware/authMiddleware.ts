import { Request, Response, NextFunction } from 'express'
import { getUserFromToken } from '../controllers/AuthController'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header with Bearer token is required' })
      return
    }

    const token = authHeader.substring(7) // Enlever "Bearer "
    
    // Vérifier et décoder le token
    const user = getUserFromToken(token)
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Ajouter l'utilisateur à la requête
    ;(req as any).user = user
    next()
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}
