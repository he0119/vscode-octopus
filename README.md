# Octopus VSCode 扩展

这是一个为 [Octopus](https://octopus-code.org/) 量子化学计算软件提供 VSCode 语言支持的扩展。

## 功能特性

### 🎨 语法高亮

- 高亮所有 758 个 Octopus 变量参数
- 支持注释语法（# 和 %）
- 高亮字符串、数字和布尔值
- 支持块定义语法

### 📖 文档支持

- **Hover 提示**: 鼠标悬停在变量上显示详细信息
  - 变量类型和默认值
  - 所属章节
  - 详细描述
  - 可选值列表
  - 直接链接到在线文档

### 🔗 文档跳转

- 点击变量可直接跳转到 Octopus 官方文档
- 支持所有变量的文档链接格式：`https://octopus-code.org/documentation/14/variables/{section}/`

### ⚡ 智能功能

- **自动完成**: 输入时提供变量名建议
- **命令面板**: `Ctrl+Shift+P` → "显示所有 Octopus 变量" 快速搜索所有可用变量
- **右键菜单**: 在 `.inp` 文件中右键可快速访问变量列表

## 安装

1. 在 VSCode 中打开插件
2. 按 `F5` 启动开发模式，或者
3. 打包安装：

   ```bash
   npm install -g vsce
   vsce package
   code --install-extension octopus-0.0.1.vsix
   ```

## 使用方法

1. 创建或打开 `.inp` 文件
2. 开始输入 Octopus 变量名，享受语法高亮和自动完成
3. 鼠标悬停查看变量文档
4. `Ctrl/Cmd + 点击` 变量跳转到在线文档

## 示例

```octopus
# SCF 参数设置
MixingScheme = broyden  # 鼠标悬停查看详细说明
Mixing = 0.3           # 支持自动完成
MaximumIter = 100      # 点击跳转到文档

# 系统定义
CalculationMode = gs
TheoryLevel = dft
```

## 支持的文件扩展名

- `.inp` - Octopus 输入文件

## 变量覆盖范围

插件支持 758 个 Octopus 变量，覆盖所有主要功能模块：

- SCF 收敛参数
- 网格和盒子设置
- 理论级别和交换相关泛函
- 时间相关计算
- 输出控制
- 系统定义
- 以及更多...

## 开发

插件基于 `varinfo_orig` 文件自动生成变量映射和语法高亮规则。

更新变量信息：

```bash
node scripts/parse-varinfo.js
node scripts/update-syntax.js
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
