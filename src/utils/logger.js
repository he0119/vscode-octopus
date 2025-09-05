const vscode = require("vscode");

// Create output channel
let outputChannel;

/**
 * Get output channel instance
 * @returns {vscode.OutputChannel}
 */
function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Octopus");
  }
  return outputChannel;
}

/**
 * Output log message
 * @param {string} message Log message
 * @param {string} level Log level (INFO, WARN, ERROR)
 */
function log(message, level = "INFO") {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  const channel = getOutputChannel();
  channel.appendLine(formattedMessage);

  // Decide whether to output to console based on log level
  if (level === "ERROR") {
    console.error(formattedMessage);
  } else if (level === "WARN") {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * Output error message and show notification
 * @param {Error|string} error Error object or error message
 * @param {string} context Context where the error occurred
 */
function logError(error, context = "") {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : "";

  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
  log(fullMessage, "ERROR");

  if (stack) {
    log(`Stack trace: ${stack}`, "ERROR");
  }

  // Show user-friendly error notification
  vscode.window.showErrorMessage(`Octopus extension error: ${errorMessage}`);
}

/**
 * Safely execute function with exception handling
 * @param {Function} fn Function to execute
 * @param {string} context Execution context description
 * @param {any} defaultValue Default value to return on error, defaults to null
 * @returns {any} Function execution result, returns defaultValue if error occurs
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
 * Dispose output channel
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
