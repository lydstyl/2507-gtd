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
    setupFiles: ['__tests__/setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: [
        'src/domain/**/*.ts',
        'src/usecases/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        'src/infrastructure/**',
        'src/presentation/**',
        'src/config/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
}