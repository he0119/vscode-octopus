const vscode = require("vscode");
const { exec } = require("child_process");
const util = require("util");

// 将 exec 转换为 Promise 版本
const execAsync = util.promisify(exec);

/**
 * 通过运行 octopus --version 命令检测系统安装的版本
 * @returns {Promise<string|null>} 检测到的版本号
 */
async function detectVersionFromSystem() {
    try {
        // 尝试运行 octopus --version 命令
        const { stdout, stderr } = await execAsync('octopus --version', {
            timeout: 5000, // 5秒超时
            encoding: 'utf8'
        });

        if (stderr && !stdout) {
            console.warn('octopus --version 命令执行有警告:', stderr);
        }

        // 解析输出，格式通常为: "octopus 16.2 (git commit 28271023a8)"
        const versionMatch = stdout.match(/octopus\s+(\d+\.\d+)/i);
        if (versionMatch) {
            const version = versionMatch[1];
            console.log(`通过系统命令检测到 Octopus 版本: ${version}`);
            return version;
        }

        console.warn('无法从 octopus --version 输出中解析版本号:', stdout);
        return null;

    } catch (error) {
        // 命令执行失败（octopus 未安装或不在 PATH 中）
        console.log('无法执行 octopus --version 命令:', error.message);
        return null;
    }
}

/**
 * 尝试从文件内容中检测 Octopus 版本
 * @param {string} content 文件内容
 * @returns {string|null} 检测到的版本号，如果无法检测则返回null
 */
function detectVersionFromContent(content) {
    // 检查文件中是否有版本注释
    const versionCommentMatch = content.match(/(?:#|%)\s*octopus\s+version?\s*[:\-]?\s*(\d+\.\d+)/i);
    if (versionCommentMatch) {
        return versionCommentMatch[1];
    }

    // 检查是否有版本特定的变量或功能
    // 这里可以根据不同版本的特有功能来判断

    // 例如：某些变量只在特定版本中存在
    if (content.includes("SomeVariable16_2Only")) {
        return "16.2";
    }

    if (content.includes("SomeVariable14_1Only")) {
        return "14.1";
    }

    return null;
}

/**
 * 尝试从工作区中检测 Octopus 版本
 * @returns {Promise<string|null>} 检测到的版本号
 */
async function detectVersionFromWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return null;
    }

    // 查找可能包含版本信息的文件
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
                // 文件不存在或读取失败，继续尝试下一个
                continue;
            }
        }
    }

    return null;
}

/**
 * 尝试从当前活动文档检测版本
 * @returns {string|null} 检测到的版本号
 */
function detectVersionFromActiveDocument() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.languageId !== 'octopus') {
        return null;
    }

    return detectVersionFromContent(activeEditor.document.getText());
}

/**
 * 自动检测 Octopus 版本
 * @returns {Promise<string|null>} 检测到的版本号
 */
async function autoDetectVersion() {
    // 1. 首先尝试从系统命令检测（最可靠）
    let version = await detectVersionFromSystem();
    if (version) {
        return version;
    }

    // 2. 然后尝试从当前活动文档检测
    version = detectVersionFromActiveDocument();
    if (version) {
        return version;
    }

    // 3. 最后尝试从工作区检测
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
