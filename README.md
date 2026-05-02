<div align="center">

<pre>
                 _ _       _           _        _             _ _
  ___ ___  _ __ (_) | ___ | |_     ___| |_ __ _| |_ _   _ ___| (_)_ __   ___
 / __/ _ \| '_ \| | |/ _ \| __|   / __| __/ _` | __| | | / __| | | '_ \ / _ \
| (_| (_) | |_) | | | (_) | |_    \__ \ || (_| | |_| |_| \__ \ | | | | |  __/
 \___\___/| .__/|_|_|\___/ \__|   |___/\__\__,_|\__|\__,_|___/_|_|_| |_|\___|
          |_|
</pre>

# copilot-statusline

**🎨 A highly customizable status line formatter for GitHub Copilot CLI**
*Display model info, git branch, token usage, premium requests, and other metrics in your terminal*

[![npm version](https://img.shields.io/npm/v/copilot-statusline.svg)](https://www.npmjs.com/package/copilot-statusline)
[![npm downloads](https://img.shields.io/npm/dm/copilot-statusline.svg)](https://www.npmjs.com/package/copilot-statusline)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/copilot-statusline.svg)](https://nodejs.org)
[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-000000.svg?logo=bun)](https://bun.sh)

</div>

> **Based on [ccstatusline](https://github.com/sirmalloc/ccstatusline)** by [@sirmalloc](https://github.com/sirmalloc) — the excellent customizable statusline for Claude Code CLI. This project adapts its architecture, TUI, and rendering engine for the GitHub Copilot CLI payload format. Huge thanks to Matthew Breedlove for the original work.

> **Requirements:** GitHub Copilot CLI **≥ 1.0.35** for live context widgets (`Context %`, `Context Bar`, `Context Length`, `Remaining Tokens`). Older versions miss the underlying `current_context_tokens` / `displayed_context_limit` fields and these widgets render blank.

---

## 📚 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Windows Support](#-windows-support)
- [Usage](#-usage)
- [Available Widgets](#-available-widgets)
- [Copilot-Unique Widgets](#-copilot-unique-widgets)
- [Widget Editor Keybinds](#-widget-editor-keybinds)
- [Custom Widgets](#-custom-widgets)
- [Global Options](#-global-options)
- [Terminal Width Options](#-terminal-width-options)
- [Configuration](#-configuration)
- [Development](#️-development)
- [Differences from ccstatusline](#-differences-from-ccstatusline)
- [Acknowledgments](#-acknowledgments)
- [License](#-license)

---

## ✨ Features

- **📊 Real-time Metrics** — Model name, git branch, token usage, premium requests, session duration, and more
- **🎨 Fully Customizable** — Choose what to display and customize colors for each widget
- **⚡ Powerline Support** — Beautiful Powerline-style rendering with arrow separators, caps, and custom themes
- **📐 Multi-line Support** — Configure any number of independent status lines
- **🖥️ Interactive TUI** — Built-in configuration interface using React/Ink
- **🔎 Fast Widget Picker** — Add/change widgets by category with search and ranked matching
- **⚙️ Global Options** — Apply consistent formatting across all widgets (padding, separators, bold, background)
- **🚀 Cross-platform** — Works seamlessly on macOS, Linux, and Windows with both Bun and Node.js
- **📏 Smart Width Detection** — Automatically adapts to terminal width with flex separators
- **⚡ Zero Config** — Sensible defaults that work out of the box
- **🔒 Fully Independent** — Completely separate from ccstatusline (different config paths, different npm package)

---

## 🚀 Quick Start

### No installation needed! Use directly with npx or bunx:

```bash
# Run the configuration TUI with npm
npx -y copilot-statusline@latest

# Or with Bun (faster)
bunx -y copilot-statusline@latest
```

### Configure copilot-statusline

The interactive configuration tool provides a terminal UI where you can:
- Configure multiple separate status lines
- Add/remove/reorder status line widgets
- Customize colors for each widget (foreground, background, bold)
- Configure Powerline mode with themes
- Set global overrides (padding, separators, color overrides)
- Install/uninstall to Copilot CLI settings
- Preview your status line in real-time

> 💡 **Tip:** Your settings are automatically saved to `~/.config/copilot-statusline/settings.json`

### Copilot CLI Integration

When you install from the TUI, copilot-statusline creates a launcher script at `~/.copilot/statusline.sh` that uses `bunx`/`npx` to always run the latest version — **no manual upgrades needed**.

It also writes to your Copilot CLI config:

```json
// ~/.copilot/config.json
{
  "statusLine": {
    "type": "command",
    "command": "/Users/you/.copilot/statusline.sh",
    "padding": 0
  }
}
```

> 💡 **Auto-upgrade:** The launcher script runs `bunx -y copilot-statusline@latest` (or `npx` if you used npm to run the TUI) under the hood, so you always get the latest version automatically.

**Settings location:** `~/.copilot/config.json` (or use `--config-dir` with Copilot CLI to change)

---

## 🪟 Windows Support

copilot-statusline works on Windows with full feature compatibility across PowerShell (5.1+ and 7+), Command Prompt, and WSL.

### Installation on Windows

#### Option 1: Using Bun (Recommended)
```powershell
# Install Bun for Windows
irm bun.sh/install.ps1 | iex

# Run copilot-statusline
bunx -y copilot-statusline@latest
```

#### Option 2: Using Node.js
```powershell
# Using npm
npx -y copilot-statusline@latest

# Using Yarn
yarn dlx copilot-statusline@latest

# Using pnpm
pnpm dlx copilot-statusline@latest
```

### Powerline Font Support on Windows

For optimal Powerline rendering on Windows:

**Windows Terminal** (Recommended):
- Supports Powerline fonts natively
- Download from [Microsoft Store](https://aka.ms/terminal)

**PowerShell/Command Prompt:**
```powershell
# Install JetBrains Mono Nerd Font via winget
winget install DEVCOM.JetBrainsMonoNerdFont

# Or download manually from: https://www.nerdfonts.com/font-downloads
```

### Windows Terminal Configuration

For the best experience:

```json
{
  "profiles": {
    "defaults": {
      "font": {
        "face": "JetBrainsMono Nerd Font",
        "size": 12
      }
    }
  }
}
```

### Windows Copilot CLI Integration

**Config location:** `%USERPROFILE%\.copilot\config.json`

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y copilot-statusline@latest",
    "padding": 0
  }
}
```

### WSL (Windows Subsystem for Linux)

copilot-statusline works natively in WSL:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bunx -y copilot-statusline@latest
```

### Windows Troubleshooting

**Powerline symbols showing as boxes:**
```powershell
winget install DEVCOM.JetBrainsMonoNerdFont
# Then set the font in your terminal settings
```

**Git commands not recognized:**
```powershell
winget install Git.Git
```

**Execution Policy errors:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📖 Usage

Once configured, copilot-statusline automatically formats your Copilot CLI status line. The status line appears below the input during Copilot CLI sessions.

### Runtime Modes

- **Interactive mode (TUI)** — Launches when there is no stdin input
- **Piped mode (renderer)** — Parses Copilot CLI JSON from stdin and prints formatted lines

```bash
# Interactive TUI
copilot-statusline

# Piped mode with example payload
bun run example
```

### How It Works

Copilot CLI spawns your status line command on every state change, passing session JSON via stdin. copilot-statusline parses the payload, renders the configured widgets, and outputs ANSI-colored text to stdout.

---

## 📊 Available Widgets

### Core
| Widget | Type | Description |
|--------|------|-------------|
| Model | `model` | Copilot model name (e.g., `claude-opus-4.6`) |
| Version | `version` | Copilot CLI version number |
| Thinking Effort | `thinking-effort` | Thinking effort level parsed from `display_name` (`low`/`medium`/`high`) |
| Model Multiplier | `model-multiplier` | Per-request premium multiplier (e.g., `3x`) |

### Session
| Widget | Type | Description |
|--------|------|-------------|
| Session Name | `session-name` | Copilot conversation title |
| Session ID | `session-id` | Short session identifier |
| Session Clock | `session-clock` | Elapsed session time (from `total_duration_ms`) |
| Premium Requests | `premium-requests` | Total premium requests consumed |
| API Calls | `api-calls` | Estimated API calls (`premium_requests / multiplier`) |
| Premium Rate | `premium-rate` | Premium request burn rate (requests/minute) |

### Tokens
| Widget | Type | Description |
|--------|------|-------------|
| Tokens Input | `tokens-input` | Total input tokens |
| Tokens Output | `tokens-output` | Total output tokens |
| Tokens Cached | `tokens-cached` | Total cached tokens (read + write) |
| Tokens Reasoning | `tokens-reasoning` | Total reasoning (thinking) tokens consumed |
| Tokens Total | `tokens-total` | Total tokens |
| Last Call Input | `last-call-input` | Input tokens from most recent API call |
| Last Call Output | `last-call-output` | Output tokens from most recent API call |
| Cache Read Tokens | `cache-read-tokens` | Total cache read tokens |
| Cache Write Tokens | `cache-write-tokens` | Total cache write tokens |

### Context
| Widget | Type | Description |
|--------|------|-------------|
| Context Length | `context-length` | Current context length in tokens (live, from `current_context_tokens`) |
| Context Window | `context-window` | Model's context window size (max tokens, from `displayed_context_limit ?? context_window_size`) |
| Context % | `context-percentage` | Live context % from Copilot (`current_context_used_percentage`) |
| Context Bar | `context-bar` | Visual progress bar for live context usage |
| Remaining Tokens | `remaining-tokens` | Live remaining tokens (`displayed_context_limit − current_context_tokens`) |

### Git
| Widget | Type | Description |
|--------|------|-------------|
| Git Branch | `git-branch` | Current branch name (with optional GitHub link) |
| Git Changes | `git-changes` | Insertions and deletions count (`+42,-10`) |
| Git Insertions | `git-insertions` | Uncommitted insertions only |
| Git Deletions | `git-deletions` | Uncommitted deletions only |
| Git Status | `git-status` | Staged/unstaged/untracked/conflicts indicators |
| Git Staged | `git-staged` | Staged changes indicator |
| Git Staged Files | `git-staged-files` | Count of staged files (`S:3`, raw: `3`) |
| Git Unstaged | `git-unstaged` | Unstaged changes indicator |
| Git Unstaged Files | `git-unstaged-files` | Count of unstaged tracked files (`M:2`, raw: `2`) |
| Git Untracked | `git-untracked` | Untracked files indicator |
| Git Untracked Files | `git-untracked-files` | Count of untracked files (`?:1`, raw: `1`) |
| Git Clean Status | `git-clean-status` | Working tree clean/dirty status (`✓`/`✗`, raw: `clean`/`dirty`) |
| Git Conflicts | `git-conflicts` | Merge conflict count |
| Git Ahead/Behind | `git-ahead-behind` | Commits ahead/behind upstream |
| Git SHA | `git-sha` | Short commit hash |
| Git PR | `git-pr` | Current pull request number |
| Git Root Dir | `git-root-dir` | Repository root directory name |
| Git Origin Owner | `git-origin-owner` | Remote origin owner |
| Git Origin Repo | `git-origin-repo` | Remote origin repo name |
| Git Origin Owner/Repo | `git-origin-owner-repo` | Remote origin `owner/repo` |
| Git Upstream Owner | `git-upstream-owner` | Upstream remote owner |
| Git Upstream Repo | `git-upstream-repo` | Upstream remote repo name |
| Git Upstream Owner/Repo | `git-upstream-owner-repo` | Upstream `owner/repo` |
| Git Is Fork | `git-is-fork` | Fork detection indicator |
| Git Worktree | `git-worktree` | Current git worktree name (probes `git rev-parse --git-dir`) |
| Git Worktree Mode | `git-worktree-mode` | `⎇` indicator when current dir is a linked worktree |

### System
| Widget | Type | Description |
|--------|------|-------------|
| Current Working Dir | `current-working-dir` | Current directory with configurable segment display and `~` abbreviation |
| Terminal Width | `terminal-width` | Terminal width in columns |
| Free Memory | `free-memory` | System free memory |

### Custom
| Widget | Type | Description |
|--------|------|-------------|
| Custom Text | `custom-text` | User-defined static text (supports emoji) |
| Custom Command | `custom-command` | Shell command output (refreshes on each state change) |
| Custom Symbol | `custom-symbol` | Custom Unicode symbol |
| Link | `link` | Clickable terminal hyperlink (OSC 8) |

### Layout
| Widget | Type | Description |
|--------|------|-------------|
| Separator | `separator` | Visual divider between widgets |
| Flex Separator | `flex-separator` | Expands to fill available terminal width |

---

## 🆕 Copilot-Unique Widgets

These widgets are exclusive to copilot-statusline and not available in ccstatusline:

| Widget | Type | Description |
|--------|------|-------------|
| Model Multiplier | `model-multiplier` | Premium cost multiplier parsed from `display_name` (e.g., `3x`, `6x`) |
| Premium Requests | `premium-requests` | Total premium requests consumed this session |
| API Calls | `api-calls` | Estimated actual API calls: `total_premium_requests / multiplier` |
| Premium Rate | `premium-rate` | Burn rate in requests/minute |
| Last Call Input | `last-call-input` | Input tokens from the most recent API call |
| Last Call Output | `last-call-output` | Output tokens from the most recent API call |
| Remaining Tokens | `remaining-tokens` | Live remaining tokens (`displayed_context_limit − current_context_tokens`) |
| Tokens Reasoning | `tokens-reasoning` | Total reasoning (thinking) tokens consumed |
| Cache Read Tokens | `cache-read-tokens` | Total cache read tokens |
| Cache Write Tokens | `cache-write-tokens` | Total cache write tokens |

---

## ⌨️ Widget Editor Keybinds

Common controls in the line editor:

| Key | Action |
|-----|--------|
| `↑` `↓` | Select widget |
| `←` `→` | Open widget picker to change type |
| `a` | Add widget via picker |
| `i` | Insert widget before current |
| `d` | Delete selected widget |
| `m` | Toggle move mode (reorder with `↑` `↓`) |
| `r` | Toggle raw value mode (supported widgets) |
| `c` | Clear all widgets (with confirmation) |
| `Space` | Edit separator character |

Widget-specific shortcuts:

| Widget | Key | Action |
|--------|-----|--------|
| Git widgets | `h` | Toggle hide `no git` output |
| Git Branch | `l` | Toggle GitHub link |
| Context % widgets | `u` | Toggle used/remaining display |
| Context % widgets | `p` | Cycle numeric/short bar display |
| Context Bar | `p` | Cycle bar style (medium/full/short/short-only) |
| Current Working Dir | `h` | Toggle `~` home abbreviation |
| Current Working Dir | `s` | Edit segment limit |
| Current Working Dir | `f` | Toggle fish-style path |
| Custom Command | `e` | Edit command |
| Custom Command | `w` | Set max width |
| Custom Command | `t` | Set timeout |
| Custom Command | `p` | Toggle preserve ANSI colors |
| Link | `u` | Edit URL |
| Link | `e` | Edit link text |

### 🔤 Raw Value Mode

Some widgets support raw mode which displays just the value without a label:
- Normal: `Model: claude-opus-4.6` → Raw: `claude-opus-4.6`
- Normal: `Reqs: 15` → Raw: `15`
- Normal: `Session: 2hr 15m` → Raw: `2hr 15m`
- Normal: `Ctx: 18.0%` → Raw: `18.0%`

---

## 🔧 Custom Widgets

### Custom Text Widget
Add static text to your status line. Supports emoji. Perfect for:
- Project identifiers
- Environment indicators (dev/prod)
- Personal labels

### Custom Command Widget
Execute shell commands and display their output dynamically:
- Refreshes whenever the Copilot CLI updates the status line
- Receives the full Copilot JSON payload via stdin
- Configurable timeout (default: 1000ms)
- Optional max-width truncation
- Optional ANSI color preservation

Examples:
- `pwd | xargs basename` — Show current directory name
- `node -v` — Display Node.js version
- `git rev-parse --short HEAD` — Show current commit hash
- `date +%H:%M` — Display current time

> ⚠️ Commands should complete quickly to avoid delays. Long-running commands will be killed after the configured timeout.

### Link Widget
Create clickable links in terminals that support OSC 8 hyperlinks:
- Configure URL and display text in the editor
- Falls back to plain text when URL is missing

---

## ⚙️ Global Options

Configure global formatting preferences that apply to all widgets:

| Key | Option | Description |
|-----|--------|-------------|
| `p` | Default Padding | Add consistent padding around each widget |
| `s` | Default Separator | Auto-insert separator between all widgets |
| `i` | Inherit Colors | Separators inherit colors from preceding widget |
| `o` | Global Bold | Apply bold to all text |
| `f` | Override Foreground | Force all widgets to use the same text color |
| `b` | Override Background | Force all widgets to use the same background color |
| `m` | Minimalist Mode | Show raw values only (no labels) |

> ⚠️ **VSCode Users:** If colors appear incorrect in the integrated terminal, adjust `terminal.integrated.minimumContrastRatio` to `1` in settings to disable contrast enforcement.

---

## 📏 Terminal Width Options

These settings control line truncation and flex separator behavior:

| Mode | Description |
|------|-------------|
| **Full width** | Uses full terminal width (may wrap with long content) |
| **Full width minus 40** (default) | Reserves 40 characters on the right to prevent wrapping |
| **Full width until compact** | Dynamic — switches based on context usage threshold (configurable, default 60%) |

### ✂️ Smart Truncation

When terminal width is detected, status lines automatically truncate with ellipsis (`...`) if they exceed the available width. Truncation is ANSI-aware, so color codes and OSC 8 hyperlinks remain well-formed.

---

## ⚙️ Configuration

### Configuration Files

| File | Purpose |
|------|---------|
| `~/.config/copilot-statusline/settings.json` | copilot-statusline widget/render settings |
| `~/.copilot/config.json` | Copilot CLI config (`statusLine` command object) |

### Example Configuration

```json
{
  "version": 1,
  "lines": [
    [
      { "id": "1", "type": "model", "color": "cyan" },
      { "id": "2", "type": "separator" },
      { "id": "3", "type": "model-multiplier", "color": "yellow" },
      { "id": "4", "type": "separator" },
      { "id": "5", "type": "context-percentage", "color": "blue" },
      { "id": "6", "type": "separator" },
      { "id": "7", "type": "premium-requests", "color": "green" },
      { "id": "8", "type": "separator" },
      { "id": "9", "type": "session-clock", "color": "yellow" },
      { "id": "10", "type": "flex-separator" },
      { "id": "11", "type": "git-branch", "color": "magenta" }
    ],
    [],
    []
  ],
  "colorLevel": 2
}
```

Renders as:
```
opus-4.6 | 3x | Ctx: 18.0% | Reqs: 3 | Session: <1m              ⎇ main
```

### Color Levels

| Level | Mode | Description |
|-------|------|-------------|
| 0 | No Color | Plain text only |
| 1 | Basic | 16 ANSI colors |
| 2 | 256 Color | 256 ANSI colors with custom codes (default) |
| 3 | Truecolor | 16 million colors with hex codes |

---

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- Git
- Node.js 14+ (optional, for running built binary)

### Setup

```bash
git clone https://github.com/EncodeTS/copilot-statusline.git
cd copilot-statusline
bun install
```

### Development Commands

```bash
bun run start          # Run TUI mode
bun run example        # Test with example payload
bun test               # Run tests (71 tests)
bun run lint           # Type check + ESLint
bun run lint:fix       # Auto-fix lint issues
bun run build          # Build for npm distribution
```

### Build Notes

- Build target is Node.js 14+ (`dist/copilot-statusline.js`)
- During install, `ink@6.2.0` is patched to fix backspace handling on macOS terminals
- A bash launcher (`dist/launcher.sh`) buffers stdin before passing to Node.js — this is needed because Copilot CLI closes the stdin pipe very quickly after writing

### Project Structure

```
copilot-statusline/
├── src/
│   ├── copilot-statusline.ts    # Main entry point (piped + TUI dual mode)
│   ├── types/                   # TypeScript type definitions
│   │   ├── CopilotPayload.ts    # Zod schema for Copilot stdin JSON
│   │   ├── Settings.ts          # Configuration schema
│   │   ├── Widget.ts            # Widget interface
│   │   └── RenderContext.ts     # Render context type
│   ├── widgets/                 # 50 widget implementations
│   │   ├── Model.ts
│   │   ├── PremiumRequests.ts
│   │   ├── GitBranch.ts
│   │   └── ...
│   ├── tui/                     # React/Ink configuration UI
│   │   ├── App.tsx              # Root TUI component
│   │   └── components/          # UI components
│   └── utils/                   # Utility functions
│       ├── config.ts            # Settings management
│       ├── renderer.ts          # Core rendering logic
│       ├── copilot-settings.ts  # Copilot CLI integration
│       └── ...
├── scripts/                     # Build scripts and example payloads
├── dist/                        # Built output (generated)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 🔄 Differences from ccstatusline

copilot-statusline and ccstatusline are **fully independent** — they use separate config directories, separate npm packages, and can be installed side-by-side without interference.

| Aspect | ccstatusline | copilot-statusline |
|--------|--------------|-------------------|
| **Target** | Claude Code CLI | GitHub Copilot CLI |
| **Input format** | Claude Code StatusJSON | Copilot JSON payload |
| **Config path** | `~/.config/ccstatusline/` | `~/.config/copilot-statusline/` |
| **CLI integration** | `~/.claude/settings.json` | `~/.copilot/config.json` |
| **npm package** | `ccstatusline` | `copilot-statusline` |
| **Cost tracking** | USD session cost | Premium requests counter |
| **Speed metrics** | Input/output/total token speed | Not available (no per-request timing data) |
| **Session duration** | Parsed from transcript JSONL | Direct from `cost.total_duration_ms` |
| **Rate limits** | 5-hour blocks, weekly resets | Premium request tracking |
| **Copilot-exclusive** | — | Model multiplier, premium rate, API calls, cache tokens, last-call tokens |
| **ccstatusline-exclusive** | Vim mode, output style, skills, worktree, block timer, speed widgets | — |

---

## 🙏 Acknowledgments

This project is built on the foundation of [**ccstatusline**](https://github.com/sirmalloc/ccstatusline) by [Matthew Breedlove (@sirmalloc)](https://github.com/sirmalloc). The widget system, rendering engine, TUI configuration interface, Powerline support, and overall architecture are derived from ccstatusline's excellent codebase.

If you use Claude Code, check out the original — it's a fantastic tool:

[![ccstatusline](https://img.shields.io/github/stars/sirmalloc/ccstatusline?style=social&label=Star%20ccstatusline)](https://github.com/sirmalloc/ccstatusline)

Additional thanks to:
- [Ink](https://github.com/vadimdemedes/ink) for the terminal UI framework
- [Zod](https://github.com/colinhacks/zod) for runtime schema validation
- The GitHub Copilot CLI team for the statusline API

---

## 📄 License

[MIT](LICENSE)

This project includes substantial portions of code from [ccstatusline](https://github.com/sirmalloc/ccstatusline) (MIT licensed, Copyright 2025 Matthew Breedlove). See the [LICENSE](LICENSE) file for full details.

---

<div align="center">

[![npm version](https://img.shields.io/npm/v/copilot-statusline.svg)](https://www.npmjs.com/package/copilot-statusline)
[![npm downloads](https://img.shields.io/npm/dm/copilot-statusline.svg)](https://www.npmjs.com/package/copilot-statusline)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>
