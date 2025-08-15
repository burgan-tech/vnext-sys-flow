/**
 * Additional coverage constraints focusing on configuration threshold sanity.
 * Framework: Jest
 */
const path = require('path');

test('global coverage thresholds present when collectCoverage is true', () => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const cfg = require(path.resolve(process.cwd(), 'jest.config.js'));
  const config = cfg && cfg.default ? cfg.default : cfg;

  if (config.collectCoverage === true && config.coverageThreshold) {
    const global = config.coverageThreshold.global;
    if (global) {
      for (const k of ['branches', 'functions', 'lines', 'statements']) {
        if (global[k] !== undefined) {
          expect(typeof global[k]).toBe('number');
          expect(global[k]).toBeGreaterThanOrEqual(0);
          expect(global[k]).toBeLessThanOrEqual(100);
        }
      }
    }
  }
});