import jwt from 'jsonwebtoken'
import { config } from '../../src/config'

export interface TestUser {
  userId: string
  email: string
}

export const TEST_USER: TestUser = {
  userId: 'test-user-id',
  email: 'test@example.com'
}

/**
 * Create a unique test user for a specific test suite
 */
export function createTestUser(testSuite: string): TestUser {
  return {
    userId: `test-user-${testSuite}`,
    email: `test-${testSuite}@example.com`
  }
}

/**
 * Generate a valid JWT token for testing purposes
 */
export function generateTestToken(user: TestUser = TEST_USER): string {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    config.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

/**
 * Get authorization header for tests
 */
export function getTestAuthHeader(user: TestUser = TEST_USER): { Authorization: string } {
  const token = generateTestToken(user)
  return { Authorization: `Bearer ${token}` }
}

/**
 * Generate test token with custom expiration for testing edge cases
 */
export function generateExpiredTestToken(user: TestUser = TEST_USER): string {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    config.env.JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  )
}