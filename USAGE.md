# Octopus VSCode 扩展使用指南

## 🎉 插件已构建完成！

您的 Octopus VSCode 扩展已经成功构建，包含以下功能：

### ✨ 主要功能

1. **语法高亮** - 自动高亮 758 个 Octopus 变量
2. **智能提示** - 鼠标悬停显示详细文档
3. **文档跳转** - 点击变量直接跳转到官方文档
4. **自动完成** - 输入时提供变量建议
5. **快速搜索** - 命令面板快速查找变量

### 🚀 启动测试

1. **启动调试模式**：

   - 在 VSCode 中打开项目文件夹
   - 按 `F5` 启动扩展宿主
   - 等待新的 VSCode 窗口打开

2. **测试功能**：
   - 在新窗口中打开 `example.inp` 文件
   - 鼠标悬停在变量名上（如 `MixingScheme`）查看文档
   - `Ctrl+点击` 变量跳转到在线文档
   - 开始输入变量名体验自动完成

### 📝 示例文件

```octopus
# SCF 收敛参数
MixingScheme = broyden     # 悬停查看：混合方案设置
Mixing = 0.3              # 悬停查看：混合参数
MaximumIter = 100         # 悬停查看：最大迭代次数

# 系统定义
CalculationMode = gs      # 悬停查看：计算模式
TheoryLevel = dft         # 悬停查看：理论级别
XCFunctional = lda_x + lda_c_vwn  # 悬停查看：交换相关泛函

# 盒子和网格
BoxShape = sphere         # 悬停查看：盒子形状
Radius = 5.0             # 悬停查看：半径设置
Spacing = 0.25           # 悬停查看：网格间距
```

### 🛠️ 自定义功能

- **右键菜单**: 在 `.inp` 文件中右键 → "显示所有 Octopus 变量"
- **命令面板**: `Ctrl+Shift+P` → 输入 "Octopus" 查看可用命令

### 📚 支持的变量

插件支持 Octopus 的所有主要变量，包括：

- **SCF 参数**: MixingScheme, Mixing, MaximumIter, ConvRelDens...
- **系统设置**: CalculationMode, TheoryLevel, XCFunctional...
- **网格配置**: BoxShape, Radius, Spacing, MeshOrder...
- **时间演化**: TDPropagator, TDTimeStep, TDMaxSteps...
- **输出控制**: Output, OutputFormat, OutputInterval...
- **以及更多**: 总共 758 个变量！

### 🔗 文档链接

所有变量都链接到官方文档：

- 基础 URL: `https://octopus-code.org/documentation/14/variables/`
- 自动解析章节路径（如 `SCF::Mixing` → `/scf/mixing/`）

### 🐛 故障排除

如果插件不工作：

1. 确保文件扩展名是 `.inp`
2. 重新运行构建脚本：`node scripts/build.js`
3. 重启 VSCode 调试会话

### 📦 打包发布

要创建 `.vsix` 安装包：

```bash
npm install -g vsce
vsce package
```

这将生成 `octopus-0.0.1.vsix` 文件，可以通过以下方式安装：

```bash
code --install-extension octopus-0.0.1.vsix
```

### 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进插件！

---

**🎊 恭喜！您的 Octopus VSCode 扩展已准备就绪！**
