export interface User {
  id: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export class UserEntity {
  constructor(private user: User) {}

  get id(): string {
    return this.user.id
  }

  get email(): string {
    return this.user.email
  }

  get createdAt(): string | undefined {
    return this.user.createdAt
  }

  get updatedAt(): string | undefined {
    return this.user.updatedAt
  }

  get rawUser(): User {
    return this.user
  }

  // Business Logic Methods

  /**
   * Validate email format
   */
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.user.email)
  }

  /**
   * Get user display name (email local part)
   */
  getDisplayName(): string {
    return this.user.email.split('@')[0]
  }

  /**
   * Get user initials from email
   */
  getInitials(): string {
    const displayName = this.getDisplayName()
    const parts = displayName.split(/[._-]/)

    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }

    return displayName.substring(0, 2).toUpperCase()
  }

  /**
   * Get domain from email
   */
  getEmailDomain(): string {
    return this.user.email.split('@')[1] || ''
  }

  /**
   * Check if user account is new (created within last 7 days)
   */
  isNewUser(): boolean {
    if (!this.user.createdAt) return false

    try {
      const createdDate = new Date(this.user.createdAt)
      const now = new Date()
      const weekInMs = 7 * 24 * 60 * 60 * 1000

      return (now.getTime() - createdDate.getTime()) < weekInMs
    } catch {
      return false
    }
  }

  /**
   * Check if user profile was recently updated
   */
  isRecentlyUpdated(): boolean {
    if (!this.user.updatedAt) return false

    try {
      const updatedDate = new Date(this.user.updatedAt)
      const now = new Date()
      const hourInMs = 60 * 60 * 1000

      return (now.getTime() - updatedDate.getTime()) < hourInMs
    } catch {
      return false
    }
  }

  /**
   * Get formatted creation date
   */
  getFormattedCreatedAt(): string {
    if (!this.user.createdAt) return 'Unknown'

    try {
      const date = new Date(this.user.createdAt)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  /**
   * Validate the user data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.isValidEmail()) {
      errors.push('Invalid email format')
    }

    if (!this.user.id || this.user.id.trim().length === 0) {
      errors.push('User ID is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Validation utilities for credentials
export class CredentialsValidator {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Email is required' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' }
    }

    return { isValid: true }
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length === 0) {
      return { isValid: false, error: 'Password is required' }
    }

    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' }
    }

    return { isValid: true }
  }

  static validateLoginCredentials(credentials: LoginCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    const emailValidation = this.validateEmail(credentials.email)
    if (!emailValidation.isValid && emailValidation.error) {
      errors.push(emailValidation.error)
    }

    const passwordValidation = this.validatePassword(credentials.password)
    if (!passwordValidation.isValid && passwordValidation.error) {
      errors.push(passwordValidation.error)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateRegisterCredentials(credentials: RegisterCredentials): { isValid: boolean; errors: string[] } {
    // Same validation as login for now, but could be extended
    return this.validateLoginCredentials(credentials)
  }
}