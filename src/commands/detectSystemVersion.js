const vscode = require("vscode");
const versionDetection = require("../version-detection");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * Register system version detection command
 * @param {Function} updateDiagnostics - Function to update diagnostics
 * @returns {vscode.Disposable} Command disposable
 */
function registerDetectSystemVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.detectSystemVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // Dynamically get current version
      vscode.window.showInformationMessage("Detecting system-installed Octopus version...");

      const systemVersion = await versionDetection.detectVersionFromSystem();

      if (systemVersion) {
        if (systemVersion !== currentVersion) {
          const action = await vscode.window.showInformationMessage(
            `Detected system-installed Octopus ${systemVersion} version, switch to it?`,
            "Switch",
            "Cancel"
          );

          if (action === "Switch" && loadVariables(systemVersion)) {
            // Update configuration
            const config = vscode.workspace.getConfiguration('octopus');
            await config.update('version', systemVersion, vscode.ConfigurationTarget.Workspace);

            // Re-validate all open documents
            vscode.workspace.textDocuments.forEach(updateDiagnostics);

            vscode.window.showInformationMessage(
              `Switched to system-installed Octopus ${systemVersion} version`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            `System-installed version Octopus ${systemVersion} matches current version`
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "Unable to detect system-installed Octopus version. Please ensure Octopus is installed and in the PATH environment variable."
        );
      }
    }, "Detect system version command");
  });
}

module.exports = {
  registerDetectSystemVersionCommand,
};
