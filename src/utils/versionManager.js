const path = require("path");
const { log, logError } = require("./logger");

// Version-related variables
let currentVersion = "14.1";
let variables = {};

/**
 * Load variable information for specified version
 * @param {string} version Version number
 * @returns {boolean} Whether loading was successful
 */
function loadVariables(version) {
  try {
    const varInfoPath = path.join(__dirname, `../varinfo-${version}.json`);
    variables = require(varInfoPath);
    currentVersion = version;
    log(`Successfully loaded Octopus ${version} version variable information`, "INFO");
    return true;
  } catch (error) {
    logError(error, `Failed to load Octopus ${version} version variable information`);
    return false;
  }
}

/**
 * Get current version
 * @returns {string} Current version number
 */
function getCurrentVersion() {
  return currentVersion;
}

/**
 * Get variable collection
 * @returns {Object} Variable collection
 */
function getVariables() {
  return variables;
}

/**
 * Get version setting from configuration
 * @returns {string} Configured version number
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
