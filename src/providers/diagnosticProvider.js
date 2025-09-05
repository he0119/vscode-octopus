const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");
const { parseVariableAssignment } = require("../utils/parser");
const { validateVariableValue } = require("../utils/validator");

/**
 * Register diagnostic provider
 * @returns {Object} Object containing diagnostic collection and update diagnostics function
 */
function registerDiagnosticProvider() {
  // Create diagnostic collection
  const diagnosticCollection = vscode.languages.createDiagnosticCollection("octopus");

  /**
   * Create diagnostic information
   * @param {vscode.TextDocument} document
   * @returns {vscode.Diagnostic[]}
   */
  function createDiagnostics(document) {
    return safeExecute(() => {
      const diagnostics = [];
      const variables = getVariables(); // Dynamically get current variable set

      for (let i = 0; i < document.lineCount; i++) {
        const processLine = () => {
          const line = document.lineAt(i);
          const lineText = line.text;

          // Skip comment lines and empty lines
          if (
            lineText.trim().startsWith("-") ||
            lineText.trim().startsWith("#") ||
            !lineText.trim()
          ) {
            return;
          }

          // Skip block definition lines
          if (lineText.trim().startsWith("%")) {
            return;
          }

          const assignment = parseVariableAssignment(lineText);
          if (!assignment) return;

          const validation = validateVariableValue(
            assignment.variableName,
            assignment.value,
            variables
          );

          // Only add diagnostics when variable exists and validation fails
          if (validation && !validation.isValid) {
            // Variable value error
            const range = new vscode.Range(
              new vscode.Position(i, assignment.valueStartPos),
              new vscode.Position(i, assignment.valueEndPos)
            );

            const diagnostic = new vscode.Diagnostic(
              range,
              validation.message +
              (validation.suggestion ? ` (${validation.suggestion})` : ""),
              vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = "octopus";
            diagnostics.push(diagnostic);
          }
        };

        safeExecute(processLine, `Processing line ${i + 1}`);
      }

      return diagnostics;
    }, "Create diagnostic information", []);
  }

  /**
   * Update diagnostic information
   * @param {vscode.TextDocument} document
   */
  function updateDiagnostics(document) {
    return safeExecute(() => {
      // Only validate Octopus file types
      if (document.languageId !== "octopus") {
        // If not an Octopus file, only clear diagnostics and log when existing diagnostics exist
        const existingDiagnostics = diagnosticCollection.get(document.uri);
        if (existingDiagnostics && existingDiagnostics.length > 0) {
          diagnosticCollection.delete(document.uri);
          console.log(`Clear diagnostic information for non-Octopus file: ${document.fileName}`);
        }
        return;
      }

      console.log(`Update diagnostic information: ${document.fileName}`);
      const diagnostics = createDiagnostics(document);
      diagnosticCollection.set(document.uri, diagnostics);
    }, "Update diagnostic information");
  }

  return {
    diagnosticCollection,
    updateDiagnostics,
  };
}

module.exports = {
  registerDiagnosticProvider,
};
