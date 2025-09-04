const vscode = require("vscode");
const versionDetection = require("../version-detection");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * 注册自动检测版本的命令
 * @param {Function} updateDiagnostics - 更新诊断的函数
 * @returns {vscode.Disposable} 命令的 disposable
 */
function registerAutoDetectVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.autoDetectVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // 动态获取当前版本
      vscode.window.showInformationMessage("正在检测 Octopus 版本...");

      const detectedVersion = await versionDetection.autoDetectVersion();

      if (detectedVersion) {
        if (detectedVersion !== currentVersion) {
          const action = await vscode.window.showInformationMessage(
            `检测到 Octopus ${detectedVersion} 版本，是否切换？`,
            "切换",
            "取消"
          );

          if (action === "切换" && loadVariables(detectedVersion)) {
            // 更新配置
            const config = vscode.workspace.getConfiguration('octopus');
            await config.update('version', detectedVersion, vscode.ConfigurationTarget.Workspace);

            // 重新验证所有打开的文档
            vscode.workspace.textDocuments.forEach(updateDiagnostics);

            vscode.window.showInformationMessage(
              `已切换到检测的 Octopus ${detectedVersion} 版本`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            `检测到当前版本 Octopus ${detectedVersion}，无需切换`
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "无法自动检测 Octopus 版本，请手动选择版本"
        );
      }
    }, "自动检测版本命令");
  });
}

module.exports = {
  registerAutoDetectVersionCommand,
};
