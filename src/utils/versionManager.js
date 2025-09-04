const path = require("path");
const { log, logError } = require("./logger");

// 版本相关变量
let currentVersion = "14.1";
let variables = {};

/**
 * 加载指定版本的变量信息
 * @param {string} version 版本号
 * @returns {boolean} 是否加载成功
 */
function loadVariables(version) {
  try {
    const varInfoPath = path.join(__dirname, `../varinfo-${version}.json`);
    variables = require(varInfoPath);
    currentVersion = version;
    log(`成功加载 Octopus ${version} 版本的变量信息`, "INFO");
    return true;
  } catch (error) {
    logError(error, `加载 Octopus ${version} 版本变量信息失败`);
    return false;
  }
}

/**
 * 获取当前版本
 * @returns {string} 当前版本号
 */
function getCurrentVersion() {
  return currentVersion;
}

/**
 * 获取变量集合
 * @returns {Object} 变量集合
 */
function getVariables() {
  return variables;
}

/**
 * 获取配置中的版本设置
 * @returns {string} 配置的版本号
 */
function getConfiguredVersion() {
  const vscode = require("vscode");
  const config = vscode.workspace.getConfiguration("octopus");
  return config.get("version", "14.1");
}

module.exports = {
  loadVariables,
  getCurrentVersion,
  getVariables,
  getConfiguredVersion,
};