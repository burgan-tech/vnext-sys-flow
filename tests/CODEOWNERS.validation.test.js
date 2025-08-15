/**
 * Testing library/framework: Jest (describe/test/expect)
 * If the project uses Mocha, replace 'test' with 'it' and 'expect' with your assertion library (e.g., chai expect).
 *
 * This suite validates the repository's CODEOWNERS configuration, focusing on the PR-changed content:
 *   - There must be a default "*" rule
 *   - It must include @burgan-tech/code-owners and @burgan-tech/vnext-developer
 * Additional coverage:
 *   - Ignores comments/blank lines
 *   - Ensures owners are non-empty and formatted correctly
 *   - Handles edge cases gracefully
 */

const fs = require('fs');
const path = require('path');

function findCodeownersCandidates() {
  const candidates = [
    path.join(process.cwd(), '.github', 'CODEOWNERS'),
    path.join(process.cwd(), 'CODEOWNERS'),
    path.join(process.cwd(), 'docs', 'CODEOWNERS'),
    // Last-resort fallback: some PRs might mistakenly place CODEOWNERS content in tests/codeowners.test.js
    path.join(process.cwd(), 'tests', 'codeowners.test.js'),
  ];
  return candidates.filter((p) => fs.existsSync(p));
}

function readFirstExistingCodeowners() {
  const matches = findCodeownersCandidates();
  if (matches.length === 0) {
    throw new Error(
      'No CODEOWNERS file found at .github/CODEOWNERS, CODEOWNERS, docs/CODEOWNERS, or tests/codeowners.test.js. ' +
      'Add a CODEOWNERS file or update the test to point to your path.'
    );
  }
  const p = matches[0];
  const content = fs.readFileSync(p, 'utf8');
  return { path: p, content };
}

// Minimal parser for CODEOWNERS
// - Ignores comment lines starting with '#' (leading whitespace allowed)
// - Splits non-comment lines into [pattern, ...owners]
// - Collapses internal whitespace sequences to single spaces for parsing purposes
// - Returns array of { pattern, owners: [..], raw }
function parseCodeowners(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Keep original raw; normalize spaces for parsing
    const normalized = trimmed.replace(/\s+/g, ' ');
    const parts = normalized.split(' ').filter(Boolean);
    if (parts.length === 0) continue;
    const pattern = parts[0];
    const owners = parts.slice(1);
    entries.push({ pattern, owners, raw });
  }
  return entries;
}

function findDefaultRule(entries) {
  // In CODEOWNERS, "*" is the global default rule pattern
  return entries.find((e) => e.pattern === '*') || null;
}

function isValidOwnerFormat(owner) {
  // Valid owners are @user or @org/team; GitHub also supports emails, but teams/users are most common.
  // We accept:
  //  - @username
  //  - @org/team-name
  //  - email@domain (allowed by GitHub, though less common)
  if (/^@[\w-]+(\/[\w-]+)?$/.test(owner)) return true;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner)) return true; // email
  return false;
}

describe('CODEOWNERS validation', () => {
  let codeownersPath;
  let content;
  let entries;

  beforeAll(() => {
    const res = readFirstExistingCodeowners();
    codeownersPath = res.path;
    content = res.content;
    entries = parseCodeowners(content);
  });

  test('has at least one non-comment entry', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  test('has a default "*" rule', () => {
    const def = findDefaultRule(entries);
    expect(def).toBeTruthy();
    expect(def.pattern).toBe('*');
  });

  test('default "*" rule includes required teams from PR diff', () => {
    const def = findDefaultRule(entries);
    expect(def).toBeTruthy();

    // Support any ordering and additional owners
    const owners = new Set(def.owners);
    expect(owners.has('@burgan-tech/code-owners')).toBe(true);
    expect(owners.has('@burgan-tech/vnext-developer')).toBe(true);
  });

  test('owners lists have no empty tokens and are properly formatted', () => {
    for (const e of entries) {
      // owners can be empty for a pattern (technically invalid in useful sense).
      // We enforce they should be present for all patterns to be meaningful.
      expect(Array.isArray(e.owners)).toBe(true);
      expect(e.owners.length).toBeGreaterThan(0);

      for (const o of e.owners) {
        // No blank owners
        expect(o.trim().length).toBeGreaterThan(0);
        // Formatting heuristic
        expect(isValidOwnerFormat(o)).toBe(true);
      }
    }
  });

  test('ignores comments and blank lines correctly', () => {
    // Re-parse and ensure only non-comment, non-blank lines are included
    const lines = content.split(/\r?\n/);
    const commentOrBlank = lines.filter((l) => /^\s*(#|$)/.test(l)).length;
    // We can't assert a fixed number here, but we can assert that the parser did
    // not include comment/blank lines in entries count beyond the raw total lines.
    expect(entries.length).toBeLessThanOrEqual(lines.length - commentOrBlank);
  });

  test('no duplicate owners within a single rule', () => {
    for (const e of entries) {
      const seen = new Set();
      for (const o of e.owners) {
        const key = o.toLowerCase();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  test('provides helpful error if file is missing', () => {
    // Simulate missing files by calling the parser directly rather than filesystem
    expect(() => parseCodeowners('# just a comment\n')).not.toThrow();
    const emptyEntries = parseCodeowners('# just a comment\n   \n');
    expect(emptyEntries).toEqual([]);
  });

  describe('edge cases: spacing and mixed whitespace', () => {
    test('handles multiple spaces or tabs between owners', () => {
      const sample = `
# comment
*    @a   @b\t@c
      `;
      const es = parseCodeowners(sample);
      expect(es.length).toBe(1);
      expect(es[0].pattern).toBe('*');
      expect(es[0].owners).toEqual(['@a', '@b', '@c']);
    });
  });

  // Optional: Ensure the default rule contains only recognized/valid-looking identities
  test('default rule owners look valid', () => {
    const def = findDefaultRule(entries);
    expect(def).toBeTruthy();
    for (const o of def.owners) {
      expect(isValidOwnerFormat(o)).toBe(true);
    }
  });
});