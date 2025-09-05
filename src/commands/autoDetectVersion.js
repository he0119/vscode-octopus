const vscode = require("vscode");
const versionDetection = require("../version-detection");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * Register auto version detection command
 * @param {Function} updateDiagnostics - Function to update diagnostics
 * @returns {vscode.Disposable} Command disposable
 */
function registerAutoDetectVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.autoDetectVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // Dynamically get current version
      vscode.window.showInformationMessage("Detecting Octopus version...");

      const detectedVersion = await versionDetection.autoDetectVersion();

      if (detectedVersion) {
        if (detectedVersion !== currentVersion) {
          const action = await vscode.window.showInformationMessage(
            `Detected Octopus ${detectedVersion} version, switch to it?`,
            "Switch",
            "Cancel"
          );

          if (action === "Switch" && loadVariables(detectedVersion)) {
            // Update configuration
            const config = vscode.workspace.getConfiguration('octopus');
            await config.update('version', detectedVersion, vscode.ConfigurationTarget.Workspace);

            // Re-validate all open documents
            vscode.workspace.textDocuments.forEach(updateDiagnostics);

            vscode.window.showInformationMessage(
              `Switched to detected Octopus ${detectedVersion} version`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            `Detected current version Octopus ${detectedVersion}, no need to switch`
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "Unable to auto-detect Octopus version, please manually select version"
        );
      }
    }, "Auto detect version command");
  });
}

module.exports = {
  registerAutoDetectVersionCommand,
};
