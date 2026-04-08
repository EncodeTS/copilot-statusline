# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

copilot-statusline is a customizable status line formatter for GitHub Copilot CLI that displays model info, git branch, token usage, premium requests, and other metrics. It functions as both:
1. A piped command processor for Copilot CLI status lines
2. An interactive TUI configuration tool when run without input

Based on [ccstatusline](https://github.com/sirmalloc/ccstatusline), adapted for the Copilot CLI payload format.

## Development Commands

```bash
bun install                           # Install dependencies
bun run start                         # Run TUI mode
bun run example                       # Test with example payload
bun run build                         # Build for npm
bun test                              # Run tests (71 tests, Vitest)
bun run lint                          # Type check + ESLint
bun run lint:fix                      # Auto-fix lint issues
```

## Architecture

Dual runtime compatibility — works with both Bun (dev) and Node.js 14+ (dist).

### Core Structure
- **src/copilot-statusline.ts**: Main entry point (piped vs interactive mode)
- **src/types/**: TypeScript type definitions (CopilotPayload, Settings, Widget, RenderContext)
- **src/widgets/**: 50 widget implementations with registry pattern
- **src/utils/**: Utilities (config, renderer, colors, ansi, git, terminal, progress-bar)
- **src/tui/**: React/Ink TUI for configuration

### Widget Interface
All widgets implement:
- `getDefaultColor()`, `getDescription()`, `getDisplayName()`, `getCategory()`
- `getEditorDisplay(item)`: How the widget appears in TUI editor
- `render(item, context, settings)`: Core rendering logic
- `supportsRawValue()`, `supportsColors(item)`

### Widget Registry
- Located in src/utils/widgets.ts
- Map-based registry mapping widget type strings to widget instances
- Widget manifest in src/utils/widget-manifest.ts

### Config
- Settings at `~/.config/copilot-statusline/settings.json`
- Copilot integration at `~/.copilot/config.json`
- Launcher script at `~/.copilot/statusline.sh` (auto-generated on install)

## Key Differences from ccstatusline

- **Payload**: Copilot JSON (different from Claude Code StatusJSON)
- **No transcript JSONL parsing**: Tokens come directly from payload
- **No speed metrics**: No per-request timing data
- **Premium requests** replace USD cost
- **Session duration**: Direct from `cost.total_duration_ms`
- **model.display_name parsing**: Extract thinking effort and multiplier
- **Stdin handling**: Copilot CLI closes stdin pipe quickly, so we use synchronous `fs.readFileSync(0)` with async fallback

## Copilot CLI Integration

The install flow creates a bash wrapper (`~/.copilot/statusline.sh`) that:
1. Buffers stdin with `INPUT=$(cat)` before piping to the JS runtime (Copilot CLI closes stdin fast)
2. Uses `bunx -y copilot-statusline@latest` (or `npx` if user ran TUI with npm) for auto-upgrades
3. Writes the script path to `~/.copilot/config.json` under `statusLine.command`

## Powerline Progress Bar Coloring

The progress bar (`makeUsageProgressBar` in `src/utils/progress-bar.ts`) has special handling for Powerline mode:
- Powerline themes assign fg colors by widget position index; some positions get dark fg (e.g. black on yellow)
- Filled blocks (`█`) are forced to bright white (`\x1b[38;5;231m`) using 256-color format (must match renderer's color format to override correctly)
- A restore placeholder (`PROGRESS_BAR_FG_RESTORE`) is replaced by the renderer with the actual theme fg code, so text after the bar returns to theme color
- Empty blocks (`░`) keep the theme fg for natural contrast

## Important Notes

- **ink@6.2.0 patch**: Fixes backspace key handling on macOS
- **Build process**: Two-step — `bun build` then `postbuild` replaces version placeholder
- **Lint**: ESLint 10 with `eslint-plugin-import-x` (not `eslint-plugin-import` which is incompatible). Never disable a lint rule via comment
- **Testing**: Vitest via `bun test`
- **ANSI color format**: When overriding colors inline, always use 256-color format (`\x1b[38;5;Xm`) — basic SGR codes (`\x1b[97m`) won't override 256-color codes in some terminals
