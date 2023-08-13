module.exports = {
  testEnvironment: 'node',
  restoreMocks: true,
  clearMocks: true,
  resetModules: true,
  collectCoverage: false,
  collectCoverageFrom: ['index.ts', 'src/**/*.{ts,js}'],
  modulePaths: ['node_modules', '.'],
  testMatch: ['**/?(*.)+(spec).[jt]s?(x)'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  coverageThreshold: {
    global: {
      lines: 90
    }
  }
};
