const vscode = require("vscode");
const { getVariables, getCurrentVersion } = require("../utils/versionManager");
const { generateDocUrl } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");
/**
 * Register hover provider
 * @returns {vscode.Disposable} Provider disposable
 */
function registerHoverProvider() {
  return vscode.languages.registerHoverProvider("octopus", {
    provideHover(document, position, token) {
      return safeExecute(() => {
        const variables = getVariables(); // Dynamically get current variable collection
        const currentVersion = getCurrentVersion(); // Dynamically get current version

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return;

        const word = document.getText(wordRange);
        const variable = variables[word.toLowerCase()];

        if (!variable) return;

        // Create Markdown content
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        // Add variable name as title
        markdown.appendMarkdown(`## ${variable.Name || word}\n\n`);

        // Add version information
        markdown.appendMarkdown(`**Version**: Octopus ${currentVersion}\n\n`);

        // 生成并添加文档链接
        const docUrl = variable.docUrl || generateDocUrl(variable.Section, variable.Name);
        if (docUrl) {
          markdown.appendMarkdown(
            `[📖 View Online Documentation](${docUrl})\n\n---\n\n`
          );
        }

        // 添加基本信息
        if (variable.Type) {
          markdown.appendMarkdown(`**Type**: ${variable.Type}\n\n`);
        }
        if (variable.Default) {
          const defaultValue = Array.isArray(variable.Default) ? variable.Default.join(', ') : variable.Default;
          markdown.appendMarkdown(`**Default Value**: \`${defaultValue}\`\n\n`);
        }
        if (variable.Section) {
          markdown.appendMarkdown(`**Section**: ${variable.Section}\n\n`);
        }

        // 添加描述
        if (variable.Description) {
          const description = Array.isArray(variable.Description) ? variable.Description.join(' ') : variable.Description;
          markdown.appendMarkdown(`**Description**: ${description}\n\n`);
        }

        // 添加选项（如果有）
        if (variable.Options && variable.Options.length > 0) {
          markdown.appendMarkdown(`**Valid Values**:\n\n`);
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
