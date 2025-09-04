const vscode = require("vscode");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * 注册切换版本的命令
 * @param {Function} updateDiagnostics - 更新诊断的函数
 * @returns {vscode.Disposable} 命令的 disposable
 */
function registerSwitchVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.switchVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // 动态获取当前版本
      const versions = ["14.1", "16.2"];
      const selectedVersion = await vscode.window.showQuickPick(
        versions.map(version => ({
          label: `Octopus ${version}`,
          description: version === currentVersion ? "(当前版本)" : "",
          version: version
        })),
        {
          placeHolder: `选择 Octopus 版本 (当前: ${currentVersion})`,
          canPickMany: false
        }
      );

      if (selectedVersion && selectedVersion.version !== currentVersion) {
        if (loadVariables(selectedVersion.version)) {
          // 更新配置
          const config = vscode.workspace.getConfiguration('octopus');
          await config.update('version', selectedVersion.version, vscode.ConfigurationTarget.Global);

          // 重新验证所有打开的文档
          vscode.workspace.textDocuments.forEach(updateDiagnostics);

          vscode.window.showInformationMessage(
            `已切换到 Octopus ${selectedVersion.version} 版本`
          );
        } else {
          vscode.window.showErrorMessage(
            `切换到 Octopus ${selectedVersion.version} 版本失败`
          );
        }
      }
    }, "切换版本命令");
  });
}

module.exports = {
  registerSwitchVersionCommand,
};
