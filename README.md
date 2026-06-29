# Calcifer - AI-Powered Webpage Understanding Assistant

🔥 像《哈尔的移动城堡》中的火焰恶魔一样，安静地理解通过的一切。

界面遵循 **Dense but Calm**：暗灰专业主题、紧凑信息密度、border 优先，卡西法橙只用于当前状态、焦点和主要动作。

## 项目状态

✅ **所有核心功能已完成**

### Phase 1 - 基础架构 ✅
- [x] WXT + React + TypeScript + Tailwind 项目搭建
- [x] Side Panel 完整界面（Chat workspace / Settings）
- [x] Background Service Worker
- [x] Content Script 页面内容提取
- [x] Zustand 状态管理
- [x] 基础 UI 组件和样式

### Phase 2 - AI Provider 集成 ✅
- [x] Vercel AI SDK 集成
- [x] OpenAI / Anthropic / Google Gemini / DeepSeek 支持
- [x] OpenAI-compatible Provider（OpenRouter / Ollama / Custom Base URL）
- [x] 流式响应渲染
- [x] Context Builder（页面内容 + 问题）
- [x] Provider agents 配置、旧配置迁移、运行时 provider 切换、重试和中断处理

### Phase 3 - 选中文本理解 ✅
- [x] 选中文本翻译
- [x] 选中文本解释
- [x] 选中文本上下文问答
- [x] 会话内返回结果

### Phase 4 - 高级功能 ✅
- [x] 文本选择工具栏
- [x] 图片理解模式（可选）
- [x] Feature Flags 系统
- [x] Markdown 渲染（react-markdown）
- [x] Chat 思考态可视化（LiveKit Aura）

## 当前功能

### 1. 页面问答
- 自动提取页面内容（Readability + Markdown）
- 支持流式 AI 响应
- Markdown 格式渲染
- 支持图片理解（可选，需在 Settings 中启用）

### 2. 选中文本翻译 / 理解
- 选中文本后显示快捷工具栏
- Translate / Explain 结果在 Chat 会话内返回
- Ask 会把选中文本带入当前会话
- 不再向页面注入整页翻译内容

### 3. 文本选择工具栏
- 选中文本后自动显示
- 快捷操作：Ask AI / Translate / Explain
- 非侵入式设计（Shadow DOM）

### 4. 多 AI Provider 支持
- OpenAI (gpt-4o-mini, gpt-4o, o4-mini)
- Anthropic (claude-3-5-sonnet, claude-3-5-haiku)
- Google Gemini (gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.5-pro)
- DeepSeek (deepseek-chat, deepseek-reasoner)
- OpenAI-compatible Provider（OpenRouter / Ollama / Custom Base URL）

### 5. 高级配置
- Temperature 调节
- Max Tokens 设置
- AI 请求重试次数
- Feature Flags（图片理解、选择工具栏等）
- 思考态可视化（加载中显示 Aura）

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（自动打开 Chrome）
npm run dev

# 构建生产版本
npm run build

# 打包为 zip（用于发布）
npm run zip
```

## 使用方法

### 1. 配置 API Key
1. 点击扩展图标打开 Side Panel
2. 切换到 Settings 页面
3. 选择 AI Provider
4. 输入 API Key
5. 在模型输入框中选择候选模型或手动填写模型名
6. 点击 Save Settings
7. 可重复保存多个 Provider；Chat 输入框底部只切换已配置 Provider，模型始终在 Settings 中配置

### 2. 页面问答
1. 访问任意网页
2. 打开 Side Panel 的 Chat 页面
3. 输入问题
4. AI 会基于当前页面内容回答

### 3. 选中文本翻译
1. 在网页中选中文本
2. 点击浮动工具栏的 Translate
3. Side Panel 会在选中文本上方展示操作区
4. 翻译结果会作为会话消息返回

### 4. 文本选择快捷操作
1. 在 Settings 中启用 Selection Toolbar
2. 选中页面上的任意文本
3. 使用浮动工具栏快速操作；Ask 会预填 Chat，Translate / Explain 会在 Chat 中直接生成结果

## 技术栈

- **框架**: WXT (Manifest V3)
- **UI**: React 18 + Tailwind CSS + 21st Agent Elements + @tailwindcss/typography
- **状态**: Zustand
- **AI**: Vercel AI SDK + normalized provider agents
- **提取**: @mozilla/readability + Turndown
- **渲染**: react-markdown + rehype-highlight
- **图标**: Lucide React

## 项目结构

```
src/
├── entrypoints/
│   ├── background/         # Service Worker (AI 路由)
│   ├── content/            # Content Script
│   │   ├── extractor/      # 页面内容提取
│   │   └── selection/      # 选择工具栏
│   ├── sidepanel/          # Dense but Calm 主界面
│   │   └── pages/          # Chat workspace / Settings
│   └── popup/              # 快捷入口
├── components/
│   └── agent-elements/     # 21st Agent Elements 聊天、输入、消息和 loader 组件
├── stores/                 # Zustand 状态管理
├── ai/                     # AI Provider agents / service
├── shared/                 # 共享类型和常量
└── lib/                    # 工具函数
```

## 注意事项

- 需要有效的 API Key 才能使用 AI 功能
- 图片理解模式会消耗更多 tokens（每张图片约 500-1500 tokens）
- 翻译只针对选中文本，不会向页面注入整页翻译
- 新版 Settings 会自动迁移旧版 `providerConfig` 到 provider agents
- Chat 页面使用 21st Agent Elements 渲染消息、输入框和生成中状态

## 图标

项目使用火焰 emoji 🔥 作为临时图标。生产环境建议创建专业的图标文件：
- icon-16.png (16x16)
- icon-48.png (48x48)
- icon-128.png (128x128)

建议使用卡西法橙 (#f97316) 火焰设计来代表 Calcifer。该颜色在 UI 中只作为 primary accent 使用。

## 开发说明

- 使用 `npm run dev` 会自动打开 Chrome 并加载扩展
- 修改代码后会自动热重载
- 构建输出在 `.output/chrome-mv3/` 目录
- 所有 AI 请求都通过 background service worker 处理
- API Key 存储在 chrome.storage.local 中

## 许可证

MIT
