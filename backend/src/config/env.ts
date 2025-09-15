import { ValidationError } from '../shared/errors'

export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  CORS_ORIGINS: string[]
}

const parseNumber = (value: string | undefined, name: string, defaultValue?: number): number => {
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue
    throw new ValidationError(`Environment variable ${name} is required`)
  }

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new ValidationError(`Environment variable ${name} must be a valid number`)
  }

  return parsed
}

const parseString = (value: string | undefined, name: string, defaultValue?: string): string => {
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue
    throw new ValidationError(`Environment variable ${name} is required`)
  }

  return value.trim()
}

const parseStringArray = (value: string | undefined, name: string, defaultValue: string[] = []): string[] => {
  if (value === undefined) return defaultValue

  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

const parseNodeEnv = (value: string | undefined): Environment['NODE_ENV'] => {
  const env = value?.toLowerCase()

  if (env === 'production' || env === 'development' || env === 'test') {
    return env
  }

  return 'development' // Default
}

export const loadEnvironment = (): Environment => {
  const env = process.env

  return {
    NODE_ENV: parseNodeEnv(env.NODE_ENV),
    PORT: parseNumber(env.PORT, 'PORT', 3000),
    DATABASE_URL: parseString(env.DATABASE_URL, 'DATABASE_URL'),
    JWT_SECRET: parseString(env.JWT_SECRET, 'JWT_SECRET'),
    JWT_EXPIRES_IN: parseString(env.JWT_EXPIRES_IN, 'JWT_EXPIRES_IN', '7d'),
    CORS_ORIGINS: parseStringArray(env.CORS_ORIGINS, 'CORS_ORIGINS', [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ])
  }
}

export const validateEnvironment = (): Environment => {
  try {
    return loadEnvironment()
  } catch (error) {
    console.error('Environment validation failed:', error)
    process.exit(1)
  }
}