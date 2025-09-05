const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { parseVariableAssignment } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");

/**
 * 解析块开始语句 (%BlockName)
 * @param {string} line 
 * @returns {object|null} {blockName, startPos, endPos}
 */
function parseBlockStart(line) {
    // 匹配 %BlockName 格式
    const match = line.match(/^\s*%([A-Za-z][A-Za-z0-9_]*)\s*$/);
    if (!match) return null;

    const blockName = match[1];
    const startPos = line.indexOf('%');
    const endPos = startPos + blockName.length + 1; // +1 for the % character

    return {
        blockName,
        startPos,
        endPos
    };
}

/**
 * 注册 Inlay Hints 提供者
 * @returns {vscode.Disposable} 注册的 Inlay Hints 提供者
 */
function registerInlayHintsProvider() {
    return safeExecute(() => {
        const provider = new OctopusInlayHintsProvider();

        return vscode.languages.registerInlayHintsProvider(
            { language: "octopus" },
            provider
        );
    }, "注册 Inlay Hints 提供者");
}

/**
 * Octopus Inlay Hints 提供者
 */
class OctopusInlayHintsProvider {
    constructor() {
        this._onDidChangeInlayHints = new vscode.EventEmitter();
        this.onDidChangeInlayHints = this._onDidChangeInlayHints.event;

        // 监听配置变化
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('octopus.inlayHints')) {
                this._onDidChangeInlayHints.fire();
            }
        });
    }
    /**
     * 提供 Inlay Hints
     * @param {vscode.TextDocument} document 
     * @param {vscode.Range} range 
     * @param {vscode.CancellationToken} token 
     * @returns {vscode.InlayHint[]}
     */
    provideInlayHints(document, range, token) {
        return safeExecute(() => {
            const hints = [];
            const variables = getVariables();

            // 检查配置是否启用了 inlay hints
            const config = vscode.workspace.getConfiguration("octopus");
            const showInlayHints = config.get("inlayHints.enabled", true);
            const showBuiltinHints = config.get("inlayHints.showBuiltin", true);
            const showUserHints = config.get("inlayHints.showUser", true);

            if (!showInlayHints) {
                return hints;
            }

            // 遍历范围内的每一行
            for (let lineIndex = range.start.line; lineIndex <= range.end.line; lineIndex++) {
                if (token.isCancellationRequested) {
                    break;
                }

                const line = document.lineAt(lineIndex);
                const lineText = line.text;

                // 跳过注释行和空行
                if (lineText.trim().startsWith("#") || lineText.trim() === "") {
                    continue;
                }

                // 尝试解析变量赋值
                const parseResult = parseVariableAssignment(lineText);
                if (parseResult) {
                    const hint = this.createVariableHint(parseResult, variables, showBuiltinHints, showUserHints, lineIndex);
                    if (hint) hints.push(hint);
                    continue;
                }

                // 尝试解析块开始语句
                const blockResult = parseBlockStart(lineText);
                if (blockResult) {
                    const hint = this.createBlockHint(blockResult, variables, showBuiltinHints, showUserHints, lineIndex);
                    if (hint) hints.push(hint);
                    continue;
                }
            }

            return hints;
        }, "提供 Inlay Hints");
    }

    /**
     * Create inlay hint for variable assignment
     * @param {object} parseResult 
     * @param {object} variables 
     * @param {boolean} showBuiltinHints 
     * @param {boolean} showUserHints 
     * @param {number} lineIndex 
     * @returns {vscode.InlayHint|null}
     */
    createVariableHint(parseResult, variables, showBuiltinHints, showUserHints, lineIndex) {
        const { variableName, varEndPos } = parseResult;

        // Check if this is an Octopus builtin variable
        const normalizedVarName = variableName.toLowerCase();
        const isBuiltinVariable = variables.hasOwnProperty(normalizedVarName);

        // Decide whether to show hint based on configuration
        if (isBuiltinVariable && !showBuiltinHints) {
            return null;
        }
        if (!isBuiltinVariable && !showUserHints) {
            return null;
        }

        // Create inlay hint
        const position = new vscode.Position(lineIndex, varEndPos);
        let hintText, hintTooltip;

        if (isBuiltinVariable) {
            const varInfo = variables[normalizedVarName];
            hintText = " [builtin]";
            hintTooltip = `Builtin variable: ${variableName}\n${varInfo.Description || "Octopus builtin variable"}`;
        } else {
            hintText = " [user]";
            hintTooltip = `User-defined variable: ${variableName}`;
        }

        const hint = new vscode.InlayHint(
            position,
            hintText,
            vscode.InlayHintKind.Type
        );

        // Set tooltip information
        hint.tooltip = hintTooltip;

        // Set styling
        hint.paddingLeft = false;
        hint.paddingRight = true;

        return hint;
    }

    /**
     * Create inlay hint for block statement
     * @param {object} blockResult 
     * @param {object} variables 
     * @param {boolean} showBuiltinHints 
     * @param {boolean} showUserHints 
     * @param {number} lineIndex 
     * @returns {vscode.InlayHint|null}
     */
    createBlockHint(blockResult, variables, showBuiltinHints, showUserHints, lineIndex) {
        const { blockName, endPos } = blockResult;

        // Check if this is an Octopus builtin block
        const normalizedBlockName = blockName.toLowerCase();
        const isBuiltinBlock = variables.hasOwnProperty(normalizedBlockName);

        // Decide whether to show hint based on configuration
        if (isBuiltinBlock && !showBuiltinHints) {
            return null;
        }
        if (!isBuiltinBlock && !showUserHints) {
            return null;
        }

        // Create inlay hint
        const position = new vscode.Position(lineIndex, endPos);
        let hintText, hintTooltip;

        if (isBuiltinBlock) {
            const blockInfo = variables[normalizedBlockName];
            hintText = " [builtin block]";
            hintTooltip = `Builtin block: ${blockName}\n${blockInfo.Description || "Octopus builtin block"}`;
        } else {
            hintText = " [user block]";
            hintTooltip = `User-defined block: ${blockName}`;
        }

        const hint = new vscode.InlayHint(
            position,
            hintText,
            vscode.InlayHintKind.Type
        );

        // Set tooltip information
        hint.tooltip = hintTooltip;

        // Set styling
        hint.paddingLeft = false;
        hint.paddingRight = true;

        return hint;
    }

    /**
     * Resolve Inlay Hint (optional)
     * @param {vscode.InlayHint} hint 
     * @param {vscode.CancellationToken} token 
     * @returns {vscode.InlayHint}
     */
    resolveInlayHint(hint, token) {
        return hint;
    }
}

module.exports = {
    registerInlayHintsProvider,
};
