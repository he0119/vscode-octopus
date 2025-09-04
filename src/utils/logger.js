const vscode = require("vscode");

// 创建输出通道
let outputChannel;

/**
 * 获取输出通道实例
 * @returns {vscode.OutputChannel}
 */
function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Octopus");
  }
  return outputChannel;
}

/**
 * 输出日志信息
 * @param {string} message 日志消息
 * @param {string} level 日志级别 (INFO, WARN, ERROR)
 */
function log(message, level = "INFO") {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  const channel = getOutputChannel();
  channel.appendLine(formattedMessage);

  // 根据日志级别决定是否在控制台也输出
  if (level === "ERROR") {
    console.error(formattedMessage);
  } else if (level === "WARN") {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * 输出错误信息并显示通知
 * @param {Error|string} error 错误对象或错误消息
 * @param {string} context 错误发生的上下文
 */
function logError(error, context = "") {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : "";

  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
  log(fullMessage, "ERROR");

  if (stack) {
    log(`堆栈信息: ${stack}`, "ERROR");
  }

  // 显示用户友好的错误通知
  vscode.window.showErrorMessage(`Octopus 扩展错误: ${errorMessage}`);
}

/**
 * 安全执行函数，包含异常处理
 * @param {Function} fn 要执行的函数
 * @param {string} context 执行上下文描述
 * @param {any} defaultValue 出错时返回的默认值，默认为 null
 * @returns {any} 函数执行结果，如果出错则返回 defaultValue
 */
function safeExecute(fn, context, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return defaultValue;
  }
}

/**
 * 销毁输出通道
 */
function dispose() {
  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = null;
  }
}

module.exports = {
  getOutputChannel,
  log,
  logError,
  safeExecute,
  dispose,
};