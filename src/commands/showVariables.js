const vscode = require("vscode");
const { getVariables, getCurrentVersion } = require("../utils/versionManager");
const { generateDocUrl } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");

/**
 * Register command to show all available variables
 * @returns {vscode.Disposable} Command disposable
 */
function registerShowVariablesCommand() {
  return vscode.commands.registerCommand("octopus.showVariables", () => {
    return safeExecute(() => {
      const variables = getVariables(); // Dynamically get current variable collection
      const currentVersion = getCurrentVersion(); // Dynamically get current version

      const quickPick = vscode.window.createQuickPick();
      quickPick.items = Object.keys(variables).map((name) => {
        const variable = variables[name];
        const description = Array.isArray(variable.Description)
          ? variable.Description.join(" ").substring(0, 100) + "..."
          : variable.Description
            ? variable.Description.substring(0, 100) + "..."
            : "";

        return {
          label: variable.Name || name,
          description: variable.Section,
          detail: description,
        };
      });

      quickPick.placeholder = `Search Octopus ${currentVersion} variables...`;
      quickPick.matchOnDescription = true;
      quickPick.matchOnDetail = true;

      quickPick.onDidChangeSelection(([item]) => {
        if (item) {
          const variable = variables[Object.keys(variables).find(key =>
            variables[key].Name === item.label || key === item.label
          )];
          if (variable) {
            const docUrl = variable.docUrl || generateDocUrl(variable.Section, variable.Name);
            if (docUrl) {
              vscode.env.openExternal(vscode.Uri.parse(docUrl));
            }
          }
          quickPick.hide();
        }
      });

      quickPick.show();
    }, "Show variables command");
  });
}

module.exports = {
  registerShowVariablesCommand,
};
