const vscode = require("vscode");
const { getVariables } = require("../utils/versionManager");
const { parseVariableAssignment } = require("../utils/parser");
const { safeExecute } = require("../utils/logger");

/**
 * Parse block start statement (%BlockName)
 * @param {string} line 
 * @returns {object|null} {blockName, startPos, endPos}
 */
function parseBlockStart(line) {
    // Match %BlockName format
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
 * Register Inlay Hints provider
 * @returns {vscode.Disposable} Registered Inlay Hints provider
 */
function registerInlayHintsProvider() {
    return safeExecute(() => {
        const provider = new OctopusInlayHintsProvider();

        return vscode.languages.registerInlayHintsProvider(
            { language: "octopus" },
            provider
        );
    }, "Register Inlay Hints provider");
}

/**
 * Octopus Inlay Hints provider
 */
class OctopusInlayHintsProvider {
    constructor() {
        this._onDidChangeInlayHints = new vscode.EventEmitter();
        this.onDidChangeInlayHints = this._onDidChangeInlayHints.event;

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('octopus.inlayHints')) {
                this._onDidChangeInlayHints.fire();
            }
        });
    }
    /**
     * Provide Inlay Hints
     * @param {vscode.TextDocument} document 
     * @param {vscode.Range} range 
     * @param {vscode.CancellationToken} token 
     * @returns {vscode.InlayHint[]}
     */
    provideInlayHints(document, range, token) {
        return safeExecute(() => {
            const hints = [];
            const variables = getVariables();

            // Check if inlay hints are enabled in configuration
            const config = vscode.workspace.getConfiguration("octopus");
            const showInlayHints = config.get("inlayHints.enabled", true);
            const showBuiltinHints = config.get("inlayHints.showBuiltin", true);
            const showUserHints = config.get("inlayHints.showUser", true);

            if (!showInlayHints) {
                return hints;
            }

            // Iterate through each line in the range
            for (let lineIndex = range.start.line; lineIndex <= range.end.line; lineIndex++) {
                if (token.isCancellationRequested) {
                    break;
                }

                const line = document.lineAt(lineIndex);
                const lineText = line.text;

                // Skip comment lines and empty lines
                if (lineText.trim().startsWith("#") || lineText.trim() === "") {
                    continue;
                }

                // Try to parse variable assignment
                const parseResult = parseVariableAssignment(lineText);
                if (parseResult) {
                    const hint = this.createVariableHint(parseResult, variables, showBuiltinHints, showUserHints, lineIndex);
                    if (hint) hints.push(hint);
                    continue;
                }

                // Try to parse block start statement
                const blockResult = parseBlockStart(lineText);
                if (blockResult) {
                    const hint = this.createBlockHint(blockResult, variables, showBuiltinHints, showUserHints, lineIndex);
                    if (hint) hints.push(hint);
                    continue;
                }
            }

            return hints;
        }, "Provide Inlay Hints");
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
