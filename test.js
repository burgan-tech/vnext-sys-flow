#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test script for vnext-template package
console.log('🧪 Running vnext-template tests...');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFunction) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    testFunction();
    console.log('✅ PASS');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Module can be required
test('Module can be required', () => {
  const vnextTemplate = require('./index.js');
  if (!vnextTemplate) {
    throw new Error('Module failed to load');
  }
});

// Test 2: Module exports expected functions
test('Module exports expected functions', () => {
  const vnextTemplate = require('./index.js');
  const expectedFunctions = [
    'getDomainConfig',
    'getSchemas',
    'getWorkflows',
    'getTasks',
    'getViews',
    'getFunctions',
    'getExtensions',
    'getAvailableTypes',
    'getDomainName'
  ];
  
  for (const func of expectedFunctions) {
    if (typeof vnextTemplate[func] !== 'function') {
      throw new Error(`Expected function ${func} not found or not a function`);
    }
  }
});

// Test 3: getAvailableTypes returns expected array
test('getAvailableTypes returns expected array', () => {
  const vnextTemplate = require('./index.js');
  const types = vnextTemplate.getAvailableTypes();
  
  if (!Array.isArray(types)) {
    throw new Error('getAvailableTypes should return an array');
  }
  
  const expectedTypes = ['schemas', 'workflows', 'tasks', 'views', 'functions', 'extensions'];
  for (const type of expectedTypes) {
    if (!types.includes(type)) {
      throw new Error(`Expected type '${type}' not found in available types`);
    }
  }
});

// Test 4: getDomainConfig handles missing config gracefully
test('getDomainConfig handles missing config gracefully', () => {
  const vnextTemplate = require('./index.js');
  const config = vnextTemplate.getDomainConfig();
  
  // Should not throw an error, should return null or valid config
  if (config !== null && typeof config !== 'object') {
    throw new Error('getDomainConfig should return null or an object');
  }
});

// Test 5: Component getters return objects
test('Component getters return objects', () => {
  const vnextTemplate = require('./index.js');
  const getters = ['getSchemas', 'getWorkflows', 'getTasks', 'getViews', 'getFunctions', 'getExtensions'];
  
  for (const getter of getters) {
    const result = vnextTemplate[getter]();
    if (typeof result !== 'object' || result === null) {
      throw new Error(`${getter} should return an object, got ${typeof result}`);
    }
  }
});

// Test 6: getDomainName returns string or null
test('getDomainName returns string or null', () => {
  const vnextTemplate = require('./index.js');
  const domainName = vnextTemplate.getDomainName();
  
  if (domainName !== null && typeof domainName !== 'string') {
    throw new Error('getDomainName should return a string or null');
  }
});

// Test 7: Package.json is valid
test('Package.json is valid and has required fields', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const requiredFields = ['name', 'version', 'description', 'main', 'author', 'license'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Package.json missing required field: ${field}`);
    }
  }
  
  if (!packageJson.name.startsWith('@burgan-tech/')) {
    throw new Error('Package name should start with @burgan-tech/ scope');
  }
});

// Test 8: vnext.config.json is valid if it exists
test('vnext.config.json is valid JSON if it exists', () => {
  if (fs.existsSync('./vnext.config.json')) {
    const config = JSON.parse(fs.readFileSync('./vnext.config.json', 'utf8'));
    if (typeof config !== 'object' || config === null) {
      throw new Error('vnext.config.json should contain a valid JSON object');
    }
  }
});

// Test 9: Domain directory structure validation
test('Domain directory structure is valid', () => {
  const vnextTemplate = require('./index.js');
  const domainName = vnextTemplate.getDomainName();
  
  if (domainName) {
    const domainPath = domainName;
    if (!fs.existsSync(domainPath)) {
      throw new Error(`Domain directory ${domainPath} does not exist`);
    }
    
    // Check for typical vnext structure
    const expectedDirs = ['Schemas', 'Workflows', 'Tasks', 'Views', 'Functions', 'Extensions'];
    let foundDirs = 0;
    
    for (const dir of expectedDirs) {
      if (fs.existsSync(path.join(domainPath, dir))) {
        foundDirs++;
      }
    }
    
    if (foundDirs === 0) {
      throw new Error('No vnext structure directories found in domain directory');
    }
  }
});

// Test 10: JSON files in domain directory are valid
test('JSON files in domain directory are valid', () => {
  const vnextTemplate = require('./index.js');
  const domainName = vnextTemplate.getDomainName();
  
  if (domainName && fs.existsSync(domainName)) {
    const findJsonFiles = (dir) => {
      const files = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findJsonFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    const jsonFiles = findJsonFiles(domainName);
    for (const file of jsonFiles) {
      try {
        JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (error) {
        throw new Error(`Invalid JSON in file ${file}: ${error.message}`);
      }
    }
  }
});

// Print test results
console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}

/**
 * Additional tests for package.json
 * Testing library/framework: Node.js built-in 'assert' (no external framework),
 * consistent with "test": "node test.js" in package.json.
 */
(() => {
  const assert = require('assert');
  const fs = require('fs');
  const path = require('path');

  function test(name, fn) {
    // Reuse existing test() if present; otherwise define a minimal one.
    if (typeof global.test === 'function' && global.test !== test) {
      return global.test(name, fn);
    }
    Promise.resolve()
      .then(fn)
      .then(() => console.log(`✓ ${name}`))
      .catch((err) => {
        console.error(`✗ ${name}\n  ${err && err.stack || err}`);
        process.exitCode = 1;
      });
  }

  function loadPackageJson() {
    const pkgPath = path.join(__dirname, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json should exist at repository root');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    try {
      return JSON.parse(raw);
    } catch (e) {
      assert.fail('package.json must contain valid JSON: ' + e.message);
    }
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  test('package.json: structure and key fields', () => {
    const pkg = loadPackageJson();
    const required = [
      'name','version','description','main','scripts','keywords','author','license',
      'repository','bugs','homepage','publishConfig','files','engines','dependencies','devDependencies'
    ];
    for (const k of required) {
      assert.ok(hasOwn(pkg, k), `package.json should include "${k}"`);
    }
    assert.strictEqual(pkg.name, '@burgan-tech/vnext-core');
    assert.strictEqual(pkg.version, '1.0.0');
    assert.strictEqual(pkg.main, 'index.js');
  });

  test('package.json: scripts contents match expected values', () => {
    const pkg = loadPackageJson();
    assert.strictEqual(pkg.scripts.test, 'node test.js');
    assert.strictEqual(pkg.scripts.validate, 'node validate.js');
    assert.strictEqual(pkg.scripts.build, "echo 'Build completed - package is ready'");
    assert.strictEqual(pkg.scripts.prepublishOnly, 'npm run validate');
  });

  test('package.json: keywords and metadata', () => {
    const pkg = loadPackageJson();
    for (const k of ['vnext','sys-flow','core','burgan-tech']) {
      assert.ok(pkg.keywords.includes(k), `keywords should include "${k}"`);
    }
    assert.strictEqual(pkg.author, 'Burgan Tech Team <dev@burgan-tech.com>');
    assert.strictEqual(pkg.license, 'MIT');
  });

  test('package.json: repository/bugs/homepage fields', () => {
    const pkg = loadPackageJson();
    assert.strictEqual(pkg.repository.type, 'git');
    assert.strictEqual(pkg.repository.url, 'git+https://github.com/burgan-tech/vnext-sys-flow.git');
    assert.strictEqual(pkg.bugs.url, 'https://github.com/burgan-tech/vnext-sys-flow/issues');
    assert.strictEqual(pkg.homepage, 'https://github.com/burgan-tech/vnext-sys-flow#readme');
  });

  test('package.json: publishConfig, engines, dependencies', () => {
    const pkg = loadPackageJson();
    assert.strictEqual(pkg.publishConfig.registry, 'https://registry.npmjs.org/');
    assert.strictEqual(pkg.publishConfig.access, 'public');
    assert.strictEqual(pkg.engines.node, '>=16.0.0');
    assert.deepStrictEqual(pkg.dependencies, {}, 'dependencies should be an empty object');
    assert.strictEqual(pkg.devDependencies.ajv, '^8.12.0');
    assert.strictEqual(pkg.devDependencies['ajv-formats'], '^2.1.1');
  });

  test('package.json: files list integrity and referenced file existence', () => {
    const pkg = loadPackageJson();
    const expected = [
      'index.js', 'core/', 'vnext.config.json', 'README.md', 'package.json', 'CHANGELOG.md',
      'LICENSE', 'test.js', 'validate.js', 'test-domain-detection.sh', '.cursorrules',
      'gitignore', 'gitattributes'
    ];
    for (const f of expected) {
      assert.ok(pkg.files.includes(f), `files should include "${f}"`);
    }
    const set = new Set(pkg.files);
    assert.strictEqual(set.size, pkg.files.length, 'files array should not contain duplicates');
    for (const f of ['index.js','README.md','package.json','CHANGELOG.md','LICENSE','test.js','validate.js','.cursorrules','gitignore','gitattributes']) {
      assert.ok(fs.existsSync(path.join(__dirname, f)), `Expected to find file: ${f}`);
    }
    assert.ok(fs.existsSync(path.join(__dirname, 'test-domain-detection.sh')), 'Expected to find test-domain-detection.sh');
    const corePath = path.join(__dirname, 'core');
    assert.ok(fs.existsSync(corePath), 'Expected to find "core/" directory');
    assert.ok(fs.statSync(corePath).isDirectory(), '"core/" should be a directory');
    assert.ok(fs.existsSync(path.join(__dirname, 'vnext.config.json')), 'Expected to find vnext.config.json');
  });
})();
