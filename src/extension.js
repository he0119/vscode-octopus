const vscode = require("vscode");
const variables = require("./variables.json");

/**
 * 解析变量赋值语句
 * @param {string} line
 * @returns {object|null} {variableName, value, startPos, endPos}
 */
function parseVariableAssignment(line) {
  // 匹配 VariableName = value 格式
  // 在 Octopus 中，# 字符开始的部分是注释，需要在解析值时排除
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (!match) return null;

  const variableName = match[1].trim();
  let fullValue = match[2];
  
  // 检查是否有行末注释（# 字符开始）
  const commentIndex = fullValue.indexOf('#');
  const value = commentIndex !== -1 ? fullValue.substring(0, commentIndex).trim() : fullValue.trim();
  
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
 * 预定义常量列表（与 tmLanguage.json 中保持一致）
 */
const PREDEFINED_CONSTANTS = [
  'pi', 'e', 'i', 'angstrom', 'pm', 'picometer', 'nm', 'nanometer',
  'ry', 'rydberg', 'eV', 'electronvolt', 'invcm', 'kelvin', 'kjoule_mol',
  'kcal_mol', 'as', 'attosecond', 'fs', 'femtosecond', 'ps', 'picosecond',
  'c', 'x', 'y', 'z', 'r', 'w', 't'
];

/**
 * 数学函数列表（与 tmLanguage.json 中保持一致）
 */
const MATH_FUNCTIONS = [
  'sqrt', 'exp', 'log', 'ln', 'log10', 'logb', 'logabs', 'arg', 'abs', 'abs2',
  'conjg', 'inv', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos',
  'atan', 'acot', 'asec', 'acsc', 'atan2', 'sinh', 'cosh', 'tanh', 'coth',
  'sech', 'csch', 'asinh', 'acosh', 'atanh', 'acoth', 'asech', 'acsch',
  'min', 'max', 'step', 'erf', 'realpart', 'imagpart', 'floor', 'ceiling'
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
  const constantRegex = new RegExp(`\\b(${PREDEFINED_CONSTANTS.join('|')})\\b`, 'i');
  if (constantRegex.test(value)) {
    return true;
  }

  // 检查是否包含数学函数
  const functionRegex = new RegExp(`\\b(${MATH_FUNCTIONS.join('|')})\\s*\\(`, 'i');
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
 * @returns {object|null} {isValid, message, suggestion}
 */
function validateVariableValue(variableName, value) {
  const variable = variables[variableName];

  // 如果变量不存在，返回null表示无需验证
  if (!variable) {
    return null;
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
      // 如果包含数学表达式，则认为是有效的
      if (containsMathematicalExpression(cleanValue)) {
        return { isValid: true };
      }

      // 否则验证是否为纯数字格式
      if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleanValue)) {
        return {
          isValid: false,
          message: `'${cleanValue}' 不是有效的浮点数或数学表达式`,
          suggestion: `期望浮点数或数学表达式，如: ${variable.default || "1.0"} 或 3.5 * angstrom`,
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
            if (variable.options && variable.options.length > 0) {
              variable.options.forEach((option) => {
                const item = new vscode.CompletionItem(
                  option.name,
                  vscode.CompletionItemKind.Value
                );
                item.detail = option.value;
                item.documentation = new vscode.MarkdownString(
                  `**${variableName}** 的可选值`
                );
                item.insertText = option.name;
                completionItems.push(item);
              });
            }

            // 如果变量有默认值，也提供默认值选项
            if (variable.default) {
              const item = new vscode.CompletionItem(
                variable.default,
                vscode.CompletionItemKind.Value
              );
              item.detail = "默认值";
              item.documentation = new vscode.MarkdownString(
                `**${variableName}** 的默认值`
              );
              item.insertText = variable.default;
              completionItems.push(item);
            }

            // 根据变量类型提供一些常见值
            switch (variable.type) {
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
              varName,
              vscode.CompletionItemKind.Variable
            );

            item.detail = variable.section;
            item.documentation = new vscode.MarkdownString(
              variable.description
            );

            // 添加插入文本
            if (variable.default) {
              item.insertText = `${varName} = ${variable.default}`;
            } else {
              item.insertText = `${varName} = `;
            }

            completionItems.push(item);
          });
        }

        return completionItems;
      },
    },
    "=",
    " " // 在等号和空格后触发补全
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
              // 只处理无效变量值的情况（变量存在但值无效）
              const variable = variables[assignment.variableName];
              if (variable) {
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
