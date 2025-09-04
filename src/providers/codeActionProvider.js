const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");
const { parseVariableAssignment } = require("../utils/parser");

/**
 * 注册代码操作提供者（快速修复）
 * @returns {vscode.Disposable} 提供者的 disposable
 */
function registerCodeActionProvider() {
  return vscode.languages.registerCodeActionsProvider(
    "octopus",
    {
      provideCodeActions(document, range, context, token) {
        return safeExecute(() => {
          const variables = getVariables(); // 动态获取当前变量集合
          const codeActions = [];

          // 遍历当前范围内的诊断
          context.diagnostics.forEach((diagnostic) => {
            if (diagnostic.source === "octopus") {
              const line = document.lineAt(diagnostic.range.start.line);
              const assignment = parseVariableAssignment(line.text);

              if (assignment) {
                // 只处理无效变量值的情况（变量存在但值无效）
                const variable = variables[assignment.variableName];
                if (variable) {
                  if (variable.Options && variable.Options.length > 0) {
                    // 提供前几个单个选项
                    variable.Options.slice(0, 5).forEach((option) => {
                      const action = new vscode.CodeAction(
                        `设置为 '${option.Name}'`,
                        vscode.CodeActionKind.QuickFix
                      );

                      action.edit = new vscode.WorkspaceEdit();
                      action.edit.replace(
                        document.uri,
                        new vscode.Range(
                          new vscode.Position(
                            diagnostic.range.start.line,
                            assignment.valueStartPos
                          ),
                          new vscode.Position(
                            diagnostic.range.start.line,
                            assignment.valueEndPos
                          )
                        ),
                        option.Name
                      );

                      action.diagnostics = [diagnostic];
                      codeActions.push(action);
                    });
                  } else if (variable.Default) {
                    // 提供默认值
                    const defaultValue = Array.isArray(variable.Default) ? variable.Default[0] : variable.Default;
                    const action = new vscode.CodeAction(
                      `设置为默认值 '${defaultValue}'`,
                      vscode.CodeActionKind.QuickFix
                    );

                    action.edit = new vscode.WorkspaceEdit();
                    action.edit.replace(
                      document.uri,
                      new vscode.Range(
                        new vscode.Position(
                          diagnostic.range.start.line,
                          assignment.valueStartPos
                        ),
                        new vscode.Position(
                          diagnostic.range.start.line,
                          assignment.valueEndPos
                        )
                      ),
                      defaultValue
                    );

                    action.diagnostics = [diagnostic];
                    codeActions.push(action);
                  }
                }
              }
            }
          });

          return codeActions;
        }, "代码操作");
      },
    }
  );
}

module.exports = {
  registerCodeActionProvider,
};
