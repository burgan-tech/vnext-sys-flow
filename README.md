# @burgan-tech/vnext-core

A structured template package for vNext workflow components with domain-based architecture. This package provides a foundation for building scalable workflow systems with schemas, tasks, views, functions, and extensions.

## 🚀 Features

- **Domain-Driven Architecture**: Organized by business domains with clear separation of concerns
- **Component-Based Structure**: Modular design with schemas, workflows, tasks, views, functions, and extensions
- **Template System**: Ready-to-use template structure for new vNext projects
- **Type Safety**: Structured exports with clear APIs for accessing components

## 📦 Installation

### Install as dependency
```bash
npm install @burgan-tech/vnext-core
```

### Install as dev dependency
```bash
npm install --save-dev @burgan-tech/vnext-core
```

## 🏗️ Project Structure

```
vnext-core/
├── core/              # Domain-specific components
│   ├── Extensions/            # Extension definitions
│   ├── Functions/             # Function definitions
│   ├── Schemas/              # JSON schema definitions
│   ├── Tasks/                # Task definitions
│   ├── Views/                # View components
│   └── Workflows/            # Workflow definitions
├── index.js                  # Main entry point
├── vnext.config.json         # Domain configuration
└── package.json              # Package metadata
```

## 📚 Usage

### Basic Usage

```javascript
const vnextTemplate = require('@burgan-tech/vnext-core');

// Get domain configuration
const config = vnextTemplate.getDomainConfig();
console.log('Domain config:', config);

// Get all available component types
const availableTypes = vnextTemplate.getAvailableTypes();
console.log('Available types:', availableTypes);
// Output: ['schemas', 'workflows', 'tasks', 'views', 'functions', 'extensions']

// Get domain name
const domainName = vnextTemplate.getDomainName();
console.log('Domain name:', domainName);
```

### Component Access

```javascript
// Load specific component types
const schemas = vnextTemplate.getSchemas();
const workflows = vnextTemplate.getWorkflows();
const tasks = vnextTemplate.getTasks();
const views = vnextTemplate.getViews();
const functions = vnextTemplate.getFunctions();
const extensions = vnextTemplate.getExtensions();

// Example: Working with schemas
Object.keys(schemas).forEach(schemaName => {
  console.log(`Schema: ${schemaName}`, schemas[schemaName]);
});

// Example: Working with workflows
Object.keys(workflows).forEach(workflowName => {
  console.log(`Workflow: ${workflowName}`, workflows[workflowName]);
});
```

### Integration Example

```javascript
const vnext = require('@burgan-tech/vnext-core');

class WorkflowManager {
  constructor() {
    this.config = vnext.getDomainConfig();
    this.schemas = vnext.getSchemas();
    this.workflows = vnext.getWorkflows();
  }
  
  validateWorkflow(workflowData) {
    // Use loaded schemas for validation
    // Implementation depends on your validation library
  }
  
  executeWorkflow(workflowName) {
    const workflow = this.workflows[workflowName];
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }
    // Execute workflow logic
  }
}

const manager = new WorkflowManager();
```

## 🔧 API Reference

### `getDomainConfig()`
Returns the domain configuration from `vnext.config.json`.

**Returns:** `Object | null` - The configuration object or null if not found

### `getSchemas()`
Loads all JSON schema files from the Schemas directory.

**Returns:** `Object` - Key-value pairs of schema names and definitions

### `getWorkflows()`
Loads all workflow definitions from the Workflows directory.

**Returns:** `Object` - Key-value pairs of workflow names and definitions

### `getTasks()`
Loads all task definitions from the Tasks directory.

**Returns:** `Object` - Key-value pairs of task names and definitions

### `getViews()`
Loads all view definitions from the Views directory.

**Returns:** `Object` - Key-value pairs of view names and definitions

### `getFunctions()`
Loads all function definitions from the Functions directory.

**Returns:** `Object` - Key-value pairs of function names and definitions

### `getExtensions()`
Loads all extension definitions from the Extensions directory.

**Returns:** `Object` - Key-value pairs of extension names and definitions

### `getAvailableTypes()`
Returns an array of available component types.

**Returns:** `Array<string>` - Available component types

### `getDomainName()`
Returns the name of the domain directory.

**Returns:** `string | null` - Domain directory name or null if not found

## 🏛️ Architecture Principles

### Domain-Driven Design
- Each domain is represented as a separate directory
- Components are organized by type within domains
- Clear separation between different workflow concerns

### Component Types

1. **Schemas**: JSON Schema definitions for data validation
2. **Workflows**: Business process definitions and state machines
3. **Tasks**: Individual task definitions and configurations
4. **Views**: User interface and presentation components
5. **Functions**: Reusable business logic functions
6. **Extensions**: Plugin and extension definitions


## 📋 Schema Validation Rules

The template follows strict schema validation rules:

### Instance Base Properties
- Schema instances MUST include: `key`, `version`, `domain`, `flow`, `flowVersion`
- Schema instances MUST NOT include: `labels` (labels belong to business logic)
- Optional fields: `id`, `eTag` (added by platform in production)

### Reference Pattern
- References use: `domain` + `workflow` + (`id` OR `key`) + optional `version`
- NO `type` property in references - `workflow` field serves as type
- Always use local file references: `reference.json#/attributes`

### Standard Lifecycle Pattern
All lifecycle workflows must have:
- `draft` (type: "start") - Initial state
- `active` (type: "normal") - Active state  
- `passive` (type: "finish") - Final state

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Burgan Tech

This package is maintained by the Burgan Tech team as part of our commitment to building scalable, domain-driven workflow solutions.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@burgan-tech/vnext-sys-flow)
- [GitHub Repository](https://github.com/burgan-tech/vnext-sys-flow)
- [Issues](https://github.com/burgan-tech/vnext-sys-flow/issues)
- [Documentation](https://github.com/burgan-tech/vnext-sys-flow#readme)

## 📞 Support

For support and questions:
- Create an issue on [GitHub](https://github.com/burgan-tech/vnext-sys-flow/issues)
- Contact the development team at dev@burgan-tech.com

---

Made with ❤️ by the Burgan Tech team