# Octopus Multi-Version Support

This VS Code extension now supports multiple Octopus versions, including versions 14.1 and 16.2.

## Features

### 1. Version Selection

- Supports Octopus 14.1 and 16.2 versions
- Switch versions through configuration file or command palette
- Real-time loading of corresponding version variable information

### 2. Automatic Version Detection

- **System command detection**: Detect system-installed version by running `octopus --version`
- **File comment detection**: Try to detect version information from file comments
- **Workspace configuration detection**: Read version from workspace configuration file
- **Project-level settings**: Support project-level version settings

## Usage

### Method 1: Configure Version Through Settings

1. Open VS Code settings (Ctrl+,)
2. Search for "octopus.version"
3. Select the Octopus version to use (14.1 or 16.2)

### Method 2: Switch Through Command Palette

1. Open command palette (Ctrl+Shift+P)
2. Type "Octopus: Switch Version"
3. Select the version to use

### Method 3: System Version Detection

1. Open command palette (Ctrl+Shift+P)
2. Type "Octopus: Detect System Installed Version"
3. Extension will run `octopus --version` command to automatically detect system-installed version

### Method 4: Comprehensive Auto Detection

1. Open command palette (Ctrl+Shift+P)
2. Type "Octopus: Auto Detect Version"
3. Extension will try multiple detection methods by priority

## Version Detection Rules

Extension will try to detect version in the following priority order:

1. **System command detection**: Run `octopus --version` to get system-installed version
   - Most reliable detection method
   - Get currently installed Octopus version on the system
   - Output format: `octopus 16.2 (git commit 28271023a8)`

2. **File comment detection**: Look for comments in .inp files in the following format

   ```bash
   # Octopus version: 16.2
   % Octopus version 14.1
   ```

3. **Workspace configuration file detection**: Look for version information in the following files
   - `octopus.conf`
   - `config.inp`
   - `version.txt`
   - `.octopus-version`

4. **Variable feature detection**: Determine based on specific version variables used in the file

## Configuration Options

The following options can be configured in VS Code settings:

- `octopus.version`: Manually select Octopus version (default: 14.1)
- `octopus.autoDetectVersion`: Whether to enable automatic version detection (default: false)

## Version Differences

### Octopus 14.1

- Contains approximately 42,973 variable definitions
- Suitable for earlier Octopus projects

### Octopus 16.2

- Contains approximately 44,898 variable definitions
- Includes latest features and variables
- Suitable for latest Octopus projects

## Extension Features

Regardless of which version you use, the following features are supported:

- **Syntax Highlighting**: Syntax coloring for Octopus input files
- **Hover Documentation**: Show variable documentation on mouse hover, including current version information
- **Auto-completion**: Intelligent completion for variable names and values
- **Error Checking**: Real-time validation of variable value validity
- **Quick Fixes**: Provide variable value correction suggestions
- **Variable Browser**: Display list of all available variables
- **Online Documentation Links**: Automatically generate correct documentation links based on current version

## Developer Information

To add support for new versions:

1. Add new `varinfo-{version}.json` file in the `src/` directory
2. Add new version to the `octopus.version` enum in `package.json`
3. Update version detection logic (if needed)

## Troubleshooting

### Version Switching Failure

- Ensure the corresponding version JSON file exists
- Check error information in the output panel
- Try restarting VS Code

### Inaccurate Auto Detection

- Manually add version comment in the file
- Use manual version switching feature
- Fix version selection in workspace settings

### Function Abnormalities

- Check log information in the output panel
- Confirm if the currently loaded version is correct
- Reload window or restart VS Code