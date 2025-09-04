const fs = require("fs");
const path = require("path");

/**
 * 解析 varinfo_orig 文件并提取 Octopus 参数信息
 */
function parseVarinfo() {
  const varinfoPath = path.join(__dirname, "varinfo_orig");
  const content = fs.readFileSync(varinfoPath, "utf8");

  const variables = [];
  const lines = content.split("\n");

  let currentVar = null;
  let inDescription = false;
  let descriptionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("Variable ")) {
      // 如果之前有变量，保存它
      if (currentVar) {
        currentVar.description = descriptionLines.join(" ").trim();
        variables.push(currentVar);
      }

      // 开始新的变量
      const varName = line.replace("Variable ", "");
      currentVar = {
        name: varName,
        type: "",
        default: "",
        section: "",
        description: "",
        options: [],
      };
      inDescription = false;
      descriptionLines = [];
    } else if (line.startsWith("Type ") && currentVar) {
      currentVar.type = line.replace("Type ", "");
    } else if (line.startsWith("Default ") && currentVar) {
      currentVar.default = line.replace("Default ", "");
    } else if (line.startsWith("Section ") && currentVar) {
      currentVar.section = line.replace("Section ", "");
    } else if (line === "Description" && currentVar) {
      inDescription = true;
    } else if (line.startsWith("Option ") && currentVar) {
      const optionMatch = line.match(/Option\s+(\w+)\s+(\d+)/);
      if (optionMatch) {
        currentVar.options.push({
          name: optionMatch[1],
          value: optionMatch[2],
        });
      }
      inDescription = false;
    } else if (line === "END") {
      if (currentVar) {
        currentVar.description = descriptionLines.join(" ").trim();
        variables.push(currentVar);
        currentVar = null;
        inDescription = false;
        descriptionLines = [];
      }
    } else if (inDescription && line !== "") {
      descriptionLines.push(line);
    }
  }

  return variables;
}

/**
 * 生成变量映射文件供插件使用
 */
function generateVariableMap(variables) {
  const map = {};

  variables.forEach((variable) => {
    // 生成文档 URL
    const sectionPath = variable.section
      .toLowerCase()
      .replace(/::/g, "/")
      .replace(/\s+/g, "_");
    const variableName = variable.name.toLowerCase();
    const docUrl = `https://octopus-code.org/documentation/14/variables/${sectionPath}/${variableName}/`;

    map[variable.name] = {
      type: variable.type,
      default: variable.default,
      section: variable.section,
      description: variable.description,
      options: variable.options,
      docUrl: docUrl,
    };
  });

  return map;
}

// 执行解析
console.log("解析 varinfo_orig 文件...");
const variables = parseVarinfo();
console.log(`找到 ${variables.length} 个变量`);

// 生成变量映射
const variableMap = generateVariableMap(variables);
const outputPath = path.join(__dirname, "..", "src", "variables.json");

// 确保 src 目录存在
const srcDir = path.dirname(outputPath);
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(variableMap, null, 2));
console.log(`变量映射已保存到: ${outputPath}`);

console.log("解析完成！");
