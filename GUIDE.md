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
   - 选择你的 AI Provider（推荐 OpenAI、Anthropic 或 Google Gemini）
   - 输入 API Key
   - 在模型输入框中选择候选模型或手动输入模型名（推荐 gpt-4o-mini 或 claude-sonnet-4）
   - 如使用 OpenRouter、Ollama 或自定义兼容接口，填写 Base URL
   - 点击 "Save Settings"
   - 可保存多个 Provider；Chat 输入框底部切换 Provider，模型只在 Settings 中配置

### 2. 页面问答

1. 访问任意网页（如新闻文章、博客等）
2. 打开 Side Panel
3. 在 Chat 标签中输入问题，例如：
   - "总结这篇文章的主要内容"
   - "作者的观点是什么？"
   - "这篇文章提到了哪些关键数据？"
4. AI 会基于页面内容实时回答

在流式输出过程中，Chat 页面会显示 `AgentAudioVisualizerAura` 动态状态条，
同步展示当前回答阶段（思考中/说话中）并提供更沉浸的交互感。

### 3. 选中文本翻译

1. 访问外语网页
2. 在页面中选中要翻译的文本
3. 点击浮动工具栏中的 "Translate"
4. Side Panel 会展示选中文本和操作按钮
5. 翻译结果会作为会话消息返回

### 4. 文本选择快捷操作

1. 在 Settings 中确保 "Selection Toolbar" 已启用
2. 在页面上选中任意文本
3. 会出现浮动工具栏，提供：
   - **Ask AI**: 在 Chat 中展示选中文本，便于继续追问
   - **Translate**: 在 Chat 中翻译选中文本
   - **Explain**: 在 Chat 中解释选中的内容

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

- **Max Retries**: 控制 AI 请求失败后的重试次数
  - 0 = 不重试
  - 2 = 默认重试两次
  - 5 = 最大值

## 支持的 AI Provider

### OpenAI
- 模型：gpt-4o, gpt-4o-mini, gpt-4-turbo
- API Key 格式：`sk-...`
- 获取：https://platform.openai.com/api-keys

### Anthropic
- 模型：claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
- API Key 格式：`sk-ant-...`
- 获取：https://console.anthropic.com/

### Google Gemini
- 模型：gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.5-pro
- API Key 格式：`AI...`
- 获取：https://makersuite.google.com/app/apikey

### DeepSeek
- 模型：deepseek-chat, deepseek-reasoner
- API Key 格式：DeepSeek 控制台生成的 key

### OpenAI-compatible
- 支持 OpenRouter、Ollama 和自定义 Base URL
- Base URL 通常以 `/v1` 结尾，例如 `https://api.example.com/v1`
- 模型可从列表选择，也可以手动填写 provider 支持的模型名
- 可在 Custom 中填写 provider options JSON

### Ollama (本地)
- 需要本地运行 Ollama
- Base URL：`http://localhost:11434/v1`
- API Key 可填写任意非空字符串

## 常见问题

### Q: 为什么 AI 没有回答？
A: 检查以下几点：
1. 是否配置了有效的 API Key
2. API Key 是否有余额
3. 网络连接是否正常
4. 打开浏览器控制台查看错误信息

### Q: 翻译速度很慢？
A: 翻译只处理选中文本。可以：
1. 选择更快的模型（如 gpt-4o-mini）
2. 缩短选中文本范围

### Q: 如何清除选中文本？
A: 点击选中文本操作区右侧的关闭按钮即可

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
- UI 使用 Dense but Calm 设计系统：暗灰主题、紧凑面板、卡西法橙 primary accent
- 支持 Chrome 和其他 Chromium 浏览器
- 开源项目，欢迎贡献
