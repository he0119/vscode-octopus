const fs = require("fs");
const path = require("path");

console.log("🔍 验证 Octopus 语法定义...\n");

try {
  // 1. 验证语法文件存在且格式正确
  const syntaxFile = path.join(
    __dirname,
    "..",
    "syntaxes",
    "octopus.tmLanguage.json"
  );
  const syntaxContent = fs.readFileSync(syntaxFile, "utf8");
  const syntax = JSON.parse(syntaxContent);

  console.log("✅ 语法文件 JSON 格式正确");

  // 2. 验证必要的模式是否存在
  const requiredPatterns = [
    "includes",
    "comments",
    "blocks",
    "scalar-assignments",
    "strings",
    "numbers",
    "mathematical-expressions",
    "predefined-constants",
    "operators",
  ];

  const missingPatterns = requiredPatterns.filter(
    (pattern) => !syntax.repository || !syntax.repository[pattern]
  );

  if (missingPatterns.length === 0) {
    console.log("✅ 所有必需的语法模式都已定义");
  } else {
    console.log("❌ 缺少语法模式:", missingPatterns.join(", "));
  }

  // 3. 验证特定功能
  console.log("\n🔧 语法功能检查:");

  // 检查注释支持
  if (
    syntax.repository.comments?.patterns?.some((p) => p.match?.includes("-"))
  ) {
    console.log("✅ 支持 - 注释");
  } else {
    console.log("❌ 缺少 - 注释支持");
  }

  // 检查包含语句支持
  if (
    syntax.repository.includes?.patterns?.some((p) =>
      p.match?.includes("include")
    )
  ) {
    console.log("✅ 支持 include 语句");
  } else {
    console.log("❌ 缺少 include 语句支持");
  }

  // 检查复数支持
  if (
    syntax.repository.numbers?.patterns?.some((p) =>
      p.name?.includes("complex")
    )
  ) {
    console.log("✅ 支持复数 {real, imag}");
  } else {
    console.log("❌ 缺少复数支持");
  }

  // 检查数学函数支持
  const mathFunctions = ["sqrt", "exp", "log", "sin", "cos"];
  const mathPattern = syntax.repository[
    "mathematical-expressions"
  ]?.patterns?.find((p) => p.name?.includes("function"));

  if (
    mathPattern &&
    mathFunctions.every((func) => mathPattern.match?.includes(func))
  ) {
    console.log("✅ 支持数学函数");
  } else {
    console.log("❌ 数学函数支持不完整");
  }

  // 检查预定义常量
  const constants = ["pi", "e", "angstrom", "eV"];
  const constantPattern = syntax.repository[
    "predefined-constants"
  ]?.patterns?.find((p) => p.name?.includes("constant"));

  if (
    constantPattern &&
    constants.every((const_) => constantPattern.match?.includes(const_))
  ) {
    console.log("✅ 支持预定义常量");
  } else {
    console.log("❌ 预定义常量支持不完整");
  }

  // 检查运算符支持
  const operators = ["+", "-", "*", "/", "^", "==", "&&", "||"];
  const operatorPatterns = syntax.repository.operators?.patterns || [];
  const hasArithmetic = operatorPatterns.some((p) =>
    p.name?.includes("arithmetic")
  );
  const hasComparison = operatorPatterns.some((p) =>
    p.name?.includes("comparison")
  );
  const hasLogical = operatorPatterns.some((p) => p.name?.includes("logical"));

  if (hasArithmetic && hasComparison && hasLogical) {
    console.log("✅ 支持所有运算符类型");
  } else {
    console.log("❌ 运算符支持不完整");
  }

  console.log("\n📊 语法定义统计:");
  console.log(`- 顶级模式数量: ${syntax.patterns?.length || 0}`);
  console.log(`- 仓库模式数量: ${Object.keys(syntax.repository || {}).length}`);

  console.log("\n✨ 语法验证完成！");
} catch (error) {
  console.error("❌ 验证失败:", error.message);
  process.exit(1);
}
