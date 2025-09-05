const vscode = require("vscode");

// Import modules
const { loadVariables, getCurrentVersion, getConfiguredVersion } = require("./utils/versionManager");
const { log, logError, safeExecute, dispose } = require("./utils/logger");

// Import commands
const { registerShowVariablesCommand } = require("./commands/showVariables");
const { registerSwitchVersionCommand } = require("./commands/switchVersion");
const { registerAutoDetectVersionCommand } = require("./commands/autoDetectVersion");
const { registerDetectSystemVersionCommand } = require("./commands/detectSystemVersion");
const { registerToggleInlayHintsCommand } = require("./commands/toggleInlayHints");

// Import providers
const { registerHoverProvider } = require("./providers/hoverProvider");
const { registerCompletionProvider } = require("./providers/completionProvider");
const { registerDiagnosticProvider } = require("./providers/diagnosticProvider");
const { registerCodeActionProvider } = require("./providers/codeActionProvider");
const { registerInlayHintsProvider } = require("./providers/inlayHintsProvider");

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    log("Octopus extension activation started", "INFO");

    // Initialize: Load configured version
    const configuredVersion = getConfiguredVersion();
    if (!loadVariables(configuredVersion)) {
      // If loading fails, try to load default version
      if (!loadVariables("14.1")) {
        throw new Error("Unable to load variable information for any version");
      }
    }

    // Register diagnostic provider (now internally gets variables and utility functions)
    const { diagnosticCollection, updateDiagnostics } = registerDiagnosticProvider();

    // Listen for document changes
    const onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
      updateDiagnostics(event.document);
    });

    const onDocumentOpen = vscode.workspace.onDidOpenTextDocument((document) => {
      updateDiagnostics(document);
    });

    // Perform initial validation on currently open documents
    vscode.workspace.textDocuments.forEach(updateDiagnostics);

    // Register providers (now internally get required parameters)
    const hoverProvider = registerHoverProvider();

    const completionProvider = registerCompletionProvider();

    const codeActionProvider = registerCodeActionProvider();

    const inlayHintsProvider = registerInlayHintsProvider();

    // Register commands (now internally get required parameters)
    const showVariablesCommand = registerShowVariablesCommand();

    const switchVersionCommand = registerSwitchVersionCommand(updateDiagnostics);

    const autoDetectVersionCommand = registerAutoDetectVersionCommand(updateDiagnostics);

    const detectSystemVersionCommand = registerDetectSystemVersionCommand(updateDiagnostics);

    const toggleInlayHintsCommand = registerToggleInlayHintsCommand();

    // Listen for configuration changes
    const onConfigurationChange = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('octopus.version')) {
        const newVersion = getConfiguredVersion();
        const currentVersion = getCurrentVersion();
        if (newVersion !== currentVersion) {
          if (loadVariables(newVersion)) {
            // Re-validate all open documents
            vscode.workspace.textDocuments.forEach(updateDiagnostics);
            // Trigger inlay hints update
            vscode.commands.executeCommand('vscode.executeInlayHintProvider');
            vscode.window.showInformationMessage(
              `Octopus version updated to ${newVersion}`
            );
          }
        }
      }
    });

    // Add all disposables to context
    context.subscriptions.push(
      hoverProvider,
      showVariablesCommand,
      switchVersionCommand,
      autoDetectVersionCommand,
      detectSystemVersionCommand,
      toggleInlayHintsCommand,
      completionProvider,
      codeActionProvider,
      inlayHintsProvider,
      diagnosticCollection,
      onDocumentChange,
      onDocumentOpen,
      onConfigurationChange
    );

    log("Octopus extension activation completed", "INFO");

    // Show output panel (optional)
    // require("./utils/logger").getOutputChannel().show();

  } catch (error) {
    logError(error, "Error occurred during extension activation");
    vscode.window.showErrorMessage("Octopus extension activation failed. Please check the output panel for detailed information.");
  }
}

/**
 * Deactivate the extension
 */
function deactivate() {
  return safeExecute(() => {
    log("Octopus extension deactivation started", "INFO");
    dispose();
    log("Octopus extension deactivated", "INFO");
  }, "Deactivate extension");
}

module.exports = {
  activate,
  deactivate,
};
