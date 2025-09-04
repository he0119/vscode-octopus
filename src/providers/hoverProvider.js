const vscode = require("vscode");
const { getVariables, getCurrentVersion } = require("../utils/versionManager");
const { generateDocUrl } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");
/**
 * 注册悬浮提示提供者
 * @returns {vscode.Disposable} 提供者的 disposable
 */
function registerHoverProvider() {
  return vscode.languages.registerHoverProvider("octopus", {
    provideHover(document, position, token) {
      return safeExecute(() => {
        const variables = getVariables(); // 动态获取当前变量集合
        const currentVersion = getCurrentVersion(); // 动态获取当前版本

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const word = document.getText(wordRange);
        const variable = variables[word.toLowerCase()];

        if (!variable) return;

        // 创建 Markdown 内容
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        // 添加变量名作为标题
        markdown.appendMarkdown(`## ${variable.Name || word}\n\n`);

        // 添加版本信息
        markdown.appendMarkdown(`**版本**: Octopus ${currentVersion}\n\n`);

        // 生成并添加文档链接
        const docUrl = variable.docUrl || generateDocUrl(variable.Section, variable.Name);
        if (docUrl) {
          markdown.appendMarkdown(
            `[📖 查看在线文档](${docUrl})\n\n---\n\n`
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
      }, "Hover Provider");
    },
  });
}

module.exports = {
  registerHoverProvider,
};
