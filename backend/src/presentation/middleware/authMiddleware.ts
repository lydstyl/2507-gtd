import { Request, Response, NextFunction } from 'express'
import { getUserFromToken } from '../controllers/AuthController'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Temporairement désactivé pour le développement
  // TODO: Réactiver l'authentification une fois le système d'auth implémenté
  
  // @ts-ignore
  req.user = { userId: 'user-id', email: 'user@example.com' }
  next()
}
