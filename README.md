# Octopus VSCode Extension

A VSCode extension that provides comprehensive language support for [Octopus](https://octopus-code.org/) quantum chemistry computational software, featuring complete syntax highlighting, intelligent completion, real-time validation, and documentation integration.

## Features

### 🎨 Syntax Highlighting

Complete syntax support based on official Octopus 14.1 documentation:

- **Variable Assignment**: `variable = expression` format highlighting
- **Number Support**: Integers, decimals, scientific notation, complex numbers `{real, imag}`
- **Mathematical Expressions**: sin, cos, sqrt, exp, log, erf and 50+ mathematical functions
- **Predefined Constants**: pi, e, angstrom, eV, rydberg, c and other physical constants
- **Operators**: Arithmetic (+, -, \*, /, ^), comparison (==, <=, >=), logical (&&, ||, !)
- **Boolean Values**: yes/no, true/false, .true./.false.
- **Strings**: Single and double quoted strings
- **Comments**: `#` line comments
- **Include Statements**: `include filename` syntax
- **Block Definition**: `%blockname` ... `%` syntax with pipe separator `|` support

### 📖 Intelligent Documentation Support

- **Hover Tips**: Display detailed information when hovering over variables
  - Variable type and default values
  - Section information
  - Detailed descriptions
  - Available options list (if any)
  - Direct links to online documentation
- **Documentation Navigation**: One-click access to official Octopus documentation

### 🏷️ Inlay Hints Variable Identification

**New Feature!** Visually distinguish variable types through inlay hints:

- **Built-in Variables**: Display `[builtin]`, indicating official Octopus variables
- **User Variables**: Display `[user]`, indicating user-defined variables
- **Smart Tips**: Hover to show detailed variable information and descriptions
- **Configurable Styles**: Support both text labels and emoji display modes
- **Flexible Control**: Separately toggle display of built-in and user variables

Configuration options:

```json
{
  "octopus.inlayHints.enabled": true,        // Enable/disable inlay hints
  "octopus.inlayHints.showBuiltin": true,    // Show built-in variable labels
  "octopus.inlayHints.showUser": true,       // Show user variable labels
}
```

### ⚡ Intelligent Editing Features

- **Auto Completion**:
  - Smart variable name suggestions (758+ variables)
  - Variable value option completion
  - Default value recommendations
  - Type-specific value suggestions
- **Real-time Validation**:
  - Variable value type checking
  - Predefined option validation
  - Mathematical expression recognition
  - Error underline marking
- **Quick Fixes**:
  - Auto-correct to valid options
  - Restore default values
  - Smart suggestions
- **Command Features**:
  - `Ctrl+Shift+P` → "Show All Octopus Variables"
  - Right-click menu quick access
  - Variable search and documentation navigation

## Installation

### Install from Source

1. Clone the repository:

   ```bash
   git clone https://github.com/he0119/vscode-octopus.git
   cd vscode-octopus
   ```

2. Install dependencies (if needed):

   ```bash
   npm install
   ```

3. Run in debug mode:
   - Open the project folder in VSCode
   - Press `F5` to launch debug instance

4. Package and install:

   ```bash
   npm install -g vsce
   vsce package
   code --install-extension octopus-0.0.1.vsix
   ```

### Install from VSCode Extension Marketplace

> Coming soon to VSCode Extension Marketplace

## Usage

1. **Create Input File**: Create or open `.inp` files
2. **Enjoy Syntax Highlighting**: Automatically recognize and highlight Octopus syntax
3. **Smart Completion**: Enjoy auto-completion when typing variable names
4. **View Documentation**: Hover over variables to see detailed information
5. **Input Validation**: Real-time validation of variable value validity
6. **Quick Fixes**: Use `Ctrl+.` to quickly fix incorrect values
7. **Access Documentation**: Click links in hover tips to jump to official documentation
8. **Variable Identification**: Distinguish built-in and user variables through inlay hints

### Available Commands

- **Octopus: Show All Octopus Variables** - List all variables supported in current version
- **Octopus: Switch Octopus Version** - Switch between different versions
- **Octopus: Auto Detect Octopus Version** - Detect version based on file content
- **Octopus: Detect System Installed Octopus Version** - Detect version installed in system
- **Octopus: Toggle Inlay Hints Display** - Enable/disable variable type identification

## Example

```octopus
# Calculation mode settings
CalculationMode = gs          # [builtin] Ground state calculation
TheoryLevel = dft             # [builtin] Density functional theory

# SCF parameter settings  
MixingScheme = broyden        # [builtin] Broyden mixing scheme
Mixing = 0.3                  # [builtin] Mixing parameter
MaximumIter = 100             # [builtin] Maximum iterations

# User-defined parameters
MyCustomRadius = 5.0          # [user] User-defined radius
UserBoxSize = 10.0            # [user] User-defined box size

# Exchange-correlation functional
XCFunctional = lda            # [builtin] LDA functional

# Grid settings
Spacing = 0.25 * angstrom     # [builtin] Support mathematical expressions
BoxShape = minimum            # [builtin] Minimum box shape

# System definition
%Coordinates
  "H" | 0.0 | 0.0 | 0.0
  "H" | 0.0 | 0.0 | 1.4 * angstrom
%
```

> Note: The `[builtin]` and `[user]` labels shown in the example will actually appear as inlay hints next to variable names in actual usage.

## Supported File Types

- `.inp` - Octopus input files (primary)
- Any file identified as `octopus` language

## Variable Coverage

The extension supports **758+ Octopus 14.1 variables**, covering all major functional modules:

### Core Calculation Settings

- **CalculationMode** - Calculation mode (ground state, time domain, etc.)
- **TheoryLevel** - Theory level (DFT, Hartree, etc.)
- **XCFunctional** - Exchange-correlation functional

### SCF Convergence Control

- **MaximumIter** - Maximum SCF iterations
- **ConvRelDens** - Density convergence criteria
- **MixingScheme** - Density mixing scheme
- **Mixing** - Mixing parameter

### Grid and Geometry

- **Spacing** - Grid spacing
- **BoxShape** - Box shape
- **Radius** - Spherical box radius

### Time Evolution

- **TDTimeStep** - Time step size
- **TDMaxSteps** - Maximum time steps
- **TDEvolutionMethod** - Time evolution method

### Output Control

- **Output** - Output content control
- **OutputHow** - Output format control
- **OutputInterval** - Output interval

### And More Modules

- Atomic structure definition
- Excited state calculations
- Spectroscopy calculations
- Optimization algorithms
- Parallel computing settings

## Technical Features

### Real-time Validation Engine

- **Type Checking**: Automatically validate integer, float, logical, string types
- **Option Validation**: Check validity of predefined options
- **Mathematical Expressions**: Recognize and support complex mathematical expressions
- **Combination Options**: Support validation of multiple options connected with `+`

### Intelligent Completion System

- **Context Aware**: Provide appropriate completion based on variable position
- **Type Matching**: Provide suitable value suggestions based on variable type
- **Default Value Recommendations**: Smart recommendation of official default values
- **Option Display**: Complete display of all available options

### Documentation Integration

- **Online Links**: Auto-generate Octopus official documentation links
- **Local Cache**: Variable information stored locally for fast response
- **Version Sync**: Based on Octopus 14.1 varinfo data

## Development and Contributing

### Project Structure

```text
vscode-octopus/
├── src/
│   ├── extension.js          # Main extension logic
│   ├── varinfo-14.1.json     # Auto-generated variable database
│   ├── varinfo-16.2.json     # Octopus 16.2 variable database
│   ├── version-detection.js  # Version detection utilities
│   ├── commands/             # Command implementations
│   │   ├── autoDetectVersion.js
│   │   ├── detectSystemVersion.js
│   │   ├── showVariables.js
│   │   ├── switchVersion.js
│   │   └── toggleInlayHints.js
│   ├── providers/            # Language service providers
│   │   ├── codeActionProvider.js
│   │   ├── completionProvider.js
│   │   ├── diagnosticProvider.js
│   │   ├── hoverProvider.js
│   │   └── inlayHintsProvider.js
│   └── utils/                # Utility modules
│       ├── logger.js
│       ├── parser.js
│       ├── validator.js
│       └── versionManager.js
├── syntaxes/
│   └── octopus.tmLanguage.json  # TextMate syntax file
├── tests/                    # Test files and examples
└── package.json             # Extension manifest
```

### Contributing Guidelines

Welcome to submit Issues and Pull Requests!

1. **Bug Reports**: Please provide specific input files and error descriptions
2. **Feature Requests**: Explain needed features and use cases
3. **Code Contributions**:
   - Fork the project and create a feature branch
   - Add test coverage for new features
   - Ensure all tests pass
   - Submit Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version update information.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Related Links

- [Octopus Official Website](https://octopus-code.org/)
- [Octopus 14.1 Documentation](https://octopus-code.org/documentation/14/)
- [Octopus 16.2 Documentation](https://octopus-code.org/documentation/16/)
- [VSCode Extension Development Documentation](https://code.visualstudio.com/api)
