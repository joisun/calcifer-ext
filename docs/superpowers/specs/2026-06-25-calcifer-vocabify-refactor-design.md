# Calcifer Vocabify-Style Refactor Design

## Goal

Refactor Calcifer into a dense, calm, professional browser-extension workspace inspired by Vocabify's `CLAUDE.md`, while keeping Calcifer's product identity and using a Calcifer orange accent token for state, focus, and primary actions.

## Product Direction

Calcifer should feel closer to Raycast, Linear, Obsidian, and Vocabify than to a playful chatbot demo. The side panel should prioritize fast scanning, compact controls, and clear task state. Orange remains the brand accent, but it must not be used as decoration or as a large background color.

## Visual System

The side panel will use CSS design tokens exposed through Tailwind:

- Charcoal surfaces instead of pure black.
- `primary` is Calcifer orange.
- Accent usage is limited to active navigation, focus rings, primary buttons, and urgent state.
- Borders and subtle surface changes replace large shadows.
- Most spacing uses 4, 8, 12, 16, and 24 px.
- Typography and opacity drive hierarchy.
- Animations are short and functional.

The default experience is dark and professional. A small theme provider can support `light`, `dark`, and `system`, but this pass will bias the UI toward the dark Calcifer workspace.

## UI Architecture

`src/entrypoints/sidepanel/App.tsx` becomes the workspace shell:

- Compact header with brand, current mode, and status.
- Navigation uses compact icon buttons or segmented controls.
- The main surface remains full-height and split by page.
- `Chat`, `Translate`, and `Settings` keep their current responsibilities.

`Chat` becomes a page-aware assistant workspace:

- Messages are compact rows/cards instead of large decorative bubbles.
- The input bar is a stable bottom command area.
- History and new-chat actions remain icon buttons.
- Markdown output remains supported.

`Translate` becomes a focused operation panel:

- Compact target language selector.
- Primary translate command.
- A quiet status/help panel with minimal copy.

`Settings` becomes a structured configuration workspace:

- Provider configuration.
- Runtime generation settings.
- Feature flags.
- Settings are grouped into bordered sections, not marketing-style cards.

Injected content UI should also reduce decoration:

- Selection toolbar uses dark charcoal, border, compact icon buttons.
- Translation renderer keeps subtle borders and avoids heavy orange backgrounds.

## AI Provider Architecture

Calcifer's current single `ProviderConfig` model will be upgraded to a Vocabify-style agent configuration:

- Built-in providers: OpenAI, Anthropic, Google, DeepSeek.
- OpenAI-compatible providers through `custom:<slug>`.
- Custom base URL and optional `providerOptions`.
- Static model defaults plus model-list fetching where supported.
- Normalization layer validates stored values before use.
- Migration from existing `providerConfig` into the new `agents` storage shape.

The AI runtime becomes a service layer:

- Creates models through provider factories.
- Streams text with Vercel AI SDK.
- Supports abort when the port disconnects.
- Supports retry with bounded exponential delay.
- Normalizes errors with provider labels.
- Exposes one text stream API used by both Chat and Translate.

Chat and Translate keep separate prompts:

- Chat uses the page context builder and Calcifer system prompt.
- Translate uses a translation-only prompt.

## Compatibility

Existing user settings stored as `providerConfig` should be migrated on load if no new agents exist. Existing feature flags and chat persistence should remain untouched.

## Testing And Verification

The repo has no existing test script. The implementation should add focused tests for pure AI-provider normalization logic using the available local toolchain if practical. Build verification remains mandatory with `npm run build`. UI changes should be checked with code review and, if a runnable extension surface is available, a browser snapshot.

## Documentation

After code changes, run the required documentation scan:

- `git diff --name-only HEAD`
- `find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"`

Update matching docs proactively. If no matching docs need updates, report `扫描了文档树，无需同步`.
