const vscode = require("vscode");
const { getVariables, getCurrentVersion } = require("../utils/versionManager");
const { generateDocUrl } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");

/**
 * 注册显示所有可用变量的命令
 * @returns {vscode.Disposable} 命令的 disposable
 */
function registerShowVariablesCommand() {
  return vscode.commands.registerCommand("octopus.showVariables", () => {
    return safeExecute(() => {
      const variables = getVariables(); // 动态获取当前变量集合
      const currentVersion = getCurrentVersion(); // 动态获取当前版本

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

      quickPick.placeholder = `搜索 Octopus ${currentVersion} 变量...`;
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
    }, "显示变量命令");
  });
}

module.exports = {
  registerShowVariablesCommand,
};
