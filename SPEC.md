# SPEC.md — copilot-statusline

> Copilot CLI enhanced statusline, mirroring ccstatusline functionality for GitHub Copilot CLI.

## 1. Objective

Build `copilot-statusline`, a standalone TypeScript program that provides the same enhanced statusline experience that ccstatusline delivers for Claude Code — but for GitHub Copilot CLI.

**Target users:** GitHub Copilot CLI users who want a richer, customizable statusline beyond the default.

**Core constraint:** Copilot's statusline payload is different from Claude Code's. Features must be mapped 1:1 where the Copilot payload provides sufficient data, and excluded where it doesn't.

## 2. Copilot Payload — Available Data

Copilot sends JSON via stdin with this structure (from captured payloads):

```typescript
interface CopilotPayload {
  cwd: string;
  session_id: string;
  session_name: string | null;            // Copilot-unique: conversation title
  transcript_path: string;                // Session state directory
  model: {
    id: string | null;                    // e.g. "claude-opus-4.7-1m-internal"
    display_name: string | null;          // e.g. "Claude Opus 4.7 (1M context) (10x) (xhigh)"
  };
  workspace: { current_dir: string };
  remote: { connected: boolean };         // Copilot-unique: `/remote` session control toggle (drive CLI from GitHub web/mobile)
  version: string;                        // Copilot CLI version
  cost: {
    total_api_duration_ms: number;
    total_duration_ms: number;            // Wall-clock session duration
    total_lines_added: number;
    total_lines_removed: number;
    total_premium_requests: number;       // Copilot-unique: premium request counter
  };
  context_window: {
    context_window_size: number | null;
    total_input_tokens: number;           // Cumulative across the session
    total_output_tokens: number;
    total_cache_read_tokens: number;      // Copilot-unique
    total_cache_write_tokens: number;     // Copilot-unique
    total_reasoning_tokens: number;       // Copilot-unique: thinking/reasoning tokens
    total_tokens: number;
    used_percentage: number | null;       // Cumulative-token % vs context_window_size
    remaining_percentage: number | null;
    remaining_tokens: number | null;      // Copilot-unique: absolute remaining
    last_call_input_tokens: number;       // Copilot-unique
    last_call_output_tokens: number;      // Copilot-unique
    current_context_tokens: number | null;          // Copilot-unique: live context occupancy
    current_context_used_percentage: number | null; // Copilot-unique: live context % (preferred for UI bars)
    displayed_context_limit: number | null;         // Copilot-unique: denominator Copilot uses for current_context_used_percentage. Differs from context_window_size on some models (e.g. gpt-5.5 = 304000 vs raw 400000)
    current_usage?: {                     // Only after first API call
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
  };
}
```

> **Note on `total_*` vs `current_context_*`** — `total_*` fields and `used_percentage` are **cumulative** over the entire session (every input token ever sent, including re-sent cache content). `current_context_tokens` / `current_context_used_percentage` reflect the **live context window occupancy right now** and are usually the more meaningful values for status bars.

> **No worktree fields** — Copilot CLI's payload does **not** expose worktree state (no `worktree`, `branch`, or similar object), even when the CLI is invoked inside a linked git worktree. Worktree-aware widgets must detect state via `git` commands themselves (see `GitWorktree` / `GitWorktreeMode`).

### Environment Variables

Scripts receive `COPILOT_CLI`, `COPILOT_CLI_BINARY_VERSION`, `COPILOT_RUN_APP`, `COPILOT_LOADER_PID`.

## 3. Feature Mapping — ccstatusline → copilot-statusline

### Supported (data available from Copilot payload)

| ccstatusline Widget | copilot-statusline Widget | Data Source |
|---|---|---|
| Model | Model | `model.id` / `model.display_name` |
| Version | Version | `version` (Copilot CLI version) |
| Session Name | Session Name | `session_name` (Copilot-unique) |
| Session ID | Session ID | `session_id` |
| Current Working Dir | Current Working Dir | `cwd` / `workspace.current_dir` |
| Terminal Width | Terminal Width | `process.stdout.columns` |
| Free Memory | Free Memory | `os.freemem()` |
| Tokens Input | Tokens Input | `context_window.total_input_tokens` |
| Tokens Output | Tokens Output | `context_window.total_output_tokens` |
| Tokens Cached | Tokens Cached | `context_window.total_cache_read_tokens + total_cache_write_tokens` |
| Tokens Total | Tokens Total | `context_window.total_tokens` |
| Context Length | Context Length | `context_window.current_context_tokens` (live, aligns with ccstatusline semantics) |
| Context Window | Context Window | `context_window.displayed_context_limit ?? context_window_size` |
| Context % | Context % | `context_window.current_context_used_percentage` (live; capped at 100) |
| Context % (usable) | Context % (usable) | `current_context_tokens / displayed_context_limit` |
| Context Bar | Context Bar | `current_context_tokens / displayed_context_limit` (clamped to 100%) |
| Session Clock | Session Clock | `cost.total_duration_ms` (directly from payload!) |
| Session Cost | Premium Requests | `cost.total_premium_requests` (replaces USD cost) |
| Git Branch | Git Branch | `git` command (same as ccstatusline) |
| Git Changes | Git Changes | `cost.total_lines_added + total_lines_removed` or git |
| Git Insertions | Git Insertions | `cost.total_lines_added` or git |
| Git Deletions | Git Deletions | `cost.total_lines_removed` or git |
| Git Status | Git Status | `git` command |
| Git Staged/Unstaged/Untracked/Conflicts | Same | `git` command |
| Git Staged/Unstaged/Untracked Files | Same | `git` command (`git status --porcelain -z`) |
| Git Clean Status | Same | `git` command (`git status --porcelain -z`) |
| Git Ahead/Behind | Git Ahead/Behind | `git` command |
| Git SHA | Git SHA | `git` command |
| Git PR | Git PR | `git`/`gh` command |
| Git Root Dir | Git Root Dir | `git` command |
| Git Origin/Upstream widgets | Same | `git` command |
| Git Is Fork | Git Is Fork | `git` command |
| Git Worktree | Git Worktree | `git` command (probes `git rev-parse --git-dir`) |
| Git Worktree Mode | Git Worktree Mode | `git` command (probes linked worktree state) |
| Custom Text | Custom Text | Static config |
| Custom Command | Custom Command | Shell exec |
| Custom Symbol | Custom Symbol | Static config |
| Separator | Separator | Layout |
| Flex Separator | Flex Separator | Layout |
| Thinking Effort | Thinking Effort | Parsed from `model.display_name` (see below) |
| Link | Link | Config |
| **NEW:** Model Multiplier | Model Multiplier | Parsed from `model.display_name` (see below) |
| **NEW:** Last Call Tokens | Last Call Input/Output | `context_window.last_call_*` (Copilot-unique) |
| **NEW:** Remaining Tokens | Remaining Tokens | `displayed_context_limit − current_context_tokens` (Copilot-unique; live remaining) |

#### Parsing `model.display_name`

Copilot embeds both the **thinking effort level** and the **per-request premium cost** inside the `model.display_name` field. The format is:

```
"<model-name> [optional tags...] (<multiplier>) (<effort>)"
```

Examples:
- `"claude-opus-4.6 (3x) (high)"` → multiplier = `3x`, effort = `high`
- `"Claude Opus 4.6 (1M context)(Internal only) (high)"` → effort = `high` (multiplier absent in this variant)

**All parenthesized tokens** are extracted via regex. Then:

1. **Thinking Effort** — the last `(...)` group matching one of `low` | `medium` | `high`. Possible values:
   - `low` — Minimal thinking, prioritizes speed
   - `medium` — Balanced, thinks on harder problems
   - `high` — Optimal performance, thorough thinking (default)

2. **Model Multiplier** (type: `model-multiplier`) — a `(...)` group matching the pattern `\d+x` (e.g. `3x`, `6x`, `1x`). This is the "premium request multiplier" from Copilot's official docs: each interaction consumes this many premium requests. Display label: `Multiplier`, raw value: just `3x`. Pairs naturally with the Model widget in compact layouts:
   ```
   opus-4.6 │ 3x │ ctx 18% │ 15 reqs
   ```

**Parsing strategy:** Extract all `(...)` groups from `model.display_name`. Match each against known patterns. If a pattern doesn't match, the corresponding widget returns null (graceful degradation). Both widgets are independently optional — one may succeed even if the other fails.

### Excluded (no data source in Copilot payload)

| ccstatusline Widget | Reason |
|---|---|
| Output Style | Copilot payload has no `output_style` field |
| Vim Mode | Copilot payload has no `vim` field |
| Input/Output/Total Speed | No transcript JSONL for per-request timing (transcript_path is a directory, not a JSONL file) |
| Block Timer / Block Reset Timer | Copilot uses premium_requests, no 5-hour block system |
| Weekly Reset Timer | No rate_limits data in Copilot |
| Session Usage / Weekly Usage | No rate_limits data in Copilot |
| Skills widget | No hook system observed in Copilot |
| Worktree widget data fields | Copilot payload has no worktree object (verified May 2026 — even when CLI runs inside a linked worktree, no `worktree`/`branch` fields appear). Local widgets `git-worktree` and `git-worktree-mode` work around this by probing `git rev-parse --git-dir` directly. |
| Claude Account Email | No account info in Copilot payload |

### New Copilot-Unique Widgets

| Widget | Description | Data Source |
|---|---|---|
| Model Multiplier | Per-request premium multiplier (e.g. `3x`) — from Copilot's "Model multipliers" | Parsed from `model.display_name` |
| Premium Requests | Total premium requests consumed this session | `cost.total_premium_requests` |
| API Calls | Estimated actual API calls this session | `cost.total_premium_requests / multiplier` |
| Premium Rate | Premium requests consumed per minute (burn rate) | `cost.total_premium_requests / (cost.total_duration_ms / 60000)` |
| Last Call Input | Input tokens in most recent API call | `context_window.last_call_input_tokens` |
| Last Call Output | Output tokens in most recent API call | `context_window.last_call_output_tokens` |
| Remaining Tokens | Live remaining tokens in context (`displayed_context_limit − current_context_tokens`) | computed |
| Cache Read Tokens | Total cache read tokens | `context_window.total_cache_read_tokens` |
| Cache Write Tokens | Total cache write tokens | `context_window.total_cache_write_tokens` |
| Tokens Reasoning | Total reasoning (thinking) tokens consumed | `context_window.total_reasoning_tokens` |

## 4. Architecture

### Runtime Model

Identical to ccstatusline:

1. **Piped mode** (stdin has data): Parse Copilot JSON → compute metrics → render status line → stdout
2. **Interactive TUI mode** (stdin is TTY): React/Ink configuration UI

### Project Structure

```
copilot_statusline/
├── src/
│   ├── copilot-statusline.ts          # Main entry point (dual mode)
│   ├── types/
│   │   ├── CopilotPayload.ts          # Zod schema for Copilot stdin JSON
│   │   ├── Settings.ts                # Configuration schema (adapted from ccstatusline)
│   │   ├── Widget.ts                  # Widget interface (reuse from ccstatusline)
│   │   └── RenderContext.ts           # Render context type
│   ├── widgets/                       # Widget implementations
│   │   ├── index.ts                   # Widget registry
│   │   ├── ModelWidget.ts
│   │   ├── VersionWidget.ts
│   │   ├── SessionNameWidget.ts
│   │   ├── SessionIdWidget.ts
│   │   ├── TokensInputWidget.ts
│   │   ├── TokensOutputWidget.ts
│   │   ├── TokensCachedWidget.ts
│   │   ├── TokensReasoningWidget.ts
│   │   ├── TokensTotalWidget.ts
│   │   ├── ContextLengthWidget.ts
│   │   ├── ContextWindowWidget.ts
│   │   ├── ContextPercentageWidget.ts
│   │   ├── ContextBarWidget.ts
│   │   ├── SessionClockWidget.ts
│   │   ├── ThinkingEffortWidget.ts       # Parsed from model.display_name
│   │   ├── ModelMultiplierWidget.ts       # Parsed from model.display_name (Copilot-unique)
│   │   ├── PremiumRequestsWidget.ts   # Copilot-unique
│   │   ├── ApiCallsWidget.ts          # Computed: premium_requests / multiplier (Copilot-unique)
│   │   ├── PremiumRateWidget.ts       # Computed: premium_requests / minute (Copilot-unique)
│   │   ├── LastCallInputWidget.ts     # Copilot-unique
│   │   ├── LastCallOutputWidget.ts    # Copilot-unique
│   │   ├── RemainingTokensWidget.ts   # Copilot-unique
│   │   ├── CacheReadTokensWidget.ts   # Copilot-unique
│   │   ├── CacheWriteTokensWidget.ts  # Copilot-unique
│   │   ├── CurrentWorkingDirWidget.ts
│   │   ├── TerminalWidthWidget.ts
│   │   ├── FreeMemoryWidget.ts
│   │   ├── GitBranchWidget.ts
│   │   ├── GitChangesWidget.ts
│   │   ├── GitInsertionsWidget.ts
│   │   ├── GitDeletionsWidget.ts
│   │   ├── GitStatusWidget.ts
│   │   ├── GitStagedWidget.ts
│   │   ├── GitStagedFilesWidget.ts
│   │   ├── GitUnstagedWidget.ts
│   │   ├── GitUnstagedFilesWidget.ts
│   │   ├── GitUntrackedWidget.ts
│   │   ├── GitUntrackedFilesWidget.ts
│   │   ├── GitCleanStatusWidget.ts
│   │   ├── GitConflictsWidget.ts
│   │   ├── GitAheadBehindWidget.ts
│   │   ├── GitSHAWidget.ts
│   │   ├── GitPRWidget.ts
│   │   ├── GitRootDirWidget.ts
│   │   ├── GitOriginOwnerWidget.ts
│   │   ├── GitOriginRepoWidget.ts
│   │   ├── GitOriginOwnerRepoWidget.ts
│   │   ├── GitUpstreamOwnerWidget.ts
│   │   ├── GitUpstreamRepoWidget.ts
│   │   ├── GitUpstreamOwnerRepoWidget.ts
│   │   ├── GitIsForkWidget.ts
│   │   ├── CustomTextWidget.ts
│   │   ├── CustomCommandWidget.ts
│   │   ├── CustomSymbolWidget.ts
│   │   ├── SeparatorWidget.ts
│   │   ├── FlexSeparatorWidget.ts
│   │   └── LinkWidget.ts
│   ├── tui/                           # Interactive configuration UI
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── components/               # TUI components (from ccstatusline, adapted)
│   └── utils/
│       ├── config.ts                  # Settings at ~/.config/copilot-statusline/settings.json
│       ├── renderer.ts               # Core rendering (from ccstatusline)
│       ├── colors.ts                 # Color system (from ccstatusline)
│       ├── ansi.ts                   # ANSI helpers (from ccstatusline)
│       ├── git.ts                    # Git integration (from ccstatusline)
│       ├── copilot-settings.ts       # Integration with ~/.copilot/config.json
│       ├── powerline.ts              # Powerline support (from ccstatusline)
│       └── model-context.ts          # Model context detection
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── SPEC.md
└── CLAUDE.md
```

### Key Adaptation Points

1. **Config location:** `~/.config/copilot-statusline/settings.json` (not ccstatusline)
2. **Copilot integration:** `~/.copilot/config.json` (not `~/.claude/settings.json`)
3. **Payload parsing:** Copilot-specific Zod schema (different from StatusJSON)
4. **No transcript parsing:** Copilot provides tokens directly in payload — no JSONL parsing needed
5. **No speed metrics:** No per-request timing data available
6. **No usage/rate-limit API:** Premium requests replace session/weekly usage
7. **Session duration:** Directly from `cost.total_duration_ms` — no transcript parsing needed

## 5. Code Style & Tech Stack

### Tech Stack (matching ccstatusline)

- **Language:** TypeScript (strict mode)
- **Runtime:** Bun (dev) + Node.js 14+ (dist)
- **Build:** `bun build` targeting Node.js 14+
- **UI Framework:** React + Ink 6.x (TUI)
- **Validation:** Zod
- **Styling:** Chalk
- **Testing:** Vitest
- **Linting:** ESLint + TypeScript strict

### Code Style (matching ccstatusline conventions)

- ES modules (`"type": "module"`)
- Zod schemas for all external data boundaries
- Widget interface pattern with registry Map
- Dual Bun/Node.js stdin reading
- ANSI-aware truncation for terminal output
- Non-breaking spaces in output to prevent editor trimming

### Package Info

- **Name:** `copilot-statusline`
- **Bin:** `copilot-statusline`
- **Run:** `npx -y copilot-statusline@latest` or `bunx -y copilot-statusline@latest`

## 6. Commands

```bash
# Development
bun install                           # Install dependencies
bun run start                         # Run TUI mode
bun run example                       # Test with example payload
bun run build                         # Build for npm
bun test                              # Run tests
bun run lint                          # Type check + ESLint

# Usage (installed or npx)
copilot-statusline                    # TUI configuration
echo '<json>' | copilot-statusline    # Piped rendering

# Copilot integration (~/.copilot/config.json)
{
  "statusLine": {
    "type": "command",
    "command": "npx -y copilot-statusline@latest",
    "padding": 0
  }
}
```

## 7. Testing Strategy

### Unit Tests

- **Payload parsing:** Zod schema validates all captured payloads, handles null/missing fields at each lifecycle stage
- **Widget rendering:** Each widget renders correctly given known context data
- **Token computation:** Cached token aggregation (read + write), remaining tokens
- **Session clock:** Formats `total_duration_ms` correctly
- **Model display:** Parses `display_name` format `"model-id (Nx) (level)"`
- **Thinking Effort parsing:** Correctly extracts effort level (`low`/`medium`/`high`) from various `display_name` formats; returns null for unrecognized formats
- **Model Multiplier parsing:** Correctly extracts multiplier (`3x`, `6x`, `1x`) from `display_name`; returns null when absent
- **API Calls computation:** Correctly divides `total_premium_requests` by multiplier; returns null when multiplier unavailable
- **Premium Rate computation:** Correctly computes requests/minute; handles zero duration gracefully
- **Context percentage:** Handles null values during startup phase
- **Git widgets:** Same test coverage as ccstatusline

### Integration Tests

- **Piped mode end-to-end:** Feed captured payloads → verify rendered output
- **Lifecycle progression:** Verify graceful handling of progressively enriched payloads (startup → model ready → first turn → title generated)
- **Edge cases:** All-null payload, missing context_window, null model

## 8. Boundaries

### Always Do

- Parse Copilot payload defensively — fields can be null at various lifecycle stages
- Match ccstatusline's rendering quality: colors, padding, powerline, flex separators
- Support the same TUI configuration experience
- Keep execution under 100ms (Copilot spawns per state change)
- Output `\x1b[0m` prefix and non-breaking spaces (same as ccstatusline)

### Never Do

- Don't access Claude Code paths (`~/.claude/`, transcript JSONL files)
- Don't compute speed metrics (no per-request timing data)
- Don't include excluded widgets (vim mode, output style, rate limits, block timers, skills, worktree)
- Don't hard-code model context sizes — use `context_window.context_window_size` from payload directly
- Don't use `WebSearch` tool (per user instructions)

### Ask First

- Whether to attempt reading Copilot's session-state directory for additional data
- Whether to support future Copilot payload fields not yet observed in captures
