const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { safeExecute } = require("../utils/logger");

/**
 * Register code completion provider
 * @returns {vscode.Disposable} Provider's disposable
 */
function registerCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    "octopus",
    {
      provideCompletionItems(document, position, token, context) {
        return safeExecute(() => {
          const variables = getVariables(); // Dynamically get current variable set
          const completionItems = [];
          const line = document.lineAt(position.line);
          const lineText = line.text;
          const textBeforeCursor = lineText.substring(0, position.character);

          // Check if in variable assignment statement
          const assignmentMatch = textBeforeCursor.match(
            /^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)$/
          );

          if (assignmentMatch) {
            // After equals sign, provide completion for variable values
            const variableName = assignmentMatch[1].trim();
            const variable = variables[variableName];

            if (variable) {
              // If variable has predefined options, provide these options
              if (variable.Options && variable.Options.length > 0) {
                variable.Options.forEach((option) => {
                  const item = new vscode.CompletionItem(
                    option.Name,
                    vscode.CompletionItemKind.Value
                  );
                  item.detail = option.Value;
                  item.documentation = new vscode.MarkdownString(
                    `Optional value for **${variableName}**`
                  );
                  item.insertText = option.Name;
                  completionItems.push(item);
                });
              }

              // If variable has default value, also provide default value option
              if (variable.Default) {
                const defaultValue = Array.isArray(variable.Default) ? variable.Default[0] : variable.Default;
                const item = new vscode.CompletionItem(
                  defaultValue,
                  vscode.CompletionItemKind.Value
                );
                item.detail = "Default value";
                item.documentation = new vscode.MarkdownString(
                  `Default value for **${variableName}**`
                );
                item.insertText = defaultValue;
                completionItems.push(item);
              }

              // Provide common values based on variable type
              switch (variable.Type) {
                case "logical":
                  ["true", "false", "yes", "no"].forEach((value) => {
                    const item = new vscode.CompletionItem(
                      value,
                      vscode.CompletionItemKind.Value
                    );
                    item.detail = "Logical value";
                    item.documentation = new vscode.MarkdownString(
                      `Logical value option for **${variableName}**`
                    );
                    item.insertText = value;
                    completionItems.push(item);
                  });
                  break;
              }
            }
          } else {
            // Not in assignment statement, provide variable name completion
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

              // Add insert text
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
        }, "Code completion");
      },
    },
    "=",
    " " // Trigger completion after equals sign and space
  );
}

module.exports = {
  registerCompletionProvider,
};
