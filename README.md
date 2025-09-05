# Octopus VSCode 扩展

这是一个为 [Octopus](https://octopus-code.org/) 量子化学计算软件提供 VSCode 语言支持的扩展，提供完整的语法高亮、智能补全、实时验证和文档集成功能。

## 功能特性

### 🎨 语法高亮

基于 Octopus 14.1 官方文档的完整语法支持：

- **变量赋值**: `variable = expression` 格式高亮
- **数字支持**: 整数、小数、科学计数法、复数 `{real, imag}`
- **数学表达式**: sin, cos, sqrt, exp, log, erf 等 50+ 数学函数
- **预定义常量**: pi, e, angstrom, eV, rydberg, c 等物理常量
- **运算符**: 算术 (+, -, \*, /, ^)、比较 (==, <=, >=)、逻辑 (&&, ||, !)
- **布尔值**: yes/no, true/false, .true./.false.
- **字符串**: 单引号和双引号字符串
- **注释**: `#` 行注释
- **包含语句**: `include filename` 语法
- **块定义**: `%blockname` ... `%` 语法，支持管道符 `|` 分隔

### 📖 智能文档支持

- **Hover 提示**: 鼠标悬停在变量上显示详细信息
  - 变量类型和默认值
  - 所属章节
  - 详细描述
  - 可选值列表（如果有）
  - 直接链接到在线文档
- **文档跳转**: 一键访问 Octopus 官方文档

### 🏷️ Inlay Hints 变量标识

**新功能！** 通过 inlay hints 直观区分变量类型：

- **内置变量**: 显示 `[builtin]` ，表示 Octopus 官方变量
- **用户变量**: 显示 `[user]` ，表示用户自定义变量
- **智能提示**: 悬停显示变量详细信息和描述
- **可配置样式**: 支持文本标识和表情符号两种显示模式
- **灵活控制**: 可分别开关内置变量和用户变量的显示

配置选项：

```json
{
  "octopus.inlayHints.enabled": true,        // 启用/禁用 inlay hints
  "octopus.inlayHints.showBuiltin": true,    // 显示内置变量标识
  "octopus.inlayHints.showUser": true,       // 显示用户变量标识
  "octopus.inlayHints.style": "text"         // "text" 或 "emoji"
}
```

### ⚡ 智能编辑功能

- **自动完成**:
  - 变量名智能提示（758+ 个变量）
  - 变量值选项补全
  - 默认值建议
  - 类型相关的值建议
- **实时验证**:
  - 变量值类型检查
  - 预定义选项验证
  - 数学表达式识别
  - 错误下划线标记
- **快速修复**:
  - 自动修正为有效选项
  - 恢复默认值
  - 智能建议
- **命令功能**:
  - `Ctrl+Shift+P` → "显示所有 Octopus 变量"
  - 右键菜单快速访问
  - 变量搜索和文档跳转

## 安装

### 从源码安装

1. 克隆仓库：

   ```bash
   git clone https://github.com/he0119/vscode-octopus.git
   cd vscode-octopus
   ```

2. 安装依赖（如果需要）：

   ```bash
   npm install
   ```

3. 调试模式运行：
   - 在 VSCode 中打开项目文件夹
   - 按 `F5` 启动调试实例

4. 打包安装：

   ```bash
   npm install -g vsce
   vsce package
   code --install-extension octopus-0.0.1.vsix
   ```

### 从 VSCode 扩展市场安装

> 即将发布到 VSCode 扩展市场

## 使用方法

1. **创建输入文件**: 创建或打开 `.inp` 文件
2. **享受语法高亮**: 自动识别 Octopus 语法并高亮显示
3. **智能补全**: 输入变量名时享受自动完成功能
4. **查看文档**: 鼠标悬停查看变量详细信息
5. **验证输入**: 实时检查变量值的有效性
6. **快速修复**: 使用 `Ctrl+.` 快速修复错误值
7. **访问文档**: 点击 hover 提示中的链接跳转到官方文档
8. **变量标识**: 通过 inlay hints 区分内置变量和用户变量

### 可用命令

- **Octopus: 显示所有 Octopus 变量** - 列出当前版本支持的所有变量
- **Octopus: 切换 Octopus 版本** - 在不同版本间切换
- **Octopus: 自动检测 Octopus 版本** - 根据文件内容检测版本
- **Octopus: 检测系统安装的 Octopus 版本** - 检测系统中安装的版本
- **Octopus: 切换 Inlay Hints 显示** - 开启/关闭变量类型标识

## 示例

```octopus
# 计算模式设置
CalculationMode = gs          # [builtin] 基态计算
TheoryLevel = dft             # [builtin] 密度泛函理论

# SCF 参数设置  
MixingScheme = broyden        # [builtin] Broyden 混合方案
Mixing = 0.3                  # [builtin] 混合参数
MaximumIter = 100             # [builtin] 最大迭代次数

# 用户自定义参数
MyCustomRadius = 5.0          # [user] 用户定义的半径
UserBoxSize = 10.0            # [user] 用户定义的盒子大小

# 交换相关泛函
XCFunctional = lda            # [builtin] LDA 泛函

# 网格设置
Spacing = 0.25 * angstrom     # [builtin] 支持数学表达式
BoxShape = minimum            # [builtin] 最小盒子形状

# 系统定义
%Coordinates
  "H" | 0.0 | 0.0 | 0.0
  "H" | 0.0 | 0.0 | 1.4 * angstrom
%
```

> 注：示例中的 `[builtin]` 和 `[user]` 标识会在实际使用中以 inlay hints 的形式显示在变量名后面。

## 支持的文件类型

- `.inp` - Octopus 输入文件（主要）
- 任何标识为 `octopus` 语言的文件

## 变量覆盖范围

插件支持 **758+ 个 Octopus 14.1 变量**，覆盖所有主要功能模块：

### 核心计算设置

- **CalculationMode** - 计算模式（基态、时域等）
- **TheoryLevel** - 理论级别（DFT、Hartree 等）
- **XCFunctional** - 交换相关泛函

### SCF 收敛控制

- **MaximumIter** - 最大 SCF 迭代次数
- **ConvRelDens** - 密度收敛标准
- **MixingScheme** - 密度混合方案
- **Mixing** - 混合参数

### 网格和几何

- **Spacing** - 网格间距
- **BoxShape** - 盒子形状
- **Radius** - 球形盒子半径

### 时间演化

- **TDTimeStep** - 时间步长
- **TDMaxSteps** - 最大时间步数
- **TDEvolutionMethod** - 时间演化方法

### 输出控制

- **Output** - 输出内容控制
- **OutputHow** - 输出格式控制
- **OutputInterval** - 输出间隔

### 以及更多模块

- 原子结构定义
- 激发态计算
- 光谱计算
- 优化算法
- 并行计算设置

## 技术特性

### 实时验证引擎

- **类型检查**: 自动验证 integer、float、logical、string 类型
- **选项验证**: 检查预定义选项的有效性
- **数学表达式**: 识别并支持复杂数学表达式
- **组合选项**: 支持用 `+` 连接的多选项验证

### 智能补全系统

- **上下文感知**: 根据变量位置提供相应补全
- **类型匹配**: 根据变量类型提供合适的值建议
- **默认值推荐**: 智能推荐官方默认值
- **选项展示**: 完整显示所有可用选项

### 文档集成

- **在线链接**: 自动生成 Octopus 官方文档链接
- **本地缓存**: 变量信息本地存储，快速响应
- **版本同步**: 基于 Octopus 14.1 varinfo 数据

## 开发和贡献

### 项目结构

```text
vscode-octopus/
├── src/
│   ├── extension.js          # 主要扩展逻辑
│   └── varinfo-14.1.json     # 自动生成的变量数据库
├── syntaxes/
│   └── octopus.tmLanguage.json  # TextMate 语法文件
├── scripts/                  # 构建和解析脚本
├── tests/                    # 测试文件和示例
└── package.json             # 扩展清单
```

### 贡献指南

欢迎提交 Issue 和 Pull Request！

1. **Bug 报告**: 请提供具体的输入文件和错误描述
2. **功能请求**: 说明需要的功能和使用场景
3. **代码贡献**:
   - Fork 项目并创建特性分支
   - 添加测试覆盖新功能
   - 确保所有测试通过
   - 提交 Pull Request

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的版本更新信息。

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 相关链接

- [Octopus 官方网站](https://octopus-code.org/)
- [Octopus 14.1 文档](https://octopus-code.org/documentation/14/)
- [VSCode 扩展开发文档](https://code.visualstudio.com/api)
