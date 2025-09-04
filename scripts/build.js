const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 构建 Octopus VSCode 扩展...\n");

try {
  // 步骤 1: 解析 varinfo_orig
  console.log("1️⃣ 解析 Octopus 变量信息...");
  execSync("node scripts/parse-varinfo.js", { stdio: "inherit" });

  // 步骤 2: 运行测试
  console.log("\n2️⃣ 运行测试...");
  execSync("node scripts/test-plugin.js", { stdio: "inherit" });

  console.log("\n✅ 构建完成！");
  console.log("\n🎯 下一步:");
  console.log("1. 在 VSCode 中按 F5 启动调试模式");
  console.log("2. 在新窗口中打开 example.inp 文件");
  console.log("3. 测试语法高亮、hover 和跳转功能");
  console.log("\n📦 打包扩展 (可选):");
  console.log("   npm install -g vsce");
  console.log("   vsce package");
} catch (error) {
  console.error("❌ 构建失败:", error.message);
  process.exit(1);
}
