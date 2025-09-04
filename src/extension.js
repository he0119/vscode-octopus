const vscode = require("vscode");
const variables = require("./variables.json");

/**
 * 解析变量赋值语句
 * @param {string} line
 * @returns {object|null} {variableName, value, startPos, endPos}
 */
function parseVariableAssignment(line) {
  // 匹配 VariableName = value 格式
  // 在 Octopus 中，只有以 - 开头的行才是注释，变量赋值行中不应该有行内注释
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (!match) return null;

  const variableName = match[1].trim();
  const value = match[2].trim();
  const startPos = line.indexOf(variableName);
  const valueStartPos = line.indexOf(value, startPos + variableName.length);

  return {
    variableName,
    value,
    varStartPos: startPos,
    varEndPos: startPos + variableName.length,
    valueStartPos,
    valueEndPos: valueStartPos + value.length,
  };
}

/**
 * 验证变量值
 * @param {string} variableName
 * @param {string} value
 * @returns {object|null} {isValid, message, suggestion}
 */
function validateVariableValue(variableName, value) {
  const variable = variables[variableName];

  // 检查变量是否存在
  if (!variable) {
    const suggestions = Object.keys(variables)
      .filter(
        (name) =>
          name.toLowerCase().includes(variableName.toLowerCase()) ||
          variableName.toLowerCase().includes(name.toLowerCase())
      )
      .slice(0, 3);

    return {
      isValid: false,
      message: `未知变量 '${variableName}'`,
      suggestion:
        suggestions.length > 0 ? `建议: ${suggestions.join(", ")}` : null,
    };
  }

  const cleanValue = value.replace(/['"]/g, ""); // 移除引号

  // 检查是否有预定义选项
  if (variable.options && variable.options.length > 0) {
    const validOptions = variable.options.map((opt) => opt.name.toLowerCase());
    const validValues = variable.options.map((opt) => opt.value.toLowerCase());

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
        return {
          isValid: false,
          message: `无效的选项: ${invalidParts.join(", ")}`,
          suggestion: `可选值: ${variable.options
            .map((opt) => opt.name)
            .slice(0, 10)
            .join(", ")}${variable.options.length > 10 ? "..." : ""}`,
        };
      }
    } else {
      // 单个选项验证
      if (
        !validOptions.includes(cleanValue.toLowerCase()) &&
        !validValues.includes(cleanValue.toLowerCase())
      ) {
        return {
          isValid: false,
          message: `无效的值 '${cleanValue}'`,
          suggestion: `可选值: ${variable.options
            .map((opt) => opt.name)
            .slice(0, 10)
            .join(", ")}${variable.options.length > 10 ? "..." : ""}`,
        };
      }
    }
    return { isValid: true };
  }

  // 根据类型验证值
  switch (variable.type) {
    case "integer":
      if (!/^-?\d+$/.test(cleanValue)) {
        return {
          isValid: false,
          message: `'${cleanValue}' 不是有效的整数`,
          suggestion: `期望整数值，如: ${variable.default || "1"}`,
        };
      }
      break;

    case "float":
    case "real":
      if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleanValue)) {
        return {
          isValid: false,
          message: `'${cleanValue}' 不是有效的浮点数`,
          suggestion: `期望浮点数，如: ${variable.default || "1.0"}`,
        };
      }
      break;

    case "logical":
      if (
        !["true", "false", "yes", "no", ".true.", ".false.", "1", "0"].includes(
          cleanValue.toLowerCase()
        )
      ) {
        return {
          isValid: false,
          message: `'${cleanValue}' 不是有效的逻辑值`,
          suggestion: "可选值: true, false, yes, no",
        };
      }
      break;

    case "string":
      // 字符串类型通常都是有效的
      break;
  }

  return { isValid: true };
}

/**
 * 创建诊断信息
 * @param {vscode.TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function createDiagnostics(document) {
  const diagnostics = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;

    // 跳过注释行和空行
    if (
      lineText.trim().startsWith("-") ||
      lineText.trim().startsWith("#") ||
      !lineText.trim()
    ) {
      continue;
    }

    // 跳过块定义行
    if (lineText.trim().startsWith("%")) {
      continue;
    }

    const assignment = parseVariableAssignment(lineText);
    if (!assignment) continue;

    const validation = validateVariableValue(
      assignment.variableName,
      assignment.value
    );

    if (!validation.isValid) {
      // 变量名错误
      if (!variables[assignment.variableName]) {
        const range = new vscode.Range(
          new vscode.Position(i, assignment.varStartPos),
          new vscode.Position(i, assignment.varEndPos)
        );

        const diagnostic = new vscode.Diagnostic(
          range,
          validation.message +
            (validation.suggestion ? ` (${validation.suggestion})` : ""),
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = "octopus";
        diagnostics.push(diagnostic);
      } else {
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
    }
  }

  return diagnostics;
}

/**
 * 激活插件
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Octopus 插件已激活");

  // 创建诊断集合
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("octopus");

  // 文档变化时更新诊断
  const updateDiagnostics = (document) => {
    // 只对 Octopus 文件类型进行验证
    if (document.languageId !== "octopus") {
      // 如果不是 Octopus 文件，清除可能存在的诊断信息
      diagnosticCollection.delete(document.uri);
      return;
    }

    // 额外检查：确保文件扩展名正确
    const fileName = document.fileName.toLowerCase();
    if (!fileName.endsWith(".inp")) {
      console.log(`跳过非 .inp 文件: ${document.fileName}`);
      diagnosticCollection.delete(document.uri);
      return;
    }

    console.log(
      `验证 Octopus 文件: ${document.fileName}, 语言ID: ${document.languageId}`
    );
    const diagnostics = createDiagnostics(document);
    diagnosticCollection.set(document.uri, diagnostics);
  };

  // 监听文档变化
  const onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
    updateDiagnostics(event.document);
  });

  const onDocumentOpen = vscode.workspace.onDidOpenTextDocument((document) => {
    updateDiagnostics(document);
  });

  // 对当前打开的文档进行初始验证
  vscode.workspace.textDocuments.forEach(updateDiagnostics);

  // 注册 Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider("octopus", {
    provideHover(document, position, token) {
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) return;

      const word = document.getText(wordRange);
      const variable = variables[word];

      if (!variable) return;

      // 创建 Markdown 内容
      const markdown = new vscode.MarkdownString();
      markdown.isTrusted = true;
      markdown.supportHtml = true;

      // 添加变量名作为标题
      markdown.appendMarkdown(`## ${word}\n\n`);

      // 添加文档链接
      if (variable.docUrl) {
        markdown.appendMarkdown(
          `[📖 查看在线文档](${variable.docUrl})\n\n---\n\n`
        );
      }

      // 添加基本信息
      if (variable.type) {
        markdown.appendMarkdown(`**类型**: ${variable.type}\n\n`);
      }
      if (variable.default) {
        markdown.appendMarkdown(`**默认值**: \`${variable.default}\`\n\n`);
      }
      if (variable.section) {
        markdown.appendMarkdown(`**章节**: ${variable.section}\n\n`);
      }

      // 添加描述
      if (variable.description) {
        markdown.appendMarkdown(`**描述**: ${variable.description}\n\n`);
      }

      // 添加选项（如果有）
      if (variable.options && variable.options.length > 0) {
        markdown.appendMarkdown(`**可选值**:\n\n`);
        variable.options.forEach((option) => {
          markdown.appendMarkdown(`- \`${option.name}\` (${option.value})\n`);
        });
        markdown.appendMarkdown(`\n`);
      }

      return new vscode.Hover(markdown, wordRange);
    },
  });

  // 注册命令：显示所有可用变量
  const showVariablesCommand = vscode.commands.registerCommand(
    "octopus.showVariables",
    () => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = Object.keys(variables).map((name) => ({
        label: name,
        description: variables[name].section,
        detail: variables[name].description.substring(0, 100) + "...",
      }));

      quickPick.placeholder = "搜索 Octopus 变量...";
      quickPick.matchOnDescription = true;
      quickPick.matchOnDetail = true;

      quickPick.onDidChangeSelection(([item]) => {
        if (item) {
          const variable = variables[item.label];
          if (variable.docUrl) {
            vscode.env.openExternal(vscode.Uri.parse(variable.docUrl));
          }
          quickPick.hide();
        }
      });

      quickPick.show();
    }
  );

  // 注册 Completion Provider（自动完成）
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    "octopus",
    {
      provideCompletionItems(document, position, token, context) {
        const completionItems = [];

        Object.keys(variables).forEach((varName) => {
          const variable = variables[varName];
          const item = new vscode.CompletionItem(
            varName,
            vscode.CompletionItemKind.Variable
          );

          item.detail = variable.section;
          item.documentation = new vscode.MarkdownString(variable.description);

          // 添加插入文本
          if (variable.default) {
            item.insertText = `${varName} = ${variable.default}`;
          } else {
            item.insertText = `${varName} = `;
          }

          completionItems.push(item);
        });

        return completionItems;
      },
    }
  );

  // 注册代码操作提供器（快速修复）
  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    "octopus",
    {
      provideCodeActions(document, range, context, token) {
        const codeActions = [];

        // 遍历当前范围内的诊断
        context.diagnostics.forEach((diagnostic) => {
          if (diagnostic.source === "octopus") {
            const line = document.lineAt(diagnostic.range.start.line);
            const assignment = parseVariableAssignment(line.text);

            if (assignment) {
              // 如果是未知变量，提供建议的变量名
              if (!variables[assignment.variableName]) {
                const suggestions = Object.keys(variables)
                  .filter(
                    (name) =>
                      name
                        .toLowerCase()
                        .includes(assignment.variableName.toLowerCase()) ||
                      assignment.variableName
                        .toLowerCase()
                        .includes(name.toLowerCase())
                  )
                  .slice(0, 5);

                suggestions.forEach((suggestion) => {
                  const action = new vscode.CodeAction(
                    `替换为 '${suggestion}'`,
                    vscode.CodeActionKind.QuickFix
                  );

                  action.edit = new vscode.WorkspaceEdit();
                  action.edit.replace(
                    document.uri,
                    new vscode.Range(
                      new vscode.Position(
                        diagnostic.range.start.line,
                        assignment.varStartPos
                      ),
                      new vscode.Position(
                        diagnostic.range.start.line,
                        assignment.varEndPos
                      )
                    ),
                    suggestion
                  );

                  action.diagnostics = [diagnostic];
                  codeActions.push(action);
                });
              }
              // 如果是无效值，提供有效选项
              else {
                const variable = variables[assignment.variableName];
                if (variable.options && variable.options.length > 0) {
                  // 提供前几个单个选项
                  variable.options.slice(0, 5).forEach((option) => {
                    const action = new vscode.CodeAction(
                      `设置为 '${option.name}'`,
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
                      option.name
                    );

                    action.diagnostics = [diagnostic];
                    codeActions.push(action);
                  });
                } else if (variable.default) {
                  // 提供默认值
                  const action = new vscode.CodeAction(
                    `设置为默认值 '${variable.default}'`,
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
                    variable.default
                  );

                  action.diagnostics = [diagnostic];
                  codeActions.push(action);
                }
              }
            }
          }
        });

        return codeActions;
      },
    }
  );

  // 将所有 disposables 添加到 context
  context.subscriptions.push(
    hoverProvider,
    showVariablesCommand,
    completionProvider,
    codeActionProvider,
    diagnosticCollection,
    onDocumentChange,
    onDocumentOpen
  );
}

/**
 * 停用插件
 */
function deactivate() {
  console.log("Octopus 插件已停用");
}

module.exports = {
  activate,
  deactivate,
};
