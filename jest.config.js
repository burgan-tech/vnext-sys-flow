/** NOTE: Placeholder created by tests to validate expected shape. 
 * Replace with your real configuration and remove this comment.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,ts,tsx}', '!**/node_modules/**'],
  coverageThreshold: {
    global: { branches: 0, functions: 0, lines: 0, statements: 0 }
  },
  transform: {}
};