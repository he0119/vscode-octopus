const vscode = require("vscode");
const variables = require("./varinfo-14.1.json");

// 创建输出通道
let outputChannel;

/**
 * 获取输出通道实例
 * @returns {vscode.OutputChannel}
 */
function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Octopus");
  }
  return outputChannel;
}

/**
 * 输出日志信息
 * @param {string} message 日志消息
 * @param {string} level 日志级别 (INFO, WARN, ERROR)
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  const channel = getOutputChannel();
  channel.appendLine(formattedMessage);

  // 根据日志级别决定是否在控制台也输出
  if (level === 'ERROR') {
    console.error(formattedMessage);
  } else if (level === 'WARN') {
    console.warn(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * 输出错误信息并显示通知
 * @param {Error|string} error 错误对象或错误消息
 * @param {string} context 错误发生的上下文
 */
function logError(error, context = '') {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : '';

  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
  log(fullMessage, 'ERROR');

  if (stack) {
    log(`堆栈信息: ${stack}`, 'ERROR');
  }

  // 显示用户友好的错误通知
  vscode.window.showErrorMessage(`Octopus 扩展错误: ${errorMessage}`);
}

/**
 * 安全执行函数，包含异常处理
 * @param {Function} fn 要执行的函数
 * @param {string} context 执行上下文描述
 * @param {any} defaultValue 出错时返回的默认值，默认为 null
 * @returns {any} 函数执行结果，如果出错则返回 defaultValue
 */
function safeExecute(fn, context, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return defaultValue;
  }
}

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
    const commentIndex = fullValue.indexOf('#');
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
          log(`验证失败: ${errorResult.message}`, 'WARN');
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
          log(`验证失败: ${errorResult.message}`, 'WARN');
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
          log(`验证失败: ${errorResult.message}`, 'WARN');
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
          log(`验证失败: ${errorResult.message}`, 'WARN');
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
          log(`验证失败: ${errorResult.message}`, 'WARN');
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

/**
 * 创建诊断信息
 * @param {vscode.TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function createDiagnostics(document) {
  return safeExecute(() => {
    const diagnostics = [];

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
      };

      safeExecute(processLine, `处理第 ${i + 1} 行`);
    }

    return diagnostics;
  }, '创建诊断信息', []);
}

/**
 * 激活插件
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  try {
    log("Octopus 插件开始激活", 'INFO');

    // 创建诊断集合
    const diagnosticCollection =
      vscode.languages.createDiagnosticCollection("octopus");

    // 文档变化时更新诊断
    const updateDiagnostics = (document) => {
      return safeExecute(() => {
        // 只对 Octopus 文件类型进行验证
        if (document.languageId !== "octopus") {
          // 如果不是 Octopus 文件，且存在诊断信息时才清除并记录日志
          const existingDiagnostics = diagnosticCollection.get(document.uri);
          if (existingDiagnostics && existingDiagnostics.length > 0) {
            diagnosticCollection.delete(document.uri);
            log(`清除非 Octopus 文件的诊断信息: ${document.fileName}`, 'INFO');
          }
          return;
        }

        log(`更新诊断信息: ${document.fileName}`, 'INFO');
        log(`更新诊断信息: ${document.fileName}`, 'INFO');
        const diagnostics = createDiagnostics(document);
        diagnosticCollection.set(document.uri, diagnostics);
      }, '更新诊断信息');
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
        return safeExecute(() => {
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
          markdown.appendMarkdown(`## ${variable.Name || word}\n\n`);

          // 添加文档链接
          if (variable.docUrl) {
            markdown.appendMarkdown(
              `[📖 查看在线文档](${variable.docUrl})\n\n---\n\n`
            );
          }

          // 添加基本信息
          if (variable.Type) {
            markdown.appendMarkdown(`**类型**: ${variable.Type}\n\n`);
          }
          if (variable.Default) {
            const defaultValue = Array.isArray(variable.Default) ? variable.Default.join(', ') : variable.Default;
            markdown.appendMarkdown(`**默认值**: \`${defaultValue}\`\n\n`);
          }
          if (variable.Section) {
            markdown.appendMarkdown(`**章节**: ${variable.Section}\n\n`);
          }

          // 添加描述
          if (variable.Description) {
            const description = Array.isArray(variable.Description) ? variable.Description.join(' ') : variable.Description;
            markdown.appendMarkdown(`**描述**: ${description}\n\n`);
          }

          // 添加选项（如果有）
          if (variable.Options && variable.Options.length > 0) {
            markdown.appendMarkdown(`**可选值**:\n\n`);
            variable.Options.forEach((option) => {
              markdown.appendMarkdown(`- \`${option.Name}\` (${option.Value})\n`);
            });
            markdown.appendMarkdown(`\n`);
          }

          return new vscode.Hover(markdown, wordRange);
        }, 'Hover Provider');
      },
    });

    // 注册命令：显示所有可用变量
    const showVariablesCommand = vscode.commands.registerCommand(
      "octopus.showVariables",
      () => {
        return safeExecute(() => {
          const quickPick = vscode.window.createQuickPick();
          quickPick.items = Object.keys(variables).map((name) => {
            const variable = variables[name];
            const description = Array.isArray(variable.Description) ?
              variable.Description.join(' ').substring(0, 100) + "..." :
              (variable.Description ? variable.Description.substring(0, 100) + "..." : "");

            return {
              label: variable.Name || name,
              description: variable.Section,
              detail: description,
            };
          });

          quickPick.placeholder = "搜索 Octopus 变量...";
          quickPick.matchOnDescription = true;
          quickPick.matchOnDetail = true;

          quickPick.onDidChangeSelection(([item]) => {
            if (item) {
              const variable = variables[Object.keys(variables).find(key =>
                variables[key].Name === item.label || key === item.label
              )];
              if (variable && variable.docUrl) {
                vscode.env.openExternal(vscode.Uri.parse(variable.docUrl));
              }
              quickPick.hide();
            }
          });

          quickPick.show();
        }, '显示变量命令');
      }
    );

    // 注册 Completion Provider（自动完成）
    const completionProvider = vscode.languages.registerCompletionItemProvider(
      "octopus",
      {
        provideCompletionItems(document, position, token, context) {
          return safeExecute(() => {
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
                const description = Array.isArray(variable.Description) ?
                  variable.Description.join(' ') :
                  (variable.Description || '');
                item.documentation = new vscode.MarkdownString(description);

                // 添加插入文本
                const defaultValue = variable.Default ?
                  (Array.isArray(variable.Default) ? variable.Default[0] : variable.Default) :
                  '';
                if (defaultValue) {
                  item.insertText = `${variable.Name || varName} = ${defaultValue}`;
                } else {
                  item.insertText = `${variable.Name || varName} = `;
                }

                completionItems.push(item);
              });
            }

            return completionItems;
          }, '代码补全');
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
          return safeExecute(() => {
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
          }, '代码操作');
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

    log("Octopus 插件激活完成", 'INFO');

    // 显示输出面板（可选）
    // getOutputChannel().show();

  } catch (error) {
    logError(error, "激活插件时发生错误");
    vscode.window.showErrorMessage("Octopus 插件激活失败，请查看输出面板获取详细信息。");
  }
}

/**
 * 停用插件
 */
function deactivate() {
  return safeExecute(() => {
    log("Octopus 插件开始停用", 'INFO');
    if (outputChannel) {
      outputChannel.dispose();
      outputChannel = null;
    }
    log("Octopus 插件已停用", 'INFO');
  }, "停用插件");
}

module.exports = {
  activate,
  deactivate,
};
