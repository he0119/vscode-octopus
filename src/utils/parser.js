const { safeExecute } = require("./logger");
const { getCurrentVersion } = require("./versionManager");

/**
 * 解析变量赋值语句
 * @param {string} line
 * @returns {object|null} {variableName, value, startPos, endPos}
 */
function parseVariableAssignment(line) {
  return safeExecute(() => {
    // 匹配 VariableName = value 格式
    // 在 Octopus 中，# 字符开始的部分是注释，需要在解析值时排除
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!match) return null;

    const variableName = match[1].trim();
    let fullValue = match[2];

    // 检查是否有行末注释（# 字符开始）
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
  }, `解析变量赋值语句: "${line}"`);
}

/**
 * 根据变量的 Section 和 Name 生成文档 URL
 * @param {string} section 变量所属的章节
 * @param {string} name 变量名称
 * @returns {string} 生成的文档 URL
 */
function generateDocUrl(section, name) {
  if (!section || !name) {
    return null;
  }

  const currentVersion = getCurrentVersion();

  try {
    // 根据当前版本确定文档版本号（使用大版本号）
    const docVersion = currentVersion.split(".")[0]; // 从 "14.1" 提取 "14"，从 "16.2" 提取 "16"

    // 基础 URL - 根据版本动态生成
    const baseUrl = `https://octopus-code.org/documentation/${docVersion}/variables/`;

    // 处理 Section：将 :: 替换为 /，转为小写，空格替换为下划线
    const processedSection = section
      .replace(/::/g, "/")
      .toLowerCase()
      .replace(/\s+/g, "_");

    // 处理 Name：转为小写
    const processedName = name.toLowerCase();

    // 拼接完整 URL
    const docUrl = `${baseUrl}${processedSection}/${processedName}/`;

    return docUrl;
  } catch (error) {
    console.error(`生成文档 URL 时出错 (Section: ${section}, Name: ${name}):`, error);
    return null;
  }
}

module.exports = {
  parseVariableAssignment,
  generateDocUrl,
};
