const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");
const { parseVariableAssignment } = require("../utils/parser");

/**
 * Register code action provider (quick fixes)
 * @returns {vscode.Disposable} Provider disposable
 */
function registerCodeActionProvider() {
  return vscode.languages.registerCodeActionsProvider(
    "octopus",
    {
      provideCodeActions(document, range, context, token) {
        return safeExecute(() => {
          const variables = getVariables(); // Dynamically get current variable collection
          const codeActions = [];

          // Iterate through diagnostics in current range
          context.diagnostics.forEach((diagnostic) => {
            if (diagnostic.source === "octopus") {
              const line = document.lineAt(diagnostic.range.start.line);
              const assignment = parseVariableAssignment(line.text);

              if (assignment) {
                // Only handle cases of invalid variable values (variable exists but value is invalid)
                const variable = variables[assignment.variableName];
                if (variable) {
                  if (variable.Options && variable.Options.length > 0) {
                    // Provide first few single options
                    variable.Options.slice(0, 5).forEach((option) => {
                      const action = new vscode.CodeAction(
                        `Set to '${option.Name}'`,
                        vscode.CodeActionKind.QuickFix
                      );

                      action.edit = new vscode.WorkspaceEdit();
                      action.edit.replace(
                        document.uri,
                        new vscode.Range(
                          new vscode.Position(
                            diagnostic.range.start.line,
                            assignment.valueStartPos
                          ),
                          new vscode.Position(
                            diagnostic.range.start.line,
                            assignment.valueEndPos
                          )
                        ),
                        option.Name
                      );

                      action.diagnostics = [diagnostic];
                      codeActions.push(action);
                    });
                  } else if (variable.Default) {
                    // Provide default value
                    const defaultValue = Array.isArray(variable.Default) ? variable.Default[0] : variable.Default;
                    const action = new vscode.CodeAction(
                      `Set to default value '${defaultValue}'`,
                      vscode.CodeActionKind.QuickFix
                    );

                    action.edit = new vscode.WorkspaceEdit();
                    action.edit.replace(
                      document.uri,
                      new vscode.Range(
                        new vscode.Position(
                          diagnostic.range.start.line,
                          assignment.valueStartPos
                        ),
                        new vscode.Position(
                          diagnostic.range.start.line,
                          assignment.valueEndPos
                        )
                      ),
                      defaultValue
                    );

                    action.diagnostics = [diagnostic];
                    codeActions.push(action);
                  }
                }
              }
            }
          });

          return codeActions;
        }, "Code actions");
      },
    }
  );
}

module.exports = {
  registerCodeActionProvider,
};
