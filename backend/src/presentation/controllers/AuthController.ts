import { Request, Response } from 'express'
import { AuthService } from '../../services/authService'
import jwt from 'jsonwebtoken'
import { config } from '../../config'

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }
      const user = await this.authService.register(email, password)
      res.status(201).json({ id: user.id, email: user.email })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }
      const { user, token } = await this.authService.login(email, password)
      res.status(200).json({ token, user: { id: user.id, email: user.email } })
    } catch (err: any) {
      res.status(401).json({ error: err.message })
    }
  }
}

// Utilitaire pour extraire l'utilisateur du JWT
export function getUserFromToken(
  token: string
): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, config.env.JWT_SECRET) as { userId: string; email: string }
  } catch {
    return null
  }
}
