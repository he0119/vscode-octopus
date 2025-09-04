const fs = require("fs");
const path = require("path");

console.log("=== Octopus 插件测试 ===\n");

// 测试 1: 检查生成的文件
console.log("1. 检查生成的文件...");
const requiredFiles = [
  "src/variables.json",
  "src/keywords.json",
  "src/extension.js",
  "syntaxes/octopus.tmLanguage.json",
];

let allFilesExist = true;
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file} 存在`);
  } else {
    console.log(`   ✗ ${file} 不存在`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log("\n❌ 部分必需文件缺失");
  process.exit(1);
}

// 测试 2: 检查变量数量
console.log("\n2. 检查变量数量...");
const variables = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "src", "variables.json"), "utf8")
);
const keywords = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "src", "keywords.json"), "utf8")
);

console.log(`   变量映射: ${Object.keys(variables).length} 个变量`);
console.log(`   关键词列表: ${keywords.length} 个关键词`);

if (Object.keys(variables).length !== keywords.length) {
  console.log("   ⚠️  变量数量不匹配");
} else {
  console.log("   ✓ 变量数量匹配");
}

// 测试 3: 检查几个重要变量
console.log("\n3. 检查重要变量...");
const testVariables = [
  "MixingScheme",
  "MaximumIter",
  "CalculationMode",
  "XCFunctional",
];
testVariables.forEach((varName) => {
  if (variables[varName]) {
    const variable = variables[varName];
    console.log(`   ✓ ${varName}:`);
    console.log(`     类型: ${variable.type}`);
    console.log(`     默认值: ${variable.default}`);
    console.log(`     章节: ${variable.section}`);
    console.log(`     文档链接: ${variable.docUrl}`);
  } else {
    console.log(`   ✗ ${varName} 不存在`);
  }
});

// 测试 4: 验证语法文件格式
console.log("\n4. 验证语法文件...");
try {
  const grammar = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "syntaxes", "octopus.tmLanguage.json"),
      "utf8"
    )
  );
  console.log(`   ✓ 语法文件 JSON 格式有效`);
  console.log(
    `   ✓ 包含 ${
      grammar.repository.variables.patterns[0].match.split("|").length
    } 个变量模式`
  );
} catch (e) {
  console.log(`   ✗ 语法文件格式错误: ${e.message}`);
}

// 测试 5: 检查文档链接格式
console.log("\n5. 检查文档链接格式...");
let validUrls = 0;
let totalUrls = 0;
for (const [varName, variable] of Object.entries(variables)) {
  totalUrls++;
  if (
    variable.docUrl &&
    variable.docUrl.startsWith(
      "https://octopus-code.org/documentation/14/variables/"
    )
  ) {
    validUrls++;
  }

  // 只显示前5个作为示例
  if (totalUrls <= 5) {
    console.log(`   ${varName}: ${variable.docUrl}`);
  }
}
console.log(`   ✓ ${validUrls}/${totalUrls} 个有效的文档链接`);

console.log("\n=== 测试完成 ===");
console.log("插件已准备就绪！可以在 VSCode 中按 F5 启动测试。");
console.log("\n使用方法:");
console.log("1. 在 VSCode 中打开 example.inp 文件");
console.log("2. 鼠标悬停在变量上查看文档");
console.log("3. Ctrl+点击变量跳转到在线文档");
console.log("4. 输入变量名享受自动完成功能");
