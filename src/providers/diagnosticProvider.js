const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");
const { parseVariableAssignment } = require("../utils/parser");
const { validateVariableValue } = require("../utils/validator");

/**
 * 注册诊断提供者
 * @returns {Object} 包含诊断集合和更新诊断函数的对象
 */
function registerDiagnosticProvider() {
  // 创建诊断集合
  const diagnosticCollection = vscode.languages.createDiagnosticCollection("octopus");

  /**
   * 创建诊断信息
   * @param {vscode.TextDocument} document
   * @returns {vscode.Diagnostic[]}
   */
  function createDiagnostics(document) {
    return safeExecute(() => {
      const diagnostics = [];
      const variables = getVariables(); // 动态获取当前变量集合

      for (let i = 0; i < document.lineCount; i++) {
        const processLine = () => {
          const line = document.lineAt(i);
          const lineText = line.text;

          // 跳过注释行和空行
          if (
            lineText.trim().startsWith("-") ||
            lineText.trim().startsWith("#") ||
            !lineText.trim()
          ) {
            return;
          }

          // 跳过块定义行
          if (lineText.trim().startsWith("%")) {
            return;
          }

          const assignment = parseVariableAssignment(lineText);
          if (!assignment) return;

          const validation = validateVariableValue(
            assignment.variableName,
            assignment.value,
            variables
          );

          // 只有在变量存在且验证失败时才添加诊断
          if (validation && !validation.isValid) {
            // 变量值错误
            const range = new vscode.Range(
              new vscode.Position(i, assignment.valueStartPos),
              new vscode.Position(i, assignment.valueEndPos)
            );

            const diagnostic = new vscode.Diagnostic(
              range,
              validation.message +
              (validation.suggestion ? ` (${validation.suggestion})` : ""),
              vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = "octopus";
            diagnostics.push(diagnostic);
          }
        };

        safeExecute(processLine, `处理第 ${i + 1} 行`);
      }

      return diagnostics;
    }, "创建诊断信息", []);
  }

  /**
   * 更新诊断信息
   * @param {vscode.TextDocument} document
   */
  function updateDiagnostics(document) {
    return safeExecute(() => {
      // 只对 Octopus 文件类型进行验证
      if (document.languageId !== "octopus") {
        // 如果不是 Octopus 文件，且存在诊断信息时才清除并记录日志
        const existingDiagnostics = diagnosticCollection.get(document.uri);
        if (existingDiagnostics && existingDiagnostics.length > 0) {
          diagnosticCollection.delete(document.uri);
          console.log(`清除非 Octopus 文件的诊断信息: ${document.fileName}`);
        }
        return;
      }

      console.log(`更新诊断信息: ${document.fileName}`);
      const diagnostics = createDiagnostics(document);
      diagnosticCollection.set(document.uri, diagnostics);
    }, "更新诊断信息");
  }

  return {
    diagnosticCollection,
    updateDiagnostics,
  };
}

module.exports = {
  registerDiagnosticProvider,
};
