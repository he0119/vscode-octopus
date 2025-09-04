const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class OctopusTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  log(message, type = "info") {
    const symbols = { info: "ℹ", success: "✓", error: "✗", warning: "⚠" };
    console.log(`${symbols[type]} ${message}`);
  }

  test(description, testFn) {
    try {
      this.results.total++;
      const result = testFn();
      if (result !== false) {
        this.results.passed++;
        this.log(description, "success");
        this.results.details.push({ test: description, status: "passed" });
      } else {
        this.results.failed++;
        this.log(description, "error");
        this.results.details.push({ test: description, status: "failed" });
      }
    } catch (error) {
      this.results.failed++;
      this.log(`${description} - ${error.message}`, "error");
      this.results.details.push({
        test: description,
        status: "failed",
        error: error.message,
      });
    }
  }

  async runAllTests() {
    console.log("=== Octopus VSCode Extension Test Suite ===\n");

    this.testFileExistence();
    this.testGrammarStructure();
    this.testRegexPatterns();
    this.testVariableValidation();
    this.testSyntaxHighlighting();

    this.printSummary();
  }

  testFileExistence() {
    console.log("1. 文件存在性测试");
    console.log("─".repeat(50));

    const requiredFiles = [
      "src/variables.json",
      "src/extension.js",
      "syntaxes/octopus.tmLanguage.json",
      "package.json",
    ];

    requiredFiles.forEach((file) => {
      this.test(`检查文件 ${file} 是否存在`, () => {
        const filePath = path.join(__dirname, "..", file);
        return fs.existsSync(filePath);
      });
    });
    console.log();
  }

  testGrammarStructure() {
    console.log("2. 语法结构测试");
    console.log("─".repeat(50));

    this.test("语法文件格式正确", () => {
      const grammarPath = path.join(
        __dirname,
        "..",
        "syntaxes",
        "octopus.tmLanguage.json"
      );
      const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));
      return grammar.patterns && grammar.repository && grammar.scopeName;
    });

    this.test("块语法规则存在", () => {
      const grammarPath = path.join(
        __dirname,
        "..",
        "syntaxes",
        "octopus.tmLanguage.json"
      );
      const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));
      return grammar.repository.blocks && grammar.repository.blocks.patterns;
    });

    this.test("变量语法规则存在", () => {
      const grammarPath = path.join(
        __dirname,
        "..",
        "syntaxes",
        "octopus.tmLanguage.json"
      );
      const grammar = JSON.parse(fs.readFileSync(grammarPath, "utf8"));
      return grammar.repository.variables && grammar.repository.comments;
    });
    console.log();
  }

  testRegexPatterns() {
    console.log("3. 正则表达式模式测试");
    console.log("─".repeat(50));

    // 块开始模式测试
    const blockStartRegex = /^\s*%[A-Za-z][A-Za-z0-9_]*\s*$/;
    const blockStartTests = [
      { input: "%TDOutput", expected: true },
      { input: "%Coordinates", expected: true },
      { input: "  %Multipoles  ", expected: true },
      { input: "%123Invalid", expected: false },
      { input: "NotABlock", expected: false },
    ];

    blockStartTests.forEach(({ input, expected }) => {
      this.test(`块开始模式: "${input}" -> ${expected}`, () => {
        return blockStartRegex.test(input) === expected;
      });
    });

    // 块结束模式测试
    const blockEndRegex = /^\s*%\s*$/;
    const blockEndTests = [
      { input: "%", expected: true },
      { input: "  %  ", expected: true },
      { input: "%something", expected: false },
      { input: "not%", expected: false },
    ];

    blockEndTests.forEach(({ input, expected }) => {
      this.test(`块结束模式: "${input}" -> ${expected}`, () => {
        return blockEndRegex.test(input) === expected;
      });
    });

    // 块内容模式测试
    const blockContentRegex = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/;
    const blockContentTests = [
      { input: "multipoles", expected: true },
      { input: "  laser  ", expected: true },
      { input: "_private_var", expected: true },
      { input: "123invalid", expected: false },
      { input: "with spaces", expected: false },
    ];

    blockContentTests.forEach(({ input, expected }) => {
      this.test(`块内容模式: "${input}" -> ${expected}`, () => {
        return blockContentRegex.test(input) === expected;
      });
    });
    console.log();
  }

  testVariableValidation() {
    console.log("4. 变量验证测试");
    console.log("─".repeat(50));

    this.test("变量文件可以加载", () => {
      const variablesPath = path.join(__dirname, "..", "src", "variables.json");
      const variables = JSON.parse(fs.readFileSync(variablesPath, "utf8"));
      return Object.keys(variables).length > 0;
    });

    this.test("重要变量存在", () => {
      const variablesPath = path.join(__dirname, "..", "src", "variables.json");
      const variables = JSON.parse(fs.readFileSync(variablesPath, "utf8"));
      const importantVars = [
        "CalculationMode",
        "MixingScheme",
        "XCFunctional",
        "MaximumIter",
      ];
      return importantVars.every((varName) => variables[varName]);
    });

    this.test("变量具有正确的结构", () => {
      const variablesPath = path.join(__dirname, "..", "src", "variables.json");
      const variables = JSON.parse(fs.readFileSync(variablesPath, "utf8"));
      const firstVar = Object.values(variables)[0];
      return firstVar && firstVar.type && firstVar.description;
    });
    console.log();
  }

  testSyntaxHighlighting() {
    console.log("5. 语法高亮测试");
    console.log("─".repeat(50));

    // 科学记数法测试
    const scientificNotationRegex = /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)/;
    const scientificTests = [
      { input: "1e-6", expected: true },
      { input: "2.5e-3", expected: true },
      { input: "1.5E+2", expected: true },
      { input: "-1e-4", expected: true },
      { input: "3.14159e0", expected: true },
      { input: "not_a_number", expected: false },
    ];

    scientificTests.forEach(({ input, expected }) => {
      this.test(`科学记数法: "${input}" -> ${expected}`, () => {
        return scientificNotationRegex.test(input) === expected;
      });
    });

    // 逻辑值测试
    const logicalRegex = /^(true|false|yes|no)$/i;
    const logicalTests = [
      { input: "true", expected: true },
      { input: "false", expected: true },
      { input: "yes", expected: true },
      { input: "no", expected: true },
      { input: "TRUE", expected: true },
      { input: "invalid_logical", expected: false },
    ];

    logicalTests.forEach(({ input, expected }) => {
      this.test(`逻辑值: "${input}" -> ${expected}`, () => {
        return logicalRegex.test(input) === expected;
      });
    });

    // 组合表达式测试（如 XCFunctional = lda_x + lda_c_vwn）
    const combinationRegex = /\w+\s*\+\s*\w+/;
    const combinationTests = [
      { input: "lda_x + lda_c_vwn", expected: true },
      { input: "gga_x_pbe + gga_c_pbe", expected: true },
      { input: "single_value", expected: false },
    ];

    combinationTests.forEach(({ input, expected }) => {
      this.test(`组合表达式: "${input}" -> ${expected}`, () => {
        return combinationRegex.test(input) === expected;
      });
    });
    console.log();
  }

  printSummary() {
    console.log("=== 测试结果摘要 ===");
    console.log("─".repeat(50));
    console.log(`总计: ${this.results.total} 个测试`);
    console.log(`通过: ${this.results.passed} 个`);
    console.log(`失败: ${this.results.failed} 个`);
    console.log(
      `成功率: ${((this.results.passed / this.results.total) * 100).toFixed(
        1
      )}%`
    );

    if (this.results.failed > 0) {
      console.log("\n失败的测试:");
      this.results.details
        .filter((detail) => detail.status === "failed")
        .forEach((detail) => {
          console.log(`  ✗ ${detail.test}`);
          if (detail.error) {
            console.log(`    错误: ${detail.error}`);
          }
        });
    }

    console.log(
      `\n测试${this.results.failed === 0 ? "全部通过" : "存在失败"}！`
    );

    // 退出码：0表示成功，1表示失败
    process.exit(this.results.failed === 0 ? 0 : 1);
  }
}

// 运行测试
if (require.main === module) {
  const testSuite = new OctopusTestSuite();
  testSuite.runAllTests();
}

module.exports = OctopusTestSuite;
