const { safeExecute } = require("./logger");
const { getCurrentVersion } = require("./versionManager");

/**
 * Parse variable assignment statement
 * @param {string} line
 * @returns {object|null} {variableName, value, startPos, endPos}
 */
function parseVariableAssignment(line) {
  return safeExecute(() => {
    // Match VariableName = value format
    // In Octopus, parts starting with # character are comments, need to exclude when parsing values
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!match) return null;

    const variableName = match[1].trim();
    let fullValue = match[2];

    // Check if there's an end-of-line comment (starting with # character)
    const commentIndex = fullValue.indexOf("#");
    const value = commentIndex !== -1 ? fullValue.substring(0, commentIndex).trim() : fullValue.trim();

    const startPos = line.indexOf(variableName);
    const valueStartPos = line.indexOf(value, startPos + variableName.length);

    const result = {
      variableName,
      value,
      varStartPos: startPos,
      varEndPos: startPos + variableName.length,
      valueStartPos,
      valueEndPos: valueStartPos + value.length,
    };

    return result;
  }, `Parse variable assignment statement: "${line}"`);
}

/**
 * Generate documentation URL based on variable's Section and Name
 * @param {string} section Section the variable belongs to
 * @param {string} name Variable name
 * @returns {string} Generated documentation URL
 */
function generateDocUrl(section, name) {
  if (!section || !name) {
    return null;
  }

  const currentVersion = getCurrentVersion();

  try {
    // Determine documentation version number based on current version (using major version)
    const docVersion = currentVersion.split(".")[0]; // Extract "14" from "14.1", "16" from "16.2"

    // Base URL - dynamically generated based on version
    const baseUrl = `https://octopus-code.org/documentation/${docVersion}/variables/`;

    // Process Section: replace :: with /, convert to lowercase, replace spaces with underscores
    const processedSection = section
      .replace(/::/g, "/")
      .toLowerCase()
      .replace(/\s+/g, "_");

    // Process Name: convert to lowercase
    const processedName = name.toLowerCase();

    // Concatenate complete URL
    const docUrl = `${baseUrl}${processedSection}/${processedName}/`;

    return docUrl;
  } catch (error) {
    console.error(`Error generating documentation URL (Section: ${section}, Name: ${name}):`, error);
    return null;
  }
}

module.exports = {
  parseVariableAssignment,
  generateDocUrl,
};
