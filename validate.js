#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Validation script for vnext-template package
console.log('🔍 Running vnext-template validation...');

let validationsPassed = 0;
let validationsFailed = 0;

function validate(description, validationFunction) {
  try {
    console.log(`\n🔍 Validating: ${description}`);
    const result = validationFunction();
    if (result !== false) {
      console.log('✅ VALID');
      validationsPassed++;
    } else {
      console.log('❌ INVALID');
      validationsFailed++;
    }
  } catch (error) {
    console.log(`❌ INVALID: ${error.message}`);
    validationsFailed++;
  }
}

// Validation 1: Package.json structure and content
validate('Package.json structure and content', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Required fields (publishConfig is optional during publishing process)
  const requiredFields = ['name', 'version', 'description', 'main', 'author', 'license', 'repository'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // PublishConfig is optional during publishing (workflow may remove it temporarily)
  if (packageJson.publishConfig) {
    console.log(`  ✓ PublishConfig present`);
  } else {
    console.log(`  ⚠ PublishConfig not present (may be removed during publishing)`);
  }
  
  // Scope validation
  if (!packageJson.name.startsWith('@burgan-tech/')) {
    throw new Error('Package name must use @burgan-tech scope');
  }
  
  // Version validation
  if (!/^\d+\.\d+\.\d+/.test(packageJson.version)) {
    throw new Error('Version must follow semantic versioning');
  }
  
  // Main file validation
  if (!fs.existsSync(packageJson.main)) {
    throw new Error(`Main file ${packageJson.main} does not exist`);
  }
  
  // PublishConfig validation (if present)
  if (packageJson.publishConfig) {
    if (!packageJson.publishConfig.registry || !packageJson.publishConfig.access) {
      throw new Error('publishConfig must include registry and access');
    }
    console.log(`  ✓ PublishConfig is valid`);
  }
  
  console.log(`  ✓ Package name: ${packageJson.name}`);
  console.log(`  ✓ Version: ${packageJson.version}`);
  console.log(`  ✓ Main file: ${packageJson.main}`);
  
  return true;
});

// Validation 2: Main entry point functionality
validate('Main entry point functionality', () => {
  const mainFile = JSON.parse(fs.readFileSync('./package.json', 'utf8')).main;
  
  // Check if file exists and is readable
  if (!fs.existsSync(mainFile)) {
    throw new Error(`Main file ${mainFile} does not exist`);
  }
  
  // Try to require the module
  let vnextTemplate;
  try {
    vnextTemplate = require('./' + mainFile);
  } catch (error) {
    throw new Error(`Failed to require main file: ${error.message}`);
  }
  
  // Check required exports
  const requiredExports = [
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
  
  for (const exportName of requiredExports) {
    if (typeof vnextTemplate[exportName] !== 'function') {
      throw new Error(`Missing or invalid export: ${exportName}`);
    }
  }
  
  console.log(`  ✓ All required exports present`);
  return true;
});

// Validation 3: vnext.config.json validation
validate('vnext.config.json validation', () => {
  if (fs.existsSync('./vnext.config.json')) {
    const config = JSON.parse(fs.readFileSync('./vnext.config.json', 'utf8'));
    
    if (typeof config !== 'object' || config === null) {
      throw new Error('vnext.config.json must contain a valid JSON object');
    }
    
    console.log(`  ✓ vnext.config.json is valid JSON`);
  } else {
    console.log(`  ✓ vnext.config.json not present (optional)`);
  }
  
  return true;
});

// Validation 4: Domain directory structure
validate('Domain directory structure', () => {
  const vnextTemplate = require('./index.js');
  const domainName = vnextTemplate.getDomainName();
  
  if (!domainName) {
    console.log(`  ⚠ No domain directory found (template will be empty)`);
    return true;
  }
  
  if (!fs.existsSync(domainName)) {
    throw new Error(`Domain directory ${domainName} does not exist`);
  }
  
  // Check for vnext structure directories
  const vnextDirs = ['Schemas', 'Workflows', 'Tasks', 'Views', 'Functions', 'Extensions'];
  const existingDirs = vnextDirs.filter(dir => fs.existsSync(path.join(domainName, dir)));
  
  if (existingDirs.length === 0) {
    throw new Error('No vnext structure directories found in domain directory');
  }
  
  console.log(`  ✓ Domain directory: ${domainName}`);
  console.log(`  ✓ Found directories: ${existingDirs.join(', ')}`);
  
  return true;
});

// Validation 5: JSON files syntax validation
validate('JSON files syntax validation', () => {
  const vnextTemplate = require('./index.js');
  const domainName = vnextTemplate.getDomainName();
  
  let jsonFileCount = 0;
  
  if (domainName && fs.existsSync(domainName)) {
    const validateJsonInDir = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          validateJsonInDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          jsonFileCount++;
          try {
            JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          } catch (error) {
            throw new Error(`Invalid JSON in ${fullPath}: ${error.message}`);
          }
        }
      }
    };
    
    validateJsonInDir(domainName);
  }
  
  // Also validate root JSON files
  const rootJsonFiles = ['package.json', 'vnext.config.json'].filter(file => fs.existsSync(file));
  for (const file of rootJsonFiles) {
    jsonFileCount++;
    try {
      JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid JSON in ${file}: ${error.message}`);
    }
  }
  
  console.log(`  ✓ Validated ${jsonFileCount} JSON files`);
  return true;
});

// Validation 6: Module functionality test
validate('Module functionality test', () => {
  const vnextTemplate = require('./index.js');
  
  // Test basic functionality
  const config = vnextTemplate.getDomainConfig();
  const availableTypes = vnextTemplate.getAvailableTypes();
  
  if (!Array.isArray(availableTypes)) {
    throw new Error('getAvailableTypes must return an array');
  }
  
  const expectedTypes = ['schemas', 'workflows', 'tasks', 'views', 'functions', 'extensions'];
  for (const type of expectedTypes) {
    if (!availableTypes.includes(type)) {
      throw new Error(`Missing expected type: ${type}`);
    }
  }
  
  // Test component getters
  const componentGetters = [
    'getSchemas',
    'getWorkflows', 
    'getTasks',
    'getViews',
    'getFunctions',
    'getExtensions'
  ];
  
  for (const getter of componentGetters) {
    const result = vnextTemplate[getter]();
    if (typeof result !== 'object' || result === null) {
      throw new Error(`${getter} must return an object`);
    }
  }
  
  console.log(`  ✓ All component getters working`);
  console.log(`  ✓ Available types: ${availableTypes.join(', ')}`);
  
  return true;
});

// Validation 7: Files array in package.json
validate('Files array in package.json', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  if (!packageJson.files || !Array.isArray(packageJson.files)) {
    throw new Error('package.json must include a files array');
  }
  
  // Check that critical files are included
  const criticalFiles = ['index.js', 'package.json'];
  for (const file of criticalFiles) {
    if (!packageJson.files.includes(file)) {
      throw new Error(`Critical file ${file} not included in files array`);
    }
  }
  
  // Verify files exist (except for templated paths)
  for (const file of packageJson.files) {
    if (!file.includes('{') && !fs.existsSync(file)) {
      console.log(`  ⚠ Warning: File ${file} listed in files array but does not exist`);
    }
  }
  
  console.log(`  ✓ Files array contains ${packageJson.files.length} entries`);
  return true;
});

// Validation 8: Semantic versioning compliance
validate('Semantic versioning compliance', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const version = packageJson.version;
  
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  if (!semverRegex.test(version)) {
    throw new Error(`Version ${version} does not follow semantic versioning`);
  }
  
  console.log(`  ✓ Version ${version} follows semantic versioning`);
  return true;
});

// Print validation results
console.log('\n📊 Validation Results:');
console.log(`✅ Passed: ${validationsPassed}`);
console.log(`❌ Failed: ${validationsFailed}`);
console.log(`📈 Total: ${validationsPassed + validationsFailed}`);

if (validationsFailed > 0) {
  console.log('\n❌ Validation failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n🎉 All validations passed! Package is ready for publishing.');
  process.exit(0);
}
