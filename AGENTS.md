# VSCode Octopus Extension Copilot Instructions

## Project Overview

This is a VSCode language extension for [Octopus](https://octopus-code.org/) quantum chemistry software input files (`.inp`). The extension provides syntax highlighting, hover documentation, autocompletion, and direct links to Octopus documentation for variable definitions.

## Architecture & Key Components

### Core Files Structure
- `src/extension.js` - Main extension logic with hover providers, completion providers, and variable validation
- `src/variables.json` - Generated database of all Octopus variables with types, defaults, descriptions, and documentation URLs
- `syntaxes/octopus.tmLanguage.json` - TextMate grammar for syntax highlighting
- `scripts/parse-varinfo.js` - Parses upstream `varinfo_orig` file to generate `variables.json`
- `scripts/build.js` - Build script that runs parsing and tests

### Data Flow
1. `scripts/parse-varinfo.js` reads `varinfo_orig` → generates `src/variables.json`
2. Extension loads `variables.json` for hover/completion providers
3. TextMate grammar provides syntax highlighting independently

## Critical Development Patterns

### Variable Database Generation
- **Never manually edit** `src/variables.json` - it's auto-generated
- Update `scripts/varinfo_orig` with new Octopus release data, then run `npm run parse-varinfo`
- Each variable entry includes: `type`, `default`, `section`, `description`, `options[]`, `docUrl`

### Extension Provider Pattern
```javascript
// Hover provider pattern in extension.js
const parseVariableAssignment = (line) => {
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  // Returns {variableName, value, varStartPos, varEndPos, ...}
};
```

### TextMate Grammar Conventions
- Use `source.octopus` as root scope
- Mathematical expressions: patterns for `sqrt()`, `sin()`, constants like `pi`, `eV`
- Complex numbers: `{real, imag}` syntax
- Block syntax: `%blockname ... %` with pipe separators `|`

### Testing Strategy
- `tests/test-suite.js` - Comprehensive test runner
- `tests/examples.inp` - Complete syntax showcase file for manual testing
- Run with `npm test` or `node tests/test-suite.js --verbose`

## Build & Development Workflow

### Essential Commands
```bash
# Full build process
npm run build                    # Runs parse-varinfo + tests
npm run parse-varinfo           # Update variables.json from varinfo_orig
npm test                        # Run test suite
npm run package                 # Create .vsix package

# Development
# Press F5 in VSCode to launch Extension Development Host
# Open .inp files to test syntax highlighting and hover
```

### File Type Associations
- Primary: `.inp` files (Octopus input format)
- Language ID: `octopus`
- Comments: `#` line comments only

## Integration Points

### Documentation Links
- Format: `https://octopus-code.org/documentation/14/variables/{section}/`
- Generated from variable's `section` field in variables.json
- Hover tooltips include direct "View Documentation" links

### Octopus Variable System
- Variables have strict types: `logical`, `integer`, `float`, `string`, `block`
- Many have predefined option values (enum-like)
- Mathematical expressions supported in numeric contexts
- Context-aware validation based on variable type

## Extension-Specific Conventions

### Command Contributions
- `octopus.showVariables` - Quick picker showing all available variables
- Available via Command Palette and right-click context menu in `.inp` files

### Value Validation Logic
```javascript
// Pattern: Check if value contains mathematical expressions
const containsMathematicalExpression = (value) => {
  return /[+\-*\/^]/.test(value) || 
         /\b(pi|e|angstrom|eV)\b/.test(value) ||
         /\{\s*[^}]+\s*,\s*[^}]+\s*\}/.test(value); // Complex numbers
};
```

### Predefined Constants & Functions
- Constants: `pi`, `e`, `angstrom`, `eV`, `c`, etc. (keep in sync with tmLanguage.json)
- Math functions: `sqrt`, `sin`, `cos`, `exp`, `log`, etc.
- Both lists defined in extension.js must match tmLanguage.json patterns

## Testing & Quality Assurance

- Test files in `tests/` directory provide comprehensive coverage
- `examples.inp` serves as both test file and documentation showcase
- Always test: syntax highlighting, hover tooltips, variable completion, documentation links
- Test mathematical expressions, complex numbers, and block syntax edge cases
