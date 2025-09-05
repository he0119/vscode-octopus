const vscode = require("vscode");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * Register version switching command
 * @param {Function} updateDiagnostics - Function to update diagnostics
 * @returns {vscode.Disposable} Command disposable
 */
function registerSwitchVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.switchVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // Dynamically get current version
      const versions = ["14.1", "16.2"];
      const selectedVersion = await vscode.window.showQuickPick(
        versions.map(version => ({
          label: `Octopus ${version}`,
          description: version === currentVersion ? "(current version)" : "",
          version: version
        })),
        {
          placeHolder: `Select Octopus version (current: ${currentVersion})`,
          canPickMany: false
        }
      );

      if (selectedVersion && selectedVersion.version !== currentVersion) {
        if (loadVariables(selectedVersion.version)) {
          // Update configuration
          const config = vscode.workspace.getConfiguration('octopus');
          await config.update('version', selectedVersion.version, vscode.ConfigurationTarget.Global);

          // Re-validate all open documents
          vscode.workspace.textDocuments.forEach(updateDiagnostics);

          vscode.window.showInformationMessage(
            `Switched to Octopus ${selectedVersion.version} version`
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to switch to Octopus ${selectedVersion.version} version`
          );
        }
      }
    }, "Switch version command");
  });
}

module.exports = {
  registerSwitchVersionCommand,
};
