/**
 * Tests for GitHub Actions workflow "SonarQube Analysis - vNext Core Domain".
 *
 * Testing library/framework: Jest
 * - These tests are written using Jest's describe/test/expect APIs.
 * - If your project uses a different runner (e.g., Mocha/Vitest), adapt the test function
 *   names accordingly or run them under Jest to ensure compatibility.
 *
 * Strategy:
 * - Locate a workflow file under .github/workflows that corresponds to the SonarCloud scan.
 * - Prefer parsing the YAML (via 'yaml' or 'js-yaml' if present). If not available, fall back
 *   to robust string-based assertions scoped to step blocks.
 * - Validate triggers, job metadata, key steps, and SonarCloud arguments from the provided diff.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function tryRequire(modName) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(modName);
  } catch (e) {
    return null;
  }
}

function tryParseYaml(text) {
  const yaml = tryRequire('yaml') || tryRequire('js-yaml');
  if (!yaml) return null;
  try {
    if (typeof yaml.parse === 'function') return yaml.parse(text);
    if (typeof yaml.load === 'function') return yaml.load(text);
  } catch (e) {
    // Ignore parsing errors; fall back to string checks
  }
  return null;
}

function findSonarWorkflow(repoRoot) {
  const workflowsDir = path.join(repoRoot, '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) {
    throw new Error('Expected .github/workflows directory to exist');
  }
  const files = fs.readdirSync(workflowsDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => path.join(workflowsDir, f));

  if (!files.length) throw new Error('No workflow YAML files found in .github/workflows');

  for (const p of files) {
    const content = fs.readFileSync(p, 'utf8');
    // Heuristics to find the Sonar workflow by name or unique markers from the diff
    if (
      content.includes('SonarQube Analysis - vNext Core Domain') ||
      content.includes('SonarSource/sonarcloud-github-action') ||
      content.includes('sonar.projectKey=burgan-tech_vnext-sys-flow')
    ) {
      return { path: p, content };
    }
  }

  throw new Error('Could not locate a Sonar workflow file by expected markers');
}

function getBlockByStepName(yamlText, stepName) {
  const lines = yamlText.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if ((t.startsWith('- name:') || t.startsWith('name:')) && t.includes(stepName)) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  const block = [lines[start]];
  for (let j = start + 1; j < lines.length; j += 1) {
    const t = lines[j].trim();
    if (t.startsWith('- name:')) break;
    block.push(lines[j]);
  }
  return block;
}

function blockIncludesKV(blockLines, key, value) {
  if (!blockLines) return false;
  const hay = blockLines.join('\n');
  if (value === undefined) {
    // check key presence only
    const keyRe = new RegExp(`\\b${key}\\s*:`);
    return keyRe.test(hay);
  }
  // exact value match in YAML-ish lines
  const pairRe = new RegExp(`${key}\\s*:\\s*${escapeRegExp(String(value))}`);
  return pairRe.test(hay);
}

function stringIncludesAll(haystack, needles) {
  return needles.every((n) => haystack.includes(n));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Lazily located/parsed workflow so we don't re-read for every test
let WORKFLOW_TEXT = null;
let WORKFLOW_PATH = null;
let WORKFLOW_PARSED = null;

beforeAll(() => {
  const repoRoot = process.cwd();
  const wf = findSonarWorkflow(repoRoot);
  WORKFLOW_TEXT = wf.content;
  WORKFLOW_PATH = wf.path;
  WORKFLOW_PARSED = tryParseYaml(WORKFLOW_TEXT);
});

describe('SonarQube workflow presence', () => {
  test('should locate the workflow file and contain the expected name marker', () => {
    expect(WORKFLOW_PATH).toBeTruthy();
    expect(typeof WORKFLOW_TEXT).toBe('string');
    expect(WORKFLOW_TEXT.length).toBeGreaterThan(20);
    expect(
      WORKFLOW_TEXT.includes('SonarQube Analysis - vNext Core Domain') ||
      WORKFLOW_TEXT.includes('SonarSource/sonarcloud-github-action') ||
      WORKFLOW_TEXT.includes('sonar.projectKey=burgan-tech_vnext-sys-flow')
    ).toBe(true);
  });
});

describe('Workflow triggers configuration', () => {
  test('push branches should include master, main, develop, release-v*, release/*', () => {
    const expected = ['master', 'main', 'develop', 'release-v*', 'release/*'];
    if (WORKFLOW_PARSED?.on?.push?.branches) {
      const branches = WORKFLOW_PARSED.on.push.branches;
      expected.forEach((b) => expect(branches).toContain(b));
    } else {
      // Fallback: string-based assertions
      expected.forEach((b) => {
        expect(WORKFLOW_TEXT).toContain(`- ${b}`);
      });
    }
  });

  test('pull_request branches should include master, main, develop', () => {
    const expected = ['master', 'main', 'develop'];
    if (WORKFLOW_PARSED?.on?.pull_request?.branches) {
      const branches = WORKFLOW_PARSED.on.pull_request.branches;
      expected.forEach((b) => expect(branches).toContain(b));
    } else {
      expected.forEach((b) => {
        expect(WORKFLOW_TEXT).toContain(`- ${b}`);
      });
    }
  });
});

describe('Job and runner configuration', () => {
  test('quality-check job should exist with correct name and runner', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']) {
      const job = WORKFLOW_PARSED.jobs['quality-check'];
      expect(job).toBeTruthy();
      expect(job['runs-on']).toBe('ubuntu-latest');
      expect(job.name).toBe('vNext Core Domain Quality Analysis');
    } else {
      expect(WORKFLOW_TEXT).toContain('quality-check:');
      expect(WORKFLOW_TEXT).toContain('runs-on: ubuntu-latest');
      expect(WORKFLOW_TEXT).toContain('name: vNext Core Domain Quality Analysis');
    }
  });
});

describe('Key steps exist with correct configuration', () => {
  test('Checkout repository step uses actions/checkout@v4 with fetch-depth: 0', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const checkout = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Checkout repository')
      );
      expect(checkout).toBeTruthy();
      expect(checkout.uses).toBe('actions/checkout@v4');
      // Ensure fetch-depth: 0
      expect(checkout.with).toBeTruthy();
      expect(checkout.with['fetch-depth']).toBe(0);
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Checkout repository');
      expect(block).toBeTruthy();
      expect(blockIncludesKV(block, 'uses', 'actions/checkout@v4')).toBe(true);
      // 'fetch-depth: 0  # comment' is acceptable, so check 'fetch-depth: 0'
      expect(block.join('\n')).toMatch(/fetch-depth:\s*0\b/);
    }
  });

  test('Setup Node.js step uses actions/setup-node@v4 with node-version 18 and npm cache', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const setup = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Setup Node.js')
      );
      expect(setup).toBeTruthy();
      expect(setup.uses).toBe('actions/setup-node@v4');
      expect(setup.with).toBeTruthy();
      expect(String(setup.with['node-version'])).toBe('18');
      expect(setup.with.cache).toBe('npm');
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Setup Node.js');
      expect(block).toBeTruthy();
      expect(blockIncludesKV(block, 'uses', 'actions/setup-node@v4')).toBe(true);
      expect(block.join('\n')).toMatch(/node-version:\s*['"]?18['"]?\b/);
      expect(block.join('\n')).toMatch(/cache:\s*['"]?npm['"]?\b/);
    }
  });

  test('Install dependencies step runs npm ci', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Install dependencies')
      );
      expect(step).toBeTruthy();
      expect(step.run).toBe('npm ci');
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Install dependencies');
      expect(block).toBeTruthy();
      expect(block.join('\n')).toMatch(/run:\s*npm ci\b/);
    }
  });

  test('Run vNext core tests step runs npm run test and continues on error', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Run vNext core tests')
      );
      expect(step).toBeTruthy();
      expect(step.run).toBe('npm run test');
      expect(step['continue-on-error']).toBe(true);
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Run vNext core tests');
      expect(block).toBeTruthy();
      expect(block.join('\n')).toMatch(/run:\s*npm run test\b/);
      expect(block.join('\n')).toMatch(/continue-on-error:\s*true\b/);
    }
  });

  test('Validate vNext JSON schemas and workflows step runs npm run validate and continues on error', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Validate vNext JSON schemas and workflows')
      );
      expect(step).toBeTruthy();
      expect(step.run).toBe('npm run validate');
      expect(step['continue-on-error']).toBe(true);
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Validate vNext JSON schemas and workflows');
      expect(block).toBeTruthy();
      expect(block.join('\n')).toMatch(/run:\s*npm run validate\b/);
      expect(block.join('\n')).toMatch(/continue-on-error:\s*true\b/);
    }
  });

  test('Check vNext domain detection step runs test-domain-detection.sh and continues on error', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Check vNext domain detection')
      );
      expect(step).toBeTruthy();
      expect(step.run).toBe('bash test-domain-detection.sh');
      expect(step['continue-on-error']).toBe(true);
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Check vNext domain detection');
      expect(block).toBeTruthy();
      expect(block.join('\n')).toMatch(/run:\s*bash\s+test-domain-detection\.sh\b/);
      expect(block.join('\n')).toMatch(/continue-on-error:\s*true\b/);
    }
  });

  test('Build vNext core package step runs npm run build and continues on error', () => {
    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('Build vNext core package')
      );
      expect(step).toBeTruthy();
      expect(step.run).toBe('npm run build');
      expect(step['continue-on-error']).toBe(true);
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'Build vNext core package');
      expect(block).toBeTruthy();
      expect(block.join('\n')).toMatch(/run:\s*npm run build\b/);
      expect(block.join('\n')).toMatch(/continue-on-error:\s*true\b/);
    }
  });
});

describe('SonarCloud Scan configuration', () => {
  test('SonarCloud step uses correct action, token env, and args (projectKey, org, sources, exclusions, suffixes, coverage exclusions)', () => {
    const requiredArgs = [
      '-Dsonar.projectKey=burgan-tech_vnext-sys-flow',
      '-Dsonar.organization=burgan-tech',
      '-Dsonar.sources=core/,index.js,test.js,validate.js',
      '-Dsonar.exclusions=**/node_modules/**,**/dist/**,**/.gitkeep',
      '-Dsonar.javascript.file.suffixes=.js,.ts,.csx',
      '-Dsonar.coverage.exclusions=**/*.csx,**/test*.js'
    ];

    if (WORKFLOW_PARSED?.jobs?.['quality-check']?.steps) {
      const step = WORKFLOW_PARSED.jobs['quality-check'].steps.find(
        (s) => s.name && String(s.name).includes('SonarCloud Scan')
      );
      expect(step).toBeTruthy();
      expect(step.uses).toBe('SonarSource/sonarcloud-github-action@v2.3.0');

      // Env token present
      expect(step.env).toBeTruthy();
      // The value will be a string like "${{ secrets.SONAR_TOKEN }}" - just ensure key exists
      expect(Object.keys(step.env)).toContain('SONAR_TOKEN');

      // with.projectBaseDir should be .
      expect(step.with).toBeTruthy();
      expect(step.with.projectBaseDir).toBe('.');

      // args is a folded multiline scalar in YAML; parser will give a single string
      const argsStr = String(step.with.args || '');
      requiredArgs.forEach((needle) => {
        expect(argsStr.includes(needle)).toBe(true);
      });
    } else {
      const block = getBlockByStepName(WORKFLOW_TEXT, 'SonarCloud Scan');
      expect(block).toBeTruthy();
      expect(blockIncludesKV(block, 'uses', 'SonarSource/sonarcloud-github-action@v2.3.0')).toBe(true);

      const blockText = block.join('\n');
      // Env token present
      expect(/env:\s*[\s\S]*SONAR_TOKEN\s*:/.test(blockText)).toBe(true);
      // projectBaseDir set to '.'
      expect(/projectBaseDir:\s*\./.test(blockText)).toBe(true);

      // Required args lines present
      requiredArgs.forEach((needle) => {
        expect(blockText.includes(needle)).toBe(true);
      });
    }
  });
});