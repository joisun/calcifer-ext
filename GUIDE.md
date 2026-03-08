# Calcifer 使用指南

## 快速开始

### 1. 首次使用

1. **安装扩展**
   - 运行 `npm run dev` 启动开发模式
   - Chrome 会自动打开并加载扩展

2. **配置 API Key**
   - 点击浏览器工具栏的 🔥 图标
   - 点击 "Open Side Panel"
   - 切换到 "Settings" 标签
   - 选择你的 AI Provider（推荐 OpenAI 或 Anthropic）
   - 输入 API Key
   - 选择模型（推荐 gpt-4o-mini 或 claude-sonnet-4）
   - 点击 "Save Settings"

### 2. 页面问答

1. 访问任意网页（如新闻文章、博客等）
2. 打开 Side Panel
3. 在 Chat 标签中输入问题，例如：
   - "总结这篇文章的主要内容"
   - "作者的观点是什么？"
   - "这篇文章提到了哪些关键数据？"
4. AI 会基于页面内容实时回答

### 3. 翻译页面

1. 访问外语网页
2. 打开 Side Panel
3. 切换到 "Translate" 标签
4. 选择目标语言
5. 点击 "Translate Page"
6. 翻译会逐段显示在原文下方

### 4. 文本选择快捷操作

1. 在 Settings 中确保 "Selection Toolbar" 已启用
2. 在页面上选中任意文本
3. 会出现浮动工具栏，提供：
   - **Ask AI**: 询问关于选中文本的问题
   - **Translate**: 翻译选中的文本
   - **Explain**: 解释选中的内容

## 高级功能

### 图片理解模式

**注意：此功能会显著增加 token 消耗**

1. 在 Settings 中启用 "Image Understanding"
2. 启用后，AI 可以"看到"页面上的图片
3. 你可以问关于图片的问题，例如：
   - "图片中显示了什么？"
   - "这个图表说明了什么趋势？"

### 调整 AI 参数

- **Temperature**: 控制回答的创造性
  - 0.0 = 更确定、更一致
  - 1.0 = 更有创意、更多样

- **Max Tokens**: 控制回答的最大长度
  - 256 = 简短回答
  - 8192 = 详细回答

## 支持的 AI Provider

### OpenAI
- 模型：gpt-4o, gpt-4o-mini, gpt-4-turbo
- API Key 格式：`sk-...`
- 获取：https://platform.openai.com/api-keys

### Anthropic
- 模型：claude-opus-4, claude-sonnet-4, claude-haiku-3
- API Key 格式：`sk-ant-...`
- 获取：https://console.anthropic.com/

### Google Gemini
- 模型：gemini-1.5-pro, gemini-1.5-flash
- API Key 格式：`AI...`
- 获取：https://makersuite.google.com/app/apikey

### Ollama (本地)
- 需要本地运行 Ollama
- Base URL：`http://localhost:11434`
- 无需 API Key

## 常见问题

### Q: 为什么 AI 没有回答？
A: 检查以下几点：
1. 是否配置了有效的 API Key
2. API Key 是否有余额
3. 网络连接是否正常
4. 打开浏览器控制台查看错误信息

### Q: 翻译速度很慢？
A: 翻译是逐段进行的，较长的页面需要更多时间。可以：
1. 选择更快的模型（如 gpt-4o-mini）
2. 只翻译选中的文本而不是整个页面

### Q: 如何清除翻译？
A: 刷新页面即可清除所有翻译

### Q: 图片理解模式消耗多少 tokens？
A: 每张图片约 500-1500 tokens，取决于图片大小和复杂度

## 隐私说明

- API Key 存储在本地浏览器中（chrome.storage.local）
- 页面内容仅发送到你配置的 AI Provider
- 不会发送到任何第三方服务器
- 扩展不会收集或上传任何用户数据

## 开发者信息

- 项目基于 WXT 框架开发
- 使用 Manifest V3
- 支持 Chrome 和其他 Chromium 浏览器
- 开源项目，欢迎贡献
