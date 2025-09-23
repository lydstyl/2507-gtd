import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../../domain/entities/User'

export interface UserRepository {
  // Authentication operations
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(credentials: RegisterCredentials): Promise<AuthResponse>
  logout(): Promise<void>

  // User operations
  getCurrentUser(): Promise<User | null>
  updateProfile(data: Partial<User>): Promise<User>

  // Token management
  getStoredToken(): string | null
  setStoredToken(token: string): void
  removeStoredToken(): void
  isTokenValid(token: string): boolean
}