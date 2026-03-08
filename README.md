# Calcifer - AI-Powered Webpage Understanding Assistant

🔥 像《哈尔的移动城堡》中的火焰恶魔一样，安静地理解通过的一切。

## 项目状态

✅ **所有核心功能已完成**

### Phase 1 - 基础架构 ✅
- [x] WXT + React + TypeScript + Tailwind 项目搭建
- [x] Side Panel 完整界面（Chat / Translate / Settings）
- [x] Background Service Worker
- [x] Content Script 页面内容提取
- [x] Zustand 状态管理
- [x] 基础 UI 组件和样式

### Phase 2 - AI Provider 集成 ✅
- [x] Vercel AI SDK 集成
- [x] OpenAI / Anthropic / Gemini 支持
- [x] 流式响应渲染
- [x] Context Builder（页面内容 + 问题）
- [x] 多 Provider 配置

### Phase 3 - 翻译功能 ✅
- [x] 内联翻译（Shadow DOM）
- [x] 段落级流式翻译
- [x] 语言选择器
- [x] 翻译样式（灰色文本 + 橙色边框）

### Phase 4 - 高级功能 ✅
- [x] 文本选择工具栏
- [x] 图片理解模式（可选）
- [x] Feature Flags 系统
- [x] Markdown 渲染（react-markdown）

## 当前功能

### 1. 页面问答
- 自动提取页面内容（Readability + Markdown）
- 支持流式 AI 响应
- Markdown 格式渲染
- 支持图片理解（可选，需在 Settings 中启用）

### 2. 内联翻译
- 段落级翻译
- 流式显示翻译结果
- Shadow DOM 隔离样式
- 支持多种目标语言

### 3. 文本选择工具栏
- 选中文本后自动显示
- 快捷操作：Ask AI / Translate / Explain
- 非侵入式设计（Shadow DOM）

### 4. 多 AI Provider 支持
- OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo)
- Anthropic (claude-opus-4, claude-sonnet-4, claude-haiku-3)
- Google Gemini (gemini-1.5-pro, gemini-1.5-flash)
- Ollama (本地模型)

### 5. 高级配置
- Temperature 调节
- Max Tokens 设置
- Feature Flags（图片理解、选择工具栏等）

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
5. 选择模型
6. 点击 Save Settings

### 2. 页面问答
1. 访问任意网页
2. 打开 Side Panel 的 Chat 页面
3. 输入问题
4. AI 会基于当前页面内容回答

### 3. 翻译页面
1. 打开 Side Panel 的 Translate 页面
2. 选择目标语言
3. 点击 Translate Page
4. 翻译会逐段显示在原文下方

### 4. 文本选择快捷操作
1. 在 Settings 中启用 Selection Toolbar
2. 选中页面上的任意文本
3. 使用浮动工具栏快速操作

## 技术栈

- **框架**: WXT (Manifest V3)
- **UI**: React 18 + Tailwind CSS + @tailwindcss/typography
- **状态**: Zustand
- **AI**: Vercel AI SDK
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
│   │   ├── translator/     # 翻译渲染
│   │   └── selection/      # 选择工具栏
│   ├── sidepanel/          # 主界面
│   │   └── pages/          # Chat / Translate / Settings
│   └── popup/              # 快捷入口
├── stores/                 # Zustand 状态管理
├── ai/                     # AI Provider 集成
├── shared/                 # 共享类型和常量
└── lib/                    # 工具函数
```

## 注意事项

- 需要有效的 API Key 才能使用 AI 功能
- 图片理解模式会消耗更多 tokens（每张图片约 500-1500 tokens）
- 翻译功能会逐段请求 AI，较长页面可能需要一些时间
- 刷新页面可以清除所有翻译

## 图标

项目使用火焰 emoji 🔥 作为临时图标。生产环境建议创建专业的图标文件：
- icon-16.png (16x16)
- icon-48.png (48x48)
- icon-128.png (128x128)

建议使用橙色 (#f97316) 火焰设计来代表 Calcifer。

## 开发说明

- 使用 `npm run dev` 会自动打开 Chrome 并加载扩展
- 修改代码后会自动热重载
- 构建输出在 `.output/chrome-mv3/` 目录
- 所有 AI 请求都通过 background service worker 处理
- API Key 存储在 chrome.storage.local 中

## 许可证

MIT
