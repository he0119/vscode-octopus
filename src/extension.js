const vscode = require("vscode");
const variables = require("./variables.json");

/**
 * 激活插件
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Octopus 插件已激活");

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

      // 添加文档链接
      if (variable.docUrl) {
        markdown.appendMarkdown(`[📖 查看在线文档](${variable.docUrl})`);
      }

      return new vscode.Hover(markdown, wordRange);
    },
  });

  // 注册 Definition Provider（用于跳转到文档）
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    "octopus",
    {
      provideDefinition(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const word = document.getText(wordRange);
        const variable = variables[word];

        if (!variable || !variable.docUrl) return;

        // 打开文档链接
        vscode.env.openExternal(vscode.Uri.parse(variable.docUrl));

        // 返回空数组表示没有本地定义
        return [];
      },
    }
  );

  // 注册 Code Lens Provider（在变量上方显示"查看文档"链接）
  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    "octopus",
    {
      provideCodeLenses(document, token) {
        const codeLenses = [];
        const text = document.getText();
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const words = line.split(/\s+/);

          for (const word of words) {
            const cleanWord = word.trim();
            if (variables[cleanWord]) {
              const startIndex = line.indexOf(cleanWord);
              if (startIndex !== -1) {
                const range = new vscode.Range(
                  i,
                  startIndex,
                  i,
                  startIndex + cleanWord.length
                );

                const codeLens = new vscode.CodeLens(range, {
                  title: "📖 查看文档",
                  command: "octopus.openDocumentation",
                  arguments: [cleanWord],
                });

                codeLenses.push(codeLens);
              }
            }
          }
        }

        return codeLenses;
      },
    }
  );

  // 注册命令：打开文档
  const openDocCommand = vscode.commands.registerCommand(
    "octopus.openDocumentation",
    (variableName) => {
      const variable = variables[variableName];
      if (variable && variable.docUrl) {
        vscode.env.openExternal(vscode.Uri.parse(variable.docUrl));
      } else {
        vscode.window.showInformationMessage(
          `未找到变量 ${variableName} 的文档`
        );
      }
    }
  );

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

  // 将所有 disposables 添加到 context
  context.subscriptions.push(
    hoverProvider,
    definitionProvider,
    codeLensProvider,
    openDocCommand,
    showVariablesCommand,
    completionProvider
  );

  // 显示激活消息
  vscode.window.showInformationMessage(
    "Octopus 插件已激活！现在可以 hover 查看变量文档，点击跳转到在线文档。"
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
