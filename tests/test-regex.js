const testCases = [
  "%TDOutput",
  "%Coordinates",
  "%",
  " multipoles",
  " laser",
  "multipoles",
  "laser",
];

console.log("=== 正则表达式测试 ===\n");

// 块开始模式
const blockStartRegex = /^\s*%[A-Za-z][A-Za-z0-9_]*\s*$/;
console.log("块开始模式:", blockStartRegex.source);

// 块结束模式
const blockEndRegex = /^\s*%\s*$/;
console.log("块结束模式:", blockEndRegex.source);

// 块内容模式
const blockContentRegex = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/;
console.log("块内容模式:", blockContentRegex.source);

console.log("\n测试结果:");
testCases.forEach((testCase) => {
  console.log(`\n"${testCase}":`);

  if (blockStartRegex.test(testCase)) {
    console.log("  ✓ 块开始");
  }

  if (blockEndRegex.test(testCase)) {
    console.log("  ✓ 块结束");
  }

  if (blockContentRegex.test(testCase)) {
    console.log("  ✓ 块内容");
  }

  if (
    !blockStartRegex.test(testCase) &&
    !blockEndRegex.test(testCase) &&
    !blockContentRegex.test(testCase)
  ) {
    console.log("  - 无匹配");
  }
});
