import { Request, Response, NextFunction } from 'express'
import { getUserFromToken } from '../controllers/AuthController'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }
  const token = authHeader.split(' ')[1]
  const user = getUserFromToken(token)
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
  // @ts-ignore
  req.user = user
  next()
}
