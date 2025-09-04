const fs = require("fs");
const path = require("path");

// 读取关键词列表
const keywordsPath = path.join(__dirname, "..", "src", "keywords.json");
const keywords = JSON.parse(fs.readFileSync(keywordsPath, "utf8"));

// 生成语法高亮模式
const pattern = keywords.join("|");

const grammar = {
  $schema:
    "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  name: "Octopus",
  patterns: [
    {
      include: "#variables",
    },
    {
      include: "#comments",
    },
    {
      include: "#strings",
    },
    {
      include: "#numbers",
    },
    {
      include: "#blocks",
    },
  ],
  repository: {
    variables: {
      patterns: [
        {
          name: "variable.parameter.octopus",
          match: `\\b(${pattern})\\b`,
          comment: "Octopus variables",
        },
      ],
    },
    comments: {
      patterns: [
        {
          name: "comment.line.number-sign.octopus",
          match: "#.*$",
          comment: "Line comments starting with #",
        },
        {
          name: "comment.line.percent.octopus",
          match: "%.*$",
          comment: "Line comments starting with %",
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: "string.quoted.double.octopus",
          begin: '"',
          end: '"',
          patterns: [
            {
              name: "constant.character.escape.octopus",
              match: "\\\\.",
            },
          ],
        },
        {
          name: "string.quoted.single.octopus",
          begin: "'",
          end: "'",
          patterns: [
            {
              name: "constant.character.escape.octopus",
              match: "\\\\.",
            },
          ],
        },
      ],
    },
    numbers: {
      patterns: [
        {
          name: "constant.numeric.decimal.octopus",
          match: "\\b\\d+\\.\\d+([eE][+-]?\\d+)?\\b",
          comment: "Decimal numbers",
        },
        {
          name: "constant.numeric.integer.octopus",
          match: "\\b\\d+\\b",
          comment: "Integer numbers",
        },
      ],
    },
    blocks: {
      patterns: [
        {
          name: "keyword.control.block.octopus",
          match: "\\b(yes|no|true|false)\\b",
          comment: "Boolean values",
        },
        {
          name: "storage.type.block.octopus",
          match: "^\\s*%.*",
          comment: "Block definitions",
        },
      ],
    },
  },
  scopeName: "source.octopus",
};

// 保存更新的语法文件
const outputPath = path.join(
  __dirname,
  "..",
  "syntaxes",
  "octopus.tmLanguage.json"
);
fs.writeFileSync(outputPath, JSON.stringify(grammar, null, 2));

console.log(`语法高亮文件已更新: ${outputPath}`);
console.log(`包含 ${keywords.length} 个 Octopus 变量`);
