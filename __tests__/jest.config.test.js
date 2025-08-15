/**
 * Tests for jest.config.js
 *
 * Framework: Jest
 * Purpose: Validate the structure and critical properties of the Jest configuration.
 * These tests focus on ensuring the config remains correct, especially around keys known to change in PR diffs.
 */

const path = require('path');

// Helper to load the config object safely regardless of export style
function loadJestConfig() {
  // Prefer requiring the file as CommonJS; for ESM exports, fallback to dynamic import
  // Using require first to avoid async in tests and keep compatibility.
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const cfg = require(path.resolve(process.cwd(), 'jest.config.js'));
    return cfg && cfg.default ? cfg.default : cfg;
  } catch (e) {
    // ESM fallback
    return import(path.resolve(process.cwd(), 'jest.config.js')).then(m => m.default || m);
  }
}

describe('jest.config.js configuration', () => {
  let config;
  beforeAll(async () => {
    const maybePromise = loadJestConfig();
    config = (typeof maybePromise?.then === 'function') ? await maybePromise : maybePromise;
  });

  test('exports an object', () => {
    expect(config).toBeTruthy();
    expect(typeof config).toBe('object');
  });

  test('has a valid testEnvironment (commonly "node" or "jsdom")', () => {
    // Accept common environments; adjust as project-specific if needed.
    if (config.testEnvironment !== undefined) {
      expect(typeof config.testEnvironment).toBe('string');
      expect(config.testEnvironment.length).toBeGreaterThan(0);
    }
  });

  test('defines test matching patterns (testMatch or testRegex)', () => {
    const hasTestMatch = Array.isArray(config.testMatch);
    const hasTestRegex = typeof config.testRegex === 'string' || Array.isArray(config.testRegex);
    expect(hasTestMatch || hasTestRegex).toBe(true);
  });

  test('collectCoverage and collectCoverageFrom are properly shaped when enabled', () => {
    if (config.collectCoverage === true) {
      expect(Array.isArray(config.collectCoverageFrom)).toBe(true);
      expect(config.collectCoverageFrom.length).toBeGreaterThan(0);
      for (const pattern of config.collectCoverageFrom) {
        expect(typeof pattern).toBe('string');
        expect(pattern.length).toBeGreaterThan(0);
      }
    }
  });

  test('coverageThreshold (if present) has sensible numeric values', () => {
    if (config.coverageThreshold) {
      expect(typeof config.coverageThreshold).toBe('object');
      const keys = Object.keys(config.coverageThreshold);
      expect(keys.length).toBeGreaterThan(0);

      for (const scope of keys) {
        const thresh = config.coverageThreshold[scope];
        expect(typeof thresh).toBe('object');
        for (const k of ['branches', 'functions', 'lines', 'statements']) {
          if (thresh[k] !== undefined) {
            expect(typeof thresh[k]).toBe('number');
            expect(thresh[k]).toBeGreaterThanOrEqual(0);
            expect(thresh[k]).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  test('transform (if present) maps patterns to transformer strings or objects', () => {
    if (config.transform !== undefined) {
      expect(typeof config.transform).toBe('object');
      for (const [pattern, transformer] of Object.entries(config.transform)) {
        expect(typeof pattern).toBe('string');
        const t = transformer;
        const valid =
          typeof t === 'string' ||
          (typeof t === 'object' && t !== null && (typeof t.transformer === 'string' || typeof t['^.+\\.[tj]sx?$'] === 'string'));
        expect(valid).toBe(true);
      }
    }
  });

  test('moduleNameMapper (if present) has valid regex-to-path mappings', () => {
    if (config.moduleNameMapper !== undefined) {
      expect(typeof config.moduleNameMapper).toBe('object');
      for (const [regex, target] of Object.entries(config.moduleNameMapper)) {
        expect(typeof regex).toBe('string');
        const ok = typeof target === 'string' || Array.isArray(target);
        expect(ok).toBe(true);
      }
    }
  });

  test('setupFiles/setupFilesAfterEnv (if present) are arrays of non-empty strings', () => {
    if (config.setupFiles !== undefined) {
      expect(Array.isArray(config.setupFiles)).toBe(true);
      for (const f of config.setupFiles) {
        expect(typeof f).toBe('string');
        expect(f.length).toBeGreaterThan(0);
      }
    }
    if (config.setupFilesAfterEnv !== undefined) {
      expect(Array.isArray(config.setupFilesAfterEnv)).toBe(true);
      for (const f of config.setupFilesAfterEnv) {
        expect(typeof f).toBe('string');
        expect(f.length).toBeGreaterThan(0);
      }
    }
  });

  test('testPathIgnorePatterns (if present) are valid strings', () => {
    if (config.testPathIgnorePatterns !== undefined) {
      expect(Array.isArray(config.testPathIgnorePatterns)).toBe(true);
      for (const p of config.testPathIgnorePatterns) {
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  test('roots (if present) is a non-empty array of strings', () => {
    if (config.roots !== undefined) {
      expect(Array.isArray(config.roots)).toBe(true);
      expect(config.roots.length).toBeGreaterThan(0);
      for (const r of config.roots) {
        expect(typeof r).toBe('string');
        expect(r.length).toBeGreaterThan(0);
      }
    }
  });

  test('testTimeout (if present) is a positive integer', () => {
    if (config.testTimeout !== undefined) {
      expect(Number.isInteger(config.testTimeout)).toBe(true);
      expect(config.testTimeout).toBeGreaterThan(0);
    }
  });

  test('reporters (if present) are valid strings or tuples', () => {
    if (config.reporters !== undefined) {
      expect(Array.isArray(config.reporters)).toBe(true);
      for (const r of config.reporters) {
        const ok = typeof r === 'string' || (Array.isArray(r) && r.length >= 1 && typeof r[0] === 'string');
        expect(ok).toBe(true);
      }
    }
  });

  test('projects (if present) are strings or project config objects', () => {
    if (config.projects !== undefined) {
      expect(Array.isArray(config.projects)).toBe(true);
      for (const p of config.projects) {
        const ok = typeof p === 'string' || typeof p === 'object';
        expect(ok).toBe(true);
      }
    }
  });
});