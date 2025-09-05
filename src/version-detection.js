const vscode = require("vscode");
const { exec } = require("child_process");
const util = require("util");

// Convert exec to Promise version
const execAsync = util.promisify(exec);

/**
 * Detect system-installed version by running octopus --version command
 * @returns {Promise<string|null>} Detected version number
 */
async function detectVersionFromSystem() {
    try {
        // Try to run octopus --version command
        const { stdout, stderr } = await execAsync('octopus --version', {
            timeout: 5000, // 5 second timeout
            encoding: 'utf8'
        });

        if (stderr && !stdout) {
            console.warn('octopus --version command execution has warnings:', stderr);
        }

        // Parse output, format is usually: "octopus 16.2 (git commit 28271023a8)"
        const versionMatch = stdout.match(/octopus\s+(\d+\.\d+)/i);
        if (versionMatch) {
            const version = versionMatch[1];
            console.log(`Detected Octopus version through system command: ${version}`);
            return version;
        }

        console.warn('Unable to parse version number from octopus --version output:', stdout);
        return null;

    } catch (error) {
        // Command execution failed (octopus not installed or not in PATH)
        console.log('Unable to execute octopus --version command:', error.message);
        return null;
    }
}

/**
 * Try to detect Octopus version from file content
 * @param {string} content File content
 * @returns {string|null} Detected version number, returns null if unable to detect
 */
function detectVersionFromContent(content) {
    // Check if there are version comments in the file
    const versionCommentMatch = content.match(/(?:#|%)\s*octopus\s+version?\s*[:\-]?\s*(\d+\.\d+)/i);
    if (versionCommentMatch) {
        return versionCommentMatch[1];
    }

    // Check for version-specific variables or features
    // Here we can judge based on unique features of different versions

    // For example: certain variables only exist in specific versions
    if (content.includes("SomeVariable16_2Only")) {
        return "16.2";
    }

    if (content.includes("SomeVariable14_1Only")) {
        return "14.1";
    }

    return null;
}

/**
 * Try to detect Octopus version from workspace
 * @returns {Promise<string|null>} Detected version number
 */
async function detectVersionFromWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return null;
    }

    // Look for files that might contain version information
    const configFiles = [
        "octopus.conf",
        "config.inp",
        "version.txt",
        ".octopus-version"
    ];

    for (const folder of workspaceFolders) {
        for (const configFile of configFiles) {
            try {
                const configUri = vscode.Uri.joinPath(folder.uri, configFile);
                const configContent = await vscode.workspace.fs.readFile(configUri);
                const content = Buffer.from(configContent).toString('utf8');

                const version = detectVersionFromContent(content);
                if (version) {
                    return version;
                }
            } catch (error) {
                // File doesn't exist or read failed, continue trying the next one
                continue;
            }
        }
    }

    return null;
}

/**
 * Try to detect version from current active document
 * @returns {string|null} Detected version number
 */
function detectVersionFromActiveDocument() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== 'octopus') {
        return null;
    }

    return detectVersionFromContent(activeEditor.document.getText());
}

/**
 * Auto-detect Octopus version
 * @returns {Promise<string|null>} Detected version number
 */
async function autoDetectVersion() {
    // 1. First try to detect from system command (most reliable)
    let version = await detectVersionFromSystem();
    if (version) {
        return version;
    }

    // 2. Then try to detect from current active document
    version = detectVersionFromActiveDocument();
    if (version) {
        return version;
    }

    // 3. Finally try to detect from workspace
    version = await detectVersionFromWorkspace();
    if (version) {
        return version;
    }

    return null;
}

module.exports = {
    detectVersionFromSystem,
    detectVersionFromContent,
    detectVersionFromWorkspace,
    detectVersionFromActiveDocument,
    autoDetectVersion
};
