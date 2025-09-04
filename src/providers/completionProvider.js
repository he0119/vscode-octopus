const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * 注册代码补全提供者
 * @returns {vscode.Disposable} 提供者的 disposable
 */
function registerCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    "octopus",
    {
      provideCompletionItems(document, position, token, context) {
        return safeExecute(() => {
          const variables = getVariables(); // 动态获取当前变量集合
          const completionItems = [];
          const line = document.lineAt(position.line);
          const lineText = line.text;
          const textBeforeCursor = lineText.substring(0, position.character);

          // 检查是否在变量赋值语句中
          const assignmentMatch = textBeforeCursor.match(
            /^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)$/
          );

          if (assignmentMatch) {
            // 在等号后面，提供变量值的补全
            const variableName = assignmentMatch[1].trim();
            const variable = variables[variableName];

            if (variable) {
              // 如果变量有预定义选项，提供这些选项
              if (variable.Options && variable.Options.length > 0) {
                variable.Options.forEach((option) => {
                  const item = new vscode.CompletionItem(
                    option.Name,
                    vscode.CompletionItemKind.Value
                  );
                  item.detail = option.Value;
                  item.documentation = new vscode.MarkdownString(
                    `**${variableName}** 的可选值`
                  );
                  item.insertText = option.Name;
                  completionItems.push(item);
                });
              }

              // 如果变量有默认值，也提供默认值选项
              if (variable.Default) {
                const defaultValue = Array.isArray(variable.Default) ? variable.Default[0] : variable.Default;
                const item = new vscode.CompletionItem(
                  defaultValue,
                  vscode.CompletionItemKind.Value
                );
                item.detail = "默认值";
                item.documentation = new vscode.MarkdownString(
                  `**${variableName}** 的默认值`
                );
                item.insertText = defaultValue;
                completionItems.push(item);
              }

              // 根据变量类型提供一些常见值
              switch (variable.Type) {
                case "logical":
                  ["true", "false", "yes", "no"].forEach((value) => {
                    const item = new vscode.CompletionItem(
                      value,
                      vscode.CompletionItemKind.Value
                    );
                    item.detail = "逻辑值";
                    item.documentation = new vscode.MarkdownString(
                      `**${variableName}** 的逻辑值选项`
                    );
                    item.insertText = value;
                    completionItems.push(item);
                  });
                  break;
              }
            }
          } else {
            // 不在赋值语句中，提供变量名的补全
            Object.keys(variables).forEach((varName) => {
              const variable = variables[varName];
              const item = new vscode.CompletionItem(
                variable.Name || varName,
                vscode.CompletionItemKind.Variable
              );

              item.detail = variable.Section;
              const description = Array.isArray(variable.Description)
                ? variable.Description.join(" ")
                : variable.Description || "";
              item.documentation = new vscode.MarkdownString(description);

              // 添加插入文本
              const defaultValue = variable.Default
                ? Array.isArray(variable.Default)
                  ? variable.Default[0]
                  : variable.Default
                : "";
              if (defaultValue) {
                item.insertText = `${variable.Name || varName} = ${defaultValue}`;
              } else {
                item.insertText = `${variable.Name || varName} = `;
              }

              completionItems.push(item);
            });
          }

          return completionItems;
        }, "代码补全");
      },
    },
    "=",
    " " // 在等号和空格后触发补全
  );
}

module.exports = {
  registerCompletionProvider,
};
