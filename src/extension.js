const vscode = require("vscode");

// 导入模块
const { loadVariables, getCurrentVersion, getConfiguredVersion } = require("./utils/versionManager");
const { log, logError, safeExecute, dispose } = require("./utils/logger");

// 导入命令
const { registerShowVariablesCommand } = require("./commands/showVariables");
const { registerSwitchVersionCommand } = require("./commands/switchVersion");
const { registerAutoDetectVersionCommand } = require("./commands/autoDetectVersion");
const { registerDetectSystemVersionCommand } = require("./commands/detectSystemVersion");

// 导入提供者
const { registerHoverProvider } = require("./providers/hoverProvider");
const { registerCompletionProvider } = require("./providers/completionProvider");
const { registerDiagnosticProvider } = require("./providers/diagnosticProvider");
const { registerCodeActionProvider } = require("./providers/codeActionProvider");

/**
 * 激活插件
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    log("Octopus 插件开始激活", "INFO");

    // 初始化：加载配置的版本
    const configuredVersion = getConfiguredVersion();
    if (!loadVariables(configuredVersion)) {
      // 如果加载失败，尝试加载默认版本
      if (!loadVariables("14.1")) {
        throw new Error("无法加载任何版本的变量信息");
      }
    }

    // 注册诊断提供者（现在内部获取 variables 和工具函数）
    const { diagnosticCollection, updateDiagnostics } = registerDiagnosticProvider();

    // 监听文档变化
    const onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
      updateDiagnostics(event.document);
    });

    const onDocumentOpen = vscode.workspace.onDidOpenTextDocument((document) => {
      updateDiagnostics(document);
    });

    // 对当前打开的文档进行初始验证
    vscode.workspace.textDocuments.forEach(updateDiagnostics);

    // 注册提供者（现在内部获取所需参数）
    const hoverProvider = registerHoverProvider();

    const completionProvider = registerCompletionProvider();

    const codeActionProvider = registerCodeActionProvider();

    // 注册命令（现在内部获取所需参数）
    const showVariablesCommand = registerShowVariablesCommand();

    const switchVersionCommand = registerSwitchVersionCommand(updateDiagnostics);

    const autoDetectVersionCommand = registerAutoDetectVersionCommand(updateDiagnostics);

    const detectSystemVersionCommand = registerDetectSystemVersionCommand(updateDiagnostics);

    // 监听配置变化
    const onConfigurationChange = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('octopus.version')) {
        const newVersion = getConfiguredVersion();
        const currentVersion = getCurrentVersion();
        if (newVersion !== currentVersion) {
          if (loadVariables(newVersion)) {
            // 重新验证所有打开的文档
            vscode.workspace.textDocuments.forEach(updateDiagnostics);
            vscode.window.showInformationMessage(
              `Octopus 版本已更新为 ${newVersion}`
            );
          }
        }
      }
    });

    // 将所有 disposables 添加到 context
    context.subscriptions.push(
      hoverProvider,
      showVariablesCommand,
      switchVersionCommand,
      autoDetectVersionCommand,
      detectSystemVersionCommand,
      completionProvider,
      codeActionProvider,
      diagnosticCollection,
      onDocumentChange,
      onDocumentOpen,
      onConfigurationChange
    );

    log("Octopus 插件激活完成", "INFO");

    // 显示输出面板（可选）
    // require("./utils/logger").getOutputChannel().show();

  } catch (error) {
    logError(error, "激活插件时发生错误");
    vscode.window.showErrorMessage("Octopus 插件激活失败，请查看输出面板获取详细信息。");
  }
}

/**
 * 停用插件
 */
function deactivate() {
  return safeExecute(() => {
    log("Octopus 插件开始停用", "INFO");
    dispose();
    log("Octopus 插件已停用", "INFO");
  }, "停用插件");
}

module.exports = {
  activate,
  deactivate,
};
