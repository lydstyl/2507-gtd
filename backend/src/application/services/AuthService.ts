import bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { UserRepository } from '../../interfaces/repositories/UserRepository'
import { User } from '../../domain/entities/User'
import { ConflictError, UnauthorizedError } from '../../shared/errors'
import { config } from '../../config'
import { logger } from '../../shared/logger'

export interface AuthResult {
  user: User
  token: string
}

export class AuthService {
  private readonly SALT_ROUNDS = 12

  constructor(private userRepository: UserRepository) {}

  async register(email: string, password: string): Promise<User> {
    logger.info('Attempting user registration', { email })

    const existing = await this.userRepository.findByEmail(email)
    if (existing) {
      logger.warn('Registration failed - email already exists', { email })
      throw new ConflictError('Email already in use')
    }

    const hashedPassword = await this.hashPassword(password)
    const user = await this.userRepository.create({
      email,
      password: hashedPassword
    })

    logger.info('User registered successfully', { userId: user.id, email })
    return user
  }

  async login(email: string, password: string): Promise<AuthResult> {
    logger.info('User login attempt', { email })

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      logger.warn('Login failed - user not found', { email })
      throw new UnauthorizedError('Invalid credentials')
    }

    const isValidPassword = await this.comparePassword(password, user.password)
    if (!isValidPassword) {
      logger.warn('Login failed - invalid password', { email, userId: user.id })
      throw new UnauthorizedError('Invalid credentials')
    }

    const token = this.generateToken(user)
    logger.info('User logged in successfully', { userId: user.id, email })

    return { user, token }
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const decoded = jwt.verify(token, config.env.JWT_SECRET as string) as any
      return { userId: decoded.userId, email: decoded.email }
    } catch (error) {
      logger.warn('Token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw new UnauthorizedError('Invalid or expired token')
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS)
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      config.env.JWT_SECRET as string,
      { expiresIn: '7d' } // Use fixed value for now
    )
  }
}