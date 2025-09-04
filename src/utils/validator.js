const { safeExecute, log } = require("./logger");

/**
 * 预定义常量列表（与 tmLanguage.json 中保持一致）
 */
const PREDEFINED_CONSTANTS = [
  "pi", "e", "i", "angstrom", "pm", "picometer", "nm", "nanometer",
  "ry", "rydberg", "eV", "electronvolt", "invcm", "kelvin", "kjoule_mol",
  "kcal_mol", "as", "attosecond", "fs", "femtosecond", "ps", "picosecond",
  "c", "x", "y", "z", "r", "w", "t"
];

/**
 * 数学函数列表（与 tmLanguage.json 中保持一致）
 */
const MATH_FUNCTIONS = [
  "sqrt", "exp", "log", "ln", "log10", "logb", "logabs", "arg", "abs", "abs2",
  "conjg", "inv", "sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos",
  "atan", "acot", "asec", "acsc", "atan2", "sinh", "cosh", "tanh", "coth",
  "sech", "csch", "asinh", "acosh", "atanh", "acoth", "asech", "acsch",
  "min", "max", "step", "erf", "realpart", "imagpart", "floor", "ceiling"
];

/**
 * 检查值是否包含数学表达式
 * @param {string} value
 * @returns {boolean}
 */
function containsMathematicalExpression(value) {
  // 检查是否包含数学运算符
  if (/[+\-*\/^]/.test(value)) {
    return true;
  }

  // 检查是否包含预定义常量
  const constantRegex = new RegExp(`\\b(${PREDEFINED_CONSTANTS.join("|")})\\b`, "i");
  if (constantRegex.test(value)) {
    return true;
  }

  // 检查是否包含数学函数
  const functionRegex = new RegExp(`\\b(${MATH_FUNCTIONS.join("|")})\\s*\\(`, "i");
  if (functionRegex.test(value)) {
    return true;
  }

  // 检查是否包含复数表示法 {real, imag}
  if (/\{\s*[^}]+\s*,\s*[^}]+\s*\}/.test(value)) {
    return true;
  }

  return false;
}

/**
 * 验证变量值
 * @param {string} variableName
 * @param {string} value
 * @param {Object} variables 变量集合
 * @returns {object|null} {isValid, message, suggestion}
 */
function validateVariableValue(variableName, value, variables) {
  return safeExecute(() => {
    const variable = variables[variableName];

    // 如果变量不存在，返回null表示无需验证
    if (!variable) {
      return null;
    }

    const cleanValue = value.replace(/['"]/g, ""); // 移除引号

    // 检查是否有预定义选项
    if (variable.Options && variable.Options.length > 0) {
      const validOptions = variable.Options.map((opt) => opt.Name.toLowerCase());
      const validValues = variable.Options.map((opt) => opt.Value.toLowerCase());

      // 支持加号连接的选项（如 "lda_x + lda_c_pz_mod"）
      if (cleanValue.includes("+")) {
        const parts = cleanValue
          .split("+")
          .map((part) => part.trim().toLowerCase());
        const allPartsValid = parts.every(
          (part) => validOptions.includes(part) || validValues.includes(part)
        );

        if (!allPartsValid) {
          const invalidParts = parts.filter(
            (part) => !validOptions.includes(part) && !validValues.includes(part)
          );
          const errorResult = {
            isValid: false,
            message: `无效的选项: ${invalidParts.join(", ")}`,
            suggestion: `可选值: ${variable.Options
              .map((opt) => opt.Name)
              .slice(0, 10)
              .join(", ")}${variable.Options.length > 10 ? "..." : ""}`,
          };
          log(`验证失败: ${errorResult.message}`, "WARN");
          return errorResult;
        }
      } else {
        // 单个选项验证
        if (
          !validOptions.includes(cleanValue.toLowerCase()) &&
          !validValues.includes(cleanValue.toLowerCase())
        ) {
          const errorResult = {
            isValid: false,
            message: `无效的值 '${cleanValue}'`,
            suggestion: `可选值: ${variable.Options
              .map((opt) => opt.Name)
              .slice(0, 10)
              .join(", ")}${variable.Options.length > 10 ? "..." : ""}`,
          };
          log(`验证失败: ${errorResult.message}`, "WARN");
          return errorResult;
        }
      }
      return { isValid: true };
    }

    // 根据类型验证值
    switch (variable.Type) {
      case "integer":
        if (!/^-?\d+$/.test(cleanValue)) {
          const errorResult = {
            isValid: false,
            message: `'${cleanValue}' 不是有效的整数`,
            suggestion: `期望整数值，如: ${variable.Default ? variable.Default[0] : "1"}`,
          };
          log(`验证失败: ${errorResult.message}`, "WARN");
          return errorResult;
        }
        break;

      case "float":
      case "real":
        // 如果包含数学表达式，则认为是有效的
        if (containsMathematicalExpression(cleanValue)) {
          return { isValid: true };
        }

        // 否则验证是否为纯数字格式
        if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleanValue)) {
          const errorResult = {
            isValid: false,
            message: `'${cleanValue}' 不是有效的浮点数或数学表达式`,
            suggestion: `期望浮点数或数学表达式，如: ${variable.Default ? variable.Default[0] : "1.0"} 或 3.5 * angstrom`,
          };
          log(`验证失败: ${errorResult.message}`, "WARN");
          return errorResult;
        }
        break;

      case "logical":
        if (
          !["true", "false", "yes", "no", ".true.", ".false.", "1", "0"].includes(
            cleanValue.toLowerCase()
          )
        ) {
          const errorResult = {
            isValid: false,
            message: `'${cleanValue}' 不是有效的逻辑值`,
            suggestion: "可选值: true, false, yes, no",
          };
          log(`验证失败: ${errorResult.message}`, "WARN");
          return errorResult;
        }
        break;

      case "string":
        // 字符串类型通常都是有效的
        break;
    }

    return { isValid: true };
  }, `验证变量 ${variableName} 的值`, { isValid: false, message: "验证过程中发生错误" });
}

module.exports = {
  validateVariableValue,
  containsMathematicalExpression,
  PREDEFINED_CONSTANTS,
  MATH_FUNCTIONS,
};