const vscode = require("vscode");
const { safeExecute } = require("../utils/logger");

/**
 * Register toggle inlay hints command
 * @returns {vscode.Disposable} Registered command
 */
function registerToggleInlayHintsCommand() {
    return safeExecute(() => {
        return vscode.commands.registerCommand("octopus.toggleInlayHints", async () => {
            try {
                const config = vscode.workspace.getConfiguration("octopus");
                const currentEnabled = config.get("inlayHints.enabled", true);

                await config.update(
                    "inlayHints.enabled",
                    !currentEnabled,
                    vscode.ConfigurationTarget.Global
                );

                const status = !currentEnabled ? "enabled" : "disabled";
                vscode.window.showInformationMessage(`Octopus Inlay Hints ${status}`);

                // Refresh inlay hints
                vscode.commands.executeCommand("vscode.executeInlayHintProvider");
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to toggle Inlay Hints: ${error.message}`);
            }
        });
    }, "Register toggle inlay hints command");
}

module.exports = {
    registerToggleInlayHintsCommand,
};
