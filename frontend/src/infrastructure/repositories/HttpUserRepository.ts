import { UserRepository } from '../../interfaces/repositories/UserRepository'
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../../domain/entities/User'
import { authApi } from '../../services/api'

export class HttpUserRepository implements UserRepository {
  private readonly TOKEN_KEY = 'token'

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.login(credentials)

    // Store the token
    if (response.token) {
      this.setStoredToken(response.token)
    }

    return response
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await authApi.register(credentials)

    // Store the token
    if (response.token) {
      this.setStoredToken(response.token)
    }

    return response
  }

  async logout(): Promise<void> {
    // Clear the stored token
    this.removeStoredToken()

    // Note: The backend doesn't have a logout endpoint
    // so we just clear the local token
    return Promise.resolve()
  }

  async getCurrentUser(): Promise<User | null> {
    // Extract user from stored token or make API call
    // For now, we'll need to decode the JWT or make an API call
    // Since there's no current user endpoint, we'll return null
    // In a real implementation, you'd decode the JWT or have a /me endpoint
    return null
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    // Not implemented in the current API
    throw new Error('Profile update not implemented')
  }

  // Token management methods
  getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY)
    } catch {
      return null
    }
  }

  setStoredToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token)
    } catch (error) {
      console.error('Failed to store token:', error)
    }
  }

  removeStoredToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY)
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  }

  isTokenValid(token: string): boolean {
    if (!token) return false

    try {
      // Basic JWT validation - decode and check expiration
      const payload = this.decodeJWT(token)

      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  // Private helper method to decode JWT
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      return JSON.parse(jsonPayload)
    } catch (error) {
      throw new Error('Invalid JWT token')
    }
  }
}