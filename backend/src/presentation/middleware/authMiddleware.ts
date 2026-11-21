import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { getUserFromToken } from '../controllers/AuthController'
import { Container } from '../../infrastructure/container'

/**
 * Valide un token (API key gtd_ ou JWT) et fixe req.user.
 * Exposé pour les routes qui acceptent le token hors header
 * (ex. /api/images GET avec ?token=*** — balises <img>).
 */
export async function authenticateBearer(
  req: Request,
  res: Response,
  token: string
): Promise<void> {
  // API key path (starts with 'gtd_')
  if (token.startsWith('gtd_')) {
    const prefix = token.substring(0, 12)
    const repo = Container.getInstance().getApiKeyRepository()
    const candidates = await repo.findByPrefix(prefix)

    for (const candidate of candidates) {
      if (candidate.expiresAt && candidate.expiresAt < new Date()) continue
      const match = await bcrypt.compare(token, candidate.keyHash)
      if (match) {
        await repo.updateLastUsed(candidate.id)
        ;(req as any).user = { userId: candidate.userId }
        return
      }
    }

    res.status(401).json({ error: 'Invalid or expired API key' })
    return
  }

  // JWT path
  const user = getUserFromToken(token)
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  ;(req as any).user = user
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header with Bearer token is required' })
      return
    }

    const token = authHeader.substring(7)
    await authenticateBearer(req, res, token)
    if (!res.headersSent) next()
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}
