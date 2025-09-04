const vscode = require("vscode");
const versionDetection = require("../version-detection");
const { getCurrentVersion, loadVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * 注册检测系统版本的命令
 * @param {Function} updateDiagnostics - 更新诊断的函数
 * @returns {vscode.Disposable} 命令的 disposable
 */
function registerDetectSystemVersionCommand(updateDiagnostics) {
  return vscode.commands.registerCommand("octopus.detectSystemVersion", async () => {
    return safeExecute(async () => {
      const currentVersion = getCurrentVersion(); // 动态获取当前版本
      vscode.window.showInformationMessage("正在检测系统安装的 Octopus 版本...");

      const systemVersion = await versionDetection.detectVersionFromSystem();

      if (systemVersion) {
        if (systemVersion !== currentVersion) {
          const action = await vscode.window.showInformationMessage(
            `检测到系统安装的 Octopus ${systemVersion} 版本，是否切换？`,
            "切换",
            "取消"
          );

          if (action === "切换" && loadVariables(systemVersion)) {
            // 更新配置
            const config = vscode.workspace.getConfiguration('octopus');
            await config.update('version', systemVersion, vscode.ConfigurationTarget.Workspace);

            // 重新验证所有打开的文档
            vscode.workspace.textDocuments.forEach(updateDiagnostics);

            vscode.window.showInformationMessage(
              `已切换到系统安装的 Octopus ${systemVersion} 版本`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            `系统安装的版本 Octopus ${systemVersion} 与当前版本一致`
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "无法检测到系统安装的 Octopus 版本。请确保 Octopus 已安装并在 PATH 环境变量中。"
        );
      }
    }, "检测系统版本命令");
  });
}

module.exports = {
  registerDetectSystemVersionCommand,
};
