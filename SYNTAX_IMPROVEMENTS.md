# Octopus 语法高亮改进

本文档记录了对 VS Code Octopus 扩展语法高亮功能的改进。

## 改进内容

### 1. 完整的语法支持

根据官方文档 https://octopus-code.org/documentation/14/manual/basics/input_file/ 进行了全面的语法规则整理：

#### 新增功能：

- ✅ `include` 语句高亮
- ✅ 标量变量赋值语法 (`variable = expression`)
- ✅ 复数支持 `{real, imag}`
- ✅ 科学计数法数字
- ✅ 数学函数高亮 (sin, cos, sqrt, exp, log 等)
- ✅ 预定义常量 (pi, e, angstrom, eV 等)
- ✅ 运算符分类高亮 (算术、比较、逻辑)
- ✅ 布尔值 (yes/no, true/false)
- ✅ 管道符 `|` 在块中的高亮

#### 改进功能：

- 🔧 更精确的数字匹配 (支持负数和科学计数法)
- 🔧 更好的块内容高亮
- 🔧 统一的颜色方案

### 2. 语法模式分类

新的语法定义包含以下模式：

1. **includes** - include 语句
2. **comments** - - 注释
3. **scalar-assignments** - 变量赋值
4. **blocks** - % 块定义
5. **strings** - 字符串 (单引号/双引号)
6. **numbers** - 数字 (整数、小数、科学计数法、复数)
7. **mathematical-expressions** - 数学函数
8. **predefined-constants** - 预定义常量
9. **boolean-values** - 布尔值
10. **operators** - 运算符
11. **variables** - 变量名

### 3. 颜色方案映射

| 语法元素 | VS Code 颜色作用域            | 默认颜色 |
| -------- | ----------------------------- | -------- |
| 注释     | `comment.line.dash`           | 灰色     |
| 字符串   | `string.quoted.double/single` | 绿色     |
| 数字     | `constant.numeric.*`          | 蓝色     |
| 布尔值   | `constant.language.boolean`   | 蓝色     |
| 函数     | `support.function.math`       | 黄色     |
| 常量     | `constant.language`           | 蓝色     |
| 变量名   | `variable.other`              | 白色     |
| 块名     | `entity.name.tag.block`       | 橙色     |
| 运算符   | `keyword.operator.*`          | 红色     |
| 关键字   | `keyword.control.import`      | 紫色     |

### 4. 支持的语法特性

#### 标量变量赋值

```octopus
CalculationMode = gs
Mixing = 0.3
Energy = 1.5*eV
BoxRadius = 3.5 * angstrom
```

#### 数学表达式

```octopus
Distance = sqrt(x^2 + y^2 + z^2)
Gaussian = exp(-0.5 * r^2)
Phase = sin(2*pi*x) + cos(2*pi*y)
```

#### 复数

```octopus
ComplexNumber = {1.0, 2.0}
WaveFunction = exp(i*k*x)
```

#### 块定义

```octopus
%Coordinates
 "H" | 0.0 | 0.0 | 0.0
 "O" | 0.0 | 0.0 | 1.8*angstrom
%

%Species
 "H" | species_pseudo | set
 "O" | species_pseudo | set
%
```

#### include 语句

```octopus
include geometry.oct
include parameters.inp
```

#### 运算符和逻辑表达式

```octopus
Condition1 = x > 0 && y <= 1.0
Condition2 = (a == b) || (c != d)
LogicalNot = !(x >= 0)
```

### 5. 验证和测试

创建了验证脚本 `scripts/validate-syntax.js` 来确保：

- JSON 语法正确性
- 所有必需模式存在
- 特定功能正常工作
- 语法覆盖完整性

## 使用方法

1. 打开任何 `.inp` 文件
2. 享受改进的语法高亮
3. 使用测试文件 `test-syntax.inp` 查看各种语法特性

## 技术细节

- 基于 TextMate 语法规则
- 兼容 VS Code 颜色主题
- 支持所有 Octopus 官方语法特性
- 遵循 VS Code 扩展最佳实践
