module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.{js,jsx}'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/src/test-utils/styleMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  verbose: true,
  reporters: ['default', '<rootDir>/jest.reporter.cjs'],
};
