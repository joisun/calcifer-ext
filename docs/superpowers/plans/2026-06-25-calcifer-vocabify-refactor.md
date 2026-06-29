# Calcifer Vocabify-Style Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Calcifer's side panel and AI provider layer around Vocabify-style professional design and normalized provider agents.

**Architecture:** Add focused design tokens, a small theme layer, normalized AI provider configuration, and a reusable AI service. Keep Chat, Translate, Settings, feature flags, and persistence behavior intact while replacing the current visual language and provider switch implementation.

**Tech Stack:** WXT, React 18, TypeScript, Tailwind CSS, Zustand, Vercel AI SDK, Chrome Extension APIs.

---

### Task 1: Design Tokens And Theme Foundation

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/entrypoints/sidepanel/style.css`
- Create: `src/lib/theme.ts`
- Create: `src/components/theme/ThemeProvider.tsx`

- [ ] Add Tailwind semantic tokens for `background`, `foreground`, `surface`, `card`, `primary`, `muted`, `border`, `ring`, `success`, and `warning`.
- [ ] Add global CSS variables using charcoal dark surfaces and Calcifer orange primary.
- [ ] Add a small theme provider that applies `light` or `dark` class to `document.documentElement`.
- [ ] Keep all token names generic so sidepanel pages and UI components do not hard-code gray/orange classes.
- [ ] Run `npx tsc --noEmit`.

### Task 2: AI Provider Normalization

**Files:**
- Create: `src/ai/providers.ts`
- Modify: `src/shared/types.ts`
- Modify: `src/stores/config.ts`
- Modify: `src/lib/models.ts`

- [ ] Add `AI_PROVIDER_TEMPLATES`, `AiAgentApiKey`, `normalizeAgentConfigs`, and legacy config migration helpers.
- [ ] Update config store to load and save `agents` while migrating old `providerConfig` when needed.
- [ ] Update model fetching to support built-in providers, OpenAI-compatible providers, Google query-key models, and Anthropic headers.
- [ ] Add a focused test or compile-time verification for normalization behavior if test execution is available without new dependencies.
- [ ] Run `npx tsc --noEmit`.

### Task 3: AI Service And Background Streams

**Files:**
- Create: `src/ai/service.ts`
- Modify: `src/ai/router.ts`
- Modify: `src/entrypoints/background/index.ts`

- [ ] Replace direct provider switch usage with a service that creates models from normalized agents.
- [ ] Add retry, abort handling, provider-labeled errors, and bounded retry delay.
- [ ] Keep Chat stream protocol compatible with the existing `CHUNK`, `DONE`, and `ERROR` messages.
- [ ] Keep Translate stream protocol compatible with the existing `CHUNK`, `DONE`, and `ERROR` messages.
- [ ] Run `npx tsc --noEmit`.

### Task 4: Shared UI Components

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/Toast.tsx`
- Modify: `src/components/chat/ConversationDrawer.tsx`

- [ ] Replace hard-coded gray/orange classes with semantic token classes.
- [ ] Compact spacing and radius to match the Vocabify-style 8pt grid.
- [ ] Use borders and surface changes instead of heavy shadows.
- [ ] Keep accessibility labels and focus states visible.
- [ ] Run `npx tsc --noEmit`.

### Task 5: Sidepanel Workspace UI

**Files:**
- Modify: `src/entrypoints/sidepanel/App.tsx`
- Modify: `src/entrypoints/sidepanel/pages/Chat.tsx`
- Modify: `src/entrypoints/sidepanel/pages/Translate.tsx`
- Modify: `src/entrypoints/sidepanel/pages/Settings.tsx`

- [ ] Wrap the app with the theme provider.
- [ ] Replace the current bright header and tab buttons with compact workspace navigation.
- [ ] Convert Chat message bubbles into compact assistant/user rows and keep Markdown rendering.
- [ ] Convert Translate into a compact operation panel with clear status.
- [ ] Convert Settings into grouped provider, generation, and feature sections.
- [ ] Run `npx tsc --noEmit`.

### Task 6: Content UI Alignment

**Files:**
- Modify: `src/entrypoints/content/selection/toolbar.ts`
- Modify: `src/entrypoints/content/translator/renderer.ts`

- [ ] Align injected toolbar and translation display with charcoal surfaces, subtle borders, and constrained orange accent usage.
- [ ] Preserve Shadow DOM isolation.
- [ ] Run `npx tsc --noEmit`.

### Task 7: Build And Documentation Verification

**Files:**
- Modify: docs only if references require updates.

- [ ] Run `npm run build`.
- [ ] Run `git diff --name-only HEAD`.
- [ ] Run `find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"`.
- [ ] Scan changed file names, directories, and exported symbols against docs.
- [ ] Update matching docs, or report `扫描了文档树，无需同步`.
