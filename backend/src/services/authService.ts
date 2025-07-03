import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../interfaces/repositories/UserRepository'
import { User } from '../domain/entities/User'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_EXPIRES_IN = '7d'

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(email: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email)
    if (existing) throw new Error('Email already in use')
    const hashed = await this.hashPassword(password)
    return await this.userRepository.create({ email, password: hashed })
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) throw new Error('Invalid credentials')
    const valid = await this.comparePassword(password, user.password)
    if (!valid) throw new Error('Invalid credentials')
    const token = this.generateToken(user)
    return { user, token }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  }

  private async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  private generateToken(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  }
}
