/**
 * Tests for CodeRabbit configuration.
 *
 * Testing framework: This test file is designed for Jest-style APIs (describe/it/expect).
 * If the project uses Mocha + Chai, it should still run under Mocha with global describe/it
 * and Node's assert; adapt imports if needed.
 *
 * We avoid adding YAML parsing dependencies. Instead, we validate critical content via
 * robust regex/string assertions and basic structural checks. This provides value even if
 * the config is static by preventing accidental regressions to keys and patterns.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function resolveConfigPath() {
  const candidates = [
    '.coderabbit.yml',
    '.coderabbit.yaml',
    'coderabbit.yml',
    'coderabbit.yaml',
  ];
  for (const rel of candidates) {
    const p = path.join(process.cwd(), rel);
    if (fs.existsSync(p)) return p;
  }
  // Fallback: try to locate by content (schema URL marker)
  // Walk limited set for performance: repo root YAML files
  const rootFiles = fs.readdirSync(process.cwd());
  const yamlFiles = rootFiles.filter(f => f.match(/\.ya?ml$/i));
  for (const f of yamlFiles) {
    const p = path.join(process.cwd(), f);
    try {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json')) {
        return p;
      }
    } catch {}
  }
  return null;
}

function readConfigText() {
  const configPath = resolveConfigPath();
  if (!configPath) {
    throw new Error('CodeRabbit config file not found. Expected one of: .coderabbit.yml, .coderabbit.yaml, coderabbit.yml, coderabbit.yaml at repository root.');
  }
  const text = fs.readFileSync(configPath, 'utf8');
  return { text, configPath };
}

describe('CodeRabbit configuration', () => {
  let cfgText;
  let cfgPath;

  beforeAll(() => {
    const { text, configPath } = readConfigText();
    cfgText = text;
    cfgPath = configPath;
  });

  it('contains the schema URL marker for validation', () => {
    expect(cfgText).toEqual(expect.stringContaining('yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json'));
  });

  it('sets language to en-US', () => {
    // Ensure the language key exists and is specifically set to en-US (line oriented)
    const languageLine = cfgText.split(/\r?\n/).find(l => /^\s*language:\s*en-US\s*$/.test(l));
    expect(languageLine).toBeDefined();
  });

  describe('reviews: core switches', () => {
    it('enables review_status and request_changes_workflow', () => {
      expect(/\breviews:\s*[\s\S]*?\breview_status:\s*true\b/.test(cfgText)).toBe(true);
      expect(/\breviews:\s*[\s\S]*?\brequest_changes_workflow:\s*true\b/.test(cfgText)).toBe(true);
    });

    it('enables auto_review with enabled: true', () => {
      // Ensure auto_review is present and enabled
      const autoReviewBlock = cfgText.match(/\bauto_review:\s*[\s\S]*?(?=\n\S|\n$)/m);
      expect(autoReviewBlock).not.toBeNull();
      expect(/enabled:\s*true/.test(autoReviewBlock[0])).toBe(true);
    });

    it('includes expected base_branches patterns', () => {
      const bb = cfgText.match(/\bbase_branches:\s*([\s\S]*?)(?=\n\s*\S|$)/m);
      expect(bb).not.toBeNull();

      const block = bb[1];
      const required = [
        '- master',
        '- main',
        '- develop',
        '- "release-v*"',
        '- "release/*"',
        '- "feature/*"',
        '- "hotfix/*"',
        '- "bugfix/*"',
      ];
      for (const line of required) {
        expect(block).toEqual(expect.stringContaining(line));
      }
    });
  });

  describe('review: include and exclude patterns', () => {
    it('defines include_patterns for key file types and directories', () => {
      const inc = cfgText.match(/\breview:\s*[\s\S]*?\binclude_patterns:\s*([\s\S]*?)\n\s*#?\s*Skip|\breview:\s*[\s\S]*?\binclude_patterns:\s*([\s\S]*?)\n\s*exclude_patterns:/m);
      // Capture group may be at index 1 or 2 depending on which sentinel matched
      const group = inc ? (inc[1] || inc[2]) : null;
      expect(group).not.toBeNull();

      const expectedGlobs = [
        '"**/*.js"',
        '"**/*.ts"',
        '"**/*.d.ts"',
        '"**/*.json"',
        '"**/*.schema.json"',
        '"**/vnext.config.json"',
        '"**/package.json"',
        '"**/package-lock.json"',
        '"**/*.csx"',
        '"**/*.cs"',
        '"**/*.md"',
        '"**/*.yml"',
        '"**/*.yaml"',
        '"**/.cursorrules"',
        '"**/core/**/*.json"',
        '"**/Schemas/**"',
        '"**/Workflows/**"',
        '"**/Tasks/**"',
        '"**/Views/**"',
        '"**/Functions/**"',
        '"**/Extensions/**"',
      ];
      for (const glob of expectedGlobs) {
        expect(group).toEqual(expect.stringContaining(glob));
      }
    });

    it('defines exclude_patterns for standard and tooling directories', () => {
      const exc = cfgText.match(/\bexclude_patterns:\s*([\s\S]*?)(?=\n\s*\S|$)/m);
      expect(exc).not.toBeNull();

      const block = exc[1];
      const expectedExclusions = [
        '"**/node_modules/**"',
        '"**/dist/**"',
        '"**/build/**"',
        '"**/coverage/**"',
        '"**/.nyc_output/**"',
        '"**/logs/**"',
        '"**/*.log"',
        '"**/.DS_Store"',
        '"**/Thumbs.db"',
        '"**/.git/**"',
        '"**/.vscode/**"',
        '"**/.idea/**"',
        '"**/.gitkeep"',
      ];
      for (const glob of expectedExclusions) {
        expect(block).toEqual(expect.stringContaining(glob));
      }
    });
  });

  describe('chat and early access', () => {
    it('disables chat auto_reply', () => {
      const chat = cfgText.match(/\bchat:\s*([\s\S]*?)(?=\n\s*\S|$)/m);
      expect(chat).not.toBeNull();
      expect(chat[1]).toEqual(expect.stringContaining('auto_reply: false'));
    });

    it('enables early_access true', () => {
      // Ensure early_access is explicitly true anywhere in the file
      expect(/\bearly_access:\s*true\b/.test(cfgText)).toBe(true);
    });
  });

  describe('defensive tests against missing keys', () => {
    // These tests help catch accidental deletions or renames
    const requiredKeyRegexes = [
      /\breviews:\b/,
      /\breview_status:\s*true\b/,
      /\bauto_review:\b/,
      /\bbase_branches:\b/,
      /\breview:\b/,
      /\binclude_patterns:\b/,
      /\bexclude_patterns:\b/,
      /\bchat:\b/,
      /\bauto_reply:\s*false\b/,
      /\bearly_access:\s*true\b/,
    ];

    for (const rx of requiredKeyRegexes) {
      it(`contains required key pattern: ${rx}`, () => {
        expect(rx.test(cfgText)).toBe(true);
      });
    }
  });

  describe('format guards', () => {
    it('does not include obvious binary characters', () => {
      // Check for NUL bytes or other control chars (excluding common whitespace)
      const hasControl = /(?![\t\n\r])\p{Cc}/u.test(cfgText);
      expect(hasControl).toBe(false);
    });

    it('is not empty and has reasonable length', () => {
      expect(cfgText.length).toBeGreaterThan(60);
    });

    it('has consistent YAML-like indentation for list items', () => {
      // Spot-check that list items are prefixed with two spaces and a dash in some areas
      const listLines = cfgText.split(/\r?\n/).filter(l => /^\s{2,}-\s/.test(l));
      expect(listLines.length).toBeGreaterThan(5);
    });
  });

  // Provide a clear diagnostic on failure with file path context
  afterAll(() => {
    // Just to ensure cfgPath was resolved and is sensible
    assert.ok(cfgPath && typeof cfgPath === 'string', 'Resolved CodeRabbit config path should be a string');
  });
});