const { safeExecute, log } = require("./logger");

/**
 * Predefined constants list (consistent with tmLanguage.json)
 */
const PREDEFINED_CONSTANTS = [
  "pi", "e", "i", "angstrom", "pm", "picometer", "nm", "nanometer",
  "ry", "rydberg", "eV", "electronvolt", "invcm", "kelvin", "kjoule_mol",
  "kcal_mol", "as", "attosecond", "fs", "femtosecond", "ps", "picosecond",
  "c", "x", "y", "z", "r", "w", "t"
];

/**
 * Mathematical functions list (consistent with tmLanguage.json)
 */
const MATH_FUNCTIONS = [
  "sqrt", "exp", "log", "ln", "log10", "logb", "logabs", "arg", "abs", "abs2",
  "conjg", "inv", "sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos",
  "atan", "acot", "asec", "acsc", "atan2", "sinh", "cosh", "tanh", "coth",
  "sech", "csch", "asinh", "acosh", "atanh", "acoth", "asech", "acsch",
  "min", "max", "step", "erf", "realpart", "imagpart", "floor", "ceiling"
];

/**
 * Check if value contains mathematical expressions
 * @param {string} value
 * @returns {boolean}
 */
function containsMathematicalExpression(value) {
  // Check if contains mathematical operators
  if (/[+\-*\/^]/.test(value)) {
    return true;
  }

  // Check if contains predefined constants
  const constantRegex = new RegExp(`\\b(${PREDEFINED_CONSTANTS.join("|")})\\b`, "i");
  if (constantRegex.test(value)) {
    return true;
  }

  // Check if contains mathematical functions
  const functionRegex = new RegExp(`\\b(${MATH_FUNCTIONS.join("|")})\\s*\\(`, "i");
  if (functionRegex.test(value)) {
    return true;
  }

  // Check if contains complex number notation {real, imag}
  if (/\{\s*[^,}\s]+\s*,\s*[^,}\s]+\s*\}/.test(value)) {
    return true;
  }

  return false;
}

/**
 * Validate variable value
 * @param {string} variableName
 * @param {string} value
 * @param {Object} variables Variable collection
 * @returns {object|null} {isValid, message, suggestion}
 */
function validateVariableValue(variableName, value, variables) {
  return safeExecute(() => {
    const variable = variables[variableName];

    // If variable doesn't exist, return null indicating no validation needed
    if (!variable) {
      return null;
    }

    const cleanValue = value.replace(/['"]/g, ""); // Remove quotes

    // Check if has predefined options
    if (variable.Options && variable.Options.length > 0) {
      const validOptions = variable.Options.map((opt) => opt.Name.toLowerCase());
      const validValues = variable.Options.map((opt) => opt.Value.toLowerCase());

      // Support plus-connected options (e.g., "lda_x + lda_c_pz_mod")
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
            message: `Invalid options: ${invalidParts.join(", ")}`,
            suggestion: `Valid values: ${variable.Options
              .map((opt) => opt.Name)
              .slice(0, 10)
              .join(", ")}${variable.Options.length > 10 ? "..." : ""}`,
          };
          log(`Validation failed: ${errorResult.message}`, "WARN");
          return errorResult;
        }
      } else {
        // Single option validation
        if (
          !validOptions.includes(cleanValue.toLowerCase()) &&
          !validValues.includes(cleanValue.toLowerCase())
        ) {
          const errorResult = {
            isValid: false,
            message: `Invalid value '${cleanValue}'`,
            suggestion: `Valid values: ${variable.Options
              .map((opt) => opt.Name)
              .slice(0, 10)
              .join(", ")}${variable.Options.length > 10 ? "..." : ""}`,
          };
          log(`Validation failed: ${errorResult.message}`, "WARN");
          return errorResult;
        }
      }
      return { isValid: true };
    }

    // Validate value based on type
    switch (variable.Type) {
      case "integer":
        if (!/^-?\d+$/.test(cleanValue)) {
          const errorResult = {
            isValid: false,
            message: `'${cleanValue}' is not a valid integer`,
            suggestion: `Expected integer value, e.g.: ${variable.Default ? variable.Default[0] : "1"}`,
          };
          log(`Validation failed: ${errorResult.message}`, "WARN");
          return errorResult;
        }
        break;

      case "float":
      case "real":
        // If contains mathematical expression, consider it valid
        if (containsMathematicalExpression(cleanValue)) {
          return { isValid: true };
        }

        // Otherwise validate if it's pure numeric format
        if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleanValue)) {
          const errorResult = {
            isValid: false,
            message: `'${cleanValue}' is not a valid float or mathematical expression`,
            suggestion: `Expected float or mathematical expression, e.g.: ${variable.Default ? variable.Default[0] : "1.0"} or 3.5 * angstrom`,
          };
          log(`Validation failed: ${errorResult.message}`, "WARN");
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
            message: `'${cleanValue}' is not a valid logical value`,
            suggestion: "Valid values: true, false, yes, no",
          };
          log(`Validation failed: ${errorResult.message}`, "WARN");
          return errorResult;
        }
        break;

      case "string":
        // String types are usually valid
        break;
    }

    return { isValid: true };
  }, `Validate value for variable ${variableName}`, { isValid: false, message: "Error occurred during validation" });
}

module.exports = {
  validateVariableValue,
  containsMathematicalExpression,
  PREDEFINED_CONSTANTS,
  MATH_FUNCTIONS,
};
