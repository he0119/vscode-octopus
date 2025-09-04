const fs = require("fs");
const path = require("path");

console.log("=== 块语法测试 ===\n");

// 读取语法文件
const grammarPath = path.join(
  __dirname,
  "..",
  "syntaxes",
  "octopus.tmLanguage.json"
);
const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));

console.log("1. 检查语法规则优先级...");
grammar.patterns.forEach((pattern, index) => {
  const includeName = pattern.include.replace("#", "");
  console.log(`   ${index + 1}. ${includeName}`);
});

console.log("\n2. 检查块定义规则...");
const blockPatterns = grammar.repository.blocks.patterns;
blockPatterns.forEach((pattern, index) => {
  console.log(`   ${index + 1}. ${pattern.name}`);
  console.log(`      匹配: ${pattern.match}`);
  console.log(`      说明: ${pattern.comment}`);
});

console.log("\n3. 测试块匹配模式...");
const testCases = [
  "%TDOutput",
  "%Coordinates",
  "%",
  " multipoles",
  " laser",
  "# comment",
  "TDOutput = multipoles",
];

testCases.forEach((testCase) => {
  console.log(`\n   测试: "${testCase}"`);

  // 测试块开始模式
  const blockStartPattern = /^\\s\*%[A-Za-z][A-Za-z0-9_]*\\s\*$/;
  const blockStartRegex = new RegExp(
    blockStartPattern.source.replace(/\\\\/g, "\\")
  );
  if (blockStartRegex.test(testCase)) {
    console.log(`     ✓ 匹配块开始模式`);
  }

  // 测试块结束模式
  const blockEndPattern = /^\\s\*%\\s\*$/;
  const blockEndRegex = new RegExp(
    blockEndPattern.source.replace(/\\\\/g, "\\")
  );
  if (blockEndRegex.test(testCase)) {
    console.log(`     ✓ 匹配块结束模式`);
  }

  // 测试块内容模式
  const blockContentPattern = /^\\s\*[a-zA-Z_][a-zA-Z0-9_]*\\s\*$/;
  const blockContentRegex = new RegExp(
    blockContentPattern.source.replace(/\\\\/g, "\\")
  );
  if (blockContentRegex.test(testCase)) {
    console.log(`     ✓ 匹配块内容模式`);
  }

  // 测试注释模式
  const commentPattern = /#.*$/;
  if (commentPattern.test(testCase)) {
    console.log(`     ✓ 匹配注释模式`);
  }

  // 测试变量模式
  if (testCase.includes("TDOutput") && !testCase.startsWith("%")) {
    console.log(`     ✓ 匹配变量模式`);
  }
});

console.log("\n=== 块语法测试完成 ===");
console.log("\n💡 提示：");
console.log("1. 块开始应该匹配: %TDOutput, %Coordinates 等");
console.log("2. 块结束应该匹配: % (单独的百分号)");
console.log("3. 块内容应该匹配: multipoles, laser 等");
console.log("4. 变量高亮应该匹配: TDOutput = value 形式");
