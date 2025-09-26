export default {
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    globals: true,
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Increase timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Global setup file
    setupFiles: ['__tests__/setup.ts']
  },
}