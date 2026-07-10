# SPEC.md — copilot-statusline

> Copilot CLI enhanced statusline, mirroring ccstatusline functionality for GitHub Copilot CLI.

## 1. Objective

Build `copilot-statusline`, a standalone TypeScript program that provides the same enhanced statusline experience that ccstatusline delivers for Claude Code — but for GitHub Copilot CLI.

**Target users:** GitHub Copilot CLI users who want a richer, customizable statusline beyond the default.

**Core constraint:** Copilot's statusline payload is different from Claude Code's. Features must be mapped 1:1 where the Copilot payload provides sufficient data, and excluded where it doesn't.

## 2. Copilot Payload — Available Data

Copilot sends JSON via stdin with this structure (verified against a post-call Copilot CLI 1.0.70 payload on July 10, 2026):

```typescript
interface CopilotPayload {
  cwd: string;
  session_id: string;
  session_name: string | null;            // Copilot-unique: conversation title
  transcript_path: string;                // Session state directory
  username: string | null;
  model: {
    id: string | null;                    // e.g. "claude-opus-4.7-1m-internal"
    display_name: string | null;          // e.g. "Claude Opus 4.7 (1M context) (10x) (xhigh)"
    thinking_effort_level?: string;
    thinking_effort?: string;
    reasoning_effort?: string;
  };
  workspace: { current_dir: string };
  remote: { connected: boolean };         // Copilot-unique: `/remote` session control toggle (drive CLI from GitHub web/mobile)
  version: string;                        // Copilot CLI version
  allow_all_enabled: boolean;             // True while allow-all / YOLO mode is active
  ai_used: {
    formatted: string | null;             // Human-readable GitHub AI Credits used
    total_nano_aiu: number | null;         // 1 AI Credit = 1,000,000,000 nano AIU
  } | null;
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
    used_percentage: number | null;       // Legacy last-call % vs raw context_window_size
    remaining_percentage: number | null;  // Inverse of used_percentage
    remaining_tokens: number | null;      // Raw window minus last-call input/output; not live remaining
    last_call_input_tokens: number;       // Model/tier dependent; may remain 0 or stale in CLI 1.0.70
    last_call_output_tokens: number;      // Model/tier dependent; may remain 0 or stale in CLI 1.0.70
    current_context_tokens: number | null;          // Copilot-unique: live context occupancy
    current_context_used_percentage: number | null; // Copilot-unique: live context % (preferred for UI bars)
    displayed_context_limit: number | null;         // Active denominator used by Copilot's context UI
    current_usage?: {                     // Current-model cumulative slice in CLI 1.0.70
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
  };
}
```

> **Metric scopes verified across model switches** — `total_*` fields are cumulative across the whole session and all models. `current_usage` resets on model switch, then accumulates only that current model's slice. `last_call_*` are intended to represent the latest call but are not reliable on every model/tier path. The legacy `used_percentage`, `remaining_percentage`, and `remaining_tokens` are derived from `last_call_*` against raw `context_window_size`; they are not live context metrics. `current_context_tokens` / `current_context_used_percentage` reflect live occupancy and are the correct source for status bars.

> **Observed 1.0.70 behavior** — Across multiple GPT-5.6 calls, `last_call_input_tokens` / `last_call_output_tokens` remained `0`, while `current_usage.input_tokens` grew cumulatively. After switching models, GPT-5.5 default and Grok populated `last_call_*`; a subsequent GPT-5.5 long-context call left the previous default-context values unchanged. Last-call widgets are therefore best-effort: they render only positive dedicated fields, but upstream can leave those fields stale on some model/tier paths.
>
> **Context-tier behavior** — Interactive long-context selection is verified to report a 1.05M `displayed_context_limit`, producing status output such as `25k/1.1M (2%)`. An isolated CLI 1.0.70 `--context long_context` prompt/resume probe recorded `contextTier: "long_context"` in `events.jsonl` but temporarily kept the custom payload at the default 400k limit. This appears specific to CLI flag/resume synchronization; widgets should continue trusting the live `displayed_context_limit` supplied by Copilot.

> **No worktree fields** — Copilot CLI's payload does **not** expose worktree state (no `worktree`, `branch`, or similar object), even when the CLI is invoked inside a linked git worktree. Worktree-aware widgets must detect state via `git` commands themselves (see `GitWorktree` / `GitWorktreeMode`).

### Environment Variables

Scripts receive `COPILOT_CLI`, `COPILOT_CLI_BINARY_VERSION`, `COPILOT_RUN_APP`, `COPILOT_LOADER_PID`.

## 3. Feature Mapping — ccstatusline → copilot-statusline

### Supported (data available from Copilot payload)

| ccstatusline Widget | copilot-statusline Widget | Data Source |
|---|---|---|
| Model | Model | `model.id` / `model.display_name` |
| Version | Version | `version` (Copilot CLI version) |
| Remote Control Status | Remote Control Status | `remote.connected` |
| Allow All | Allow All | `allow_all_enabled` |
| Session Name | Session Name | `session_name` (Copilot-unique) |
| Session ID | Session ID | `session_id` |
| Current Working Dir | Current Working Dir | `cwd` / `workspace.current_dir` |
| Terminal Width | Terminal Width | `process.stdout.columns` |
| Free Memory | Free Memory | `os.freemem()` |
| Tokens Input | Tokens Input | `context_window.total_input_tokens - total_cache_read_tokens - total_cache_write_tokens` |
| Tokens Output | Tokens Output | `context_window.total_output_tokens` |
| Tokens Cached | Tokens Cached | `context_window.total_cache_read_tokens + total_cache_write_tokens` |
| Cache Hit Rate | Cache Hit Rate | `cache_read / (cache_read + cache_write)`; not cache share of total input |
| Tokens Total | Tokens Total | `context_window.total_tokens` |
| Context Length | Context Length | `context_window.current_context_tokens` (live, aligns with ccstatusline semantics) |
| Context Window | Context Window | Active limit: `context_window.displayed_context_limit ?? context_window_size` |
| Context % | Context % | `context_window.current_context_used_percentage` (live; capped at 100) |
| Context Bar | Context Bar | `context_window.current_context_used_percentage` for the bar percentage; `current_context_tokens` / `displayed_context_limit` for the `used/total` label |
| Session Clock | Session Clock | `cost.total_duration_ms` (directly from payload!) |
| Session Cost | AI Credits | `ai_used.formatted` / `ai_used.total_nano_aiu` |
| Session Cost | Premium Requests | `cost.total_premium_requests` (legacy/request-based counter) |
| Git Branch | Git Branch | `git` command (same as ccstatusline) |
| Git Changes | Git Changes | `git` command |
| Git Insertions | Git Insertions | `git` command |
| Git Deletions | Git Deletions | `git` command |
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
| **NEW:** Last Call Tokens | Last Call Input/Output | Best-effort positive `context_window.last_call_*`; may be stale upstream |
| **NEW:** Remaining Tokens | Remaining Tokens | `displayed_context_limit − current_context_tokens` (live remaining) |

#### Parsing model effort and multiplier

Copilot may expose the **thinking effort level** in dedicated payload fields (`thinking_effort_level`, `thinking_effort`, or `reasoning_effort`) or inside `model.display_name`. The widget trusts `thinking_effort_level` first, then falls back through the other payload fields and display-name parsing.

Observed `model.display_name` formats include both the older parenthesized style and the newer middle-dot style:

```
"<model-name> [optional tags...] (<multiplier>) (<effort>)"
"<model-name> · <effort> · <context tier>"
```

Examples:
- `"claude-opus-4.6 (3x) (high)"` → multiplier = `3x`, effort = `high`
- `"Claude Opus 4.6 (1M context)(Internal only) (high)"` → effort = `high` (multiplier absent in this variant)
- `"gpt-5.6-sol · low"` → effort = `low` (multiplier absent in this variant)

The parser extracts parenthesized tokens and middle-dot / bullet / pipe / comma-separated display segments. Then:

1. **Thinking Effort** — the last recognized effort token. Supported display-name values are `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`. Dedicated payload effort fields are normalized more permissively so future upstream values can pass through.

2. **Model Multiplier** (type: `model-multiplier`) — an optional group/segment matching the pattern `\d+x` (e.g. `3x`, `6x`, `1x`). This remains useful for legacy/request-based premium request payloads, but current AI Credits payloads may omit it. Display label: `Multiplier`, raw value: just `3x`. Pairs naturally with the Model widget in compact layouts when present:
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
| Block Timer / Block Reset Timer | Copilot uses AI Credits and exposes no 5-hour block state |
| Weekly Reset Timer | No rate_limits data in Copilot |
| Session Usage / Weekly Usage | No rate_limits data in Copilot |
| Skills widget | Copilot payload does not expose active skill state |
| Worktree widget data fields | Copilot payload has no worktree object (verified May 2026 — even when CLI runs inside a linked worktree, no `worktree`/`branch` fields appear). Local widgets `git-worktree` and `git-worktree-mode` work around this by probing `git rev-parse --git-dir` directly. |
| Claude Account Email | No account info in Copilot payload |

### New Copilot-Unique Widgets

| Widget | Description | Data Source |
|---|---|---|
| Model Multiplier | Legacy/request-based premium multiplier when present (e.g. `3x`) | Parsed from `model.display_name` |
| Allow All | Shows `YOLO` only while allow-all mode is active | `allow_all_enabled` |
| AI Credits | GitHub AI Credits used this session | `ai_used.formatted` (fallback: `ai_used.total_nano_aiu / 1_000_000_000`) |
| Premium Requests | Legacy premium request counter when reported | `cost.total_premium_requests` |
| API Calls | Rough legacy estimate; inaccurate after model switches | `cost.total_premium_requests / current multiplier` |
| Premium Rate | Legacy premium requests per elapsed session minute | `cost.total_premium_requests / (cost.total_duration_ms / 60000)` |
| Last Call Input | Best-effort upstream last-call input; may be stale | Positive `last_call_input_tokens` |
| Last Call Output | Best-effort upstream last-call output; may be stale | Positive `last_call_output_tokens` |
| Remaining Tokens | Live remaining tokens for the active reported context limit | `displayed_context_limit − current_context_tokens` |
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
└── SPEC.md
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
copilot-statusline --version          # Print package version and exit
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

- **Payload parsing:** Zod schema validates known fields, preserves unknown fields, and handles null/missing lifecycle states
- **Widget rendering:** Each widget renders correctly given known context data
- **Token computation:** Non-overlapping input/cache buckets, cache hit rate, live remaining tokens, and safe handling of unavailable 1.0.70 last-call fields
- **Session clock:** Formats `total_duration_ms` correctly
- **Model display:** Parses legacy `"model-id (Nx) (level)"` and current `"model-id · level · context"` display-name formats
- **Thinking Effort parsing:** Correctly extracts effort levels (`minimal`/`low`/`medium`/`high`/`xhigh`/`max`) from payload fields and display names; returns null for unrecognized display-name formats
- **Model Multiplier parsing:** Correctly extracts multiplier (`3x`, `6x`, `1x`) from `display_name`; returns null when absent
- **API Calls computation:** Legacy rough estimate divides `total_premium_requests` by the current multiplier and returns null when unavailable
- **Premium Rate computation:** Correctly computes requests/minute; handles zero duration gracefully
- **Context percentage:** Handles null values during startup phase
- **Git widgets:** Status parsing, cache invalidation, and representative widget rendering

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
