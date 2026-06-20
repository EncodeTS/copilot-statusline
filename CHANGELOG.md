# Changelog

## Unreleased

## 0.1.20

- Added Copilot CLI 1.0.64 payload compatibility for `allow_all_enabled`.
- Renamed the AI Credits widget label to `AIC` and aligned it with Copilot's formatted `ai_used` payload value.
- Hardened config loading and saving with non-destructive invalid-config recovery, atomic writes, and symlink-preserving saves.
- Hardened git status probing with lock-avoiding subprocess calls and a short-lived persistent cache.
- Added dim styling support, including dimming only parenthesized spans.
- Added glyph override support for git widgets.
- Passed terminal width into custom command widgets and added terminal-width environment overrides.
- Fixed token formatting near the 1M boundary and tightened context bar token formatting.

## 0.1.19

- Clarified AI Credits, premium request, thinking-effort, and model multiplier documentation for current Copilot payloads.
- Fixed `current-working-dir` to fall back to `workspace.current_dir` and avoid false `~` abbreviation for sibling home-prefix directories in fish-style mode.

## 0.1.18

- Aligned `tokens-input` and `tokens-cached` with ccstatusline's non-overlapping token buckets: `In` now excludes cached input, and `Cached:` is cumulative cache read + write tokens.

## 0.1.17

- Added an `ai-credits` widget backed by the new Copilot payload `ai_used` fields, and switched the default status line from premium requests to AI Credits for new configs.
- Removed a bundled absolute path from the publish artifact version fallback.

## 0.1.16

- Clarified `tokens-cached` semantics and label: it now renders as `Last Cache:` and represents cached tokens from the most recent API call (`current_usage.cache_creation_input_tokens + cache_read_input_tokens`), matching upstream ccstatusline semantics.
- Added opt-in `(z)` "hide when zero" support to count widgets: `git-staged-files`, `git-unstaged-files`, `git-untracked-files`, `git-conflicts`, `api-calls`, `premium-requests`, and `tokens-reasoning`.
- Hardened git command execution and shared porcelain parsing for git status widgets.
- Updated the field mapping spec for current context bar semantics.

## 0.1.15

- Ported upstream-style separator collapsing so explicit separators do not render around empty widgets.
- Added context percentage labels (`Ctx Used:` / `Ctx Left:`) and compact slider modes for context widgets.
- Added granular git file status widgets: `git-staged-files`, `git-unstaged-files`, `git-untracked-files`, and `git-clean-status`.

## 0.1.14

- Aligned context widgets with Copilot's live context payload fields (`current_context_tokens`, `current_context_used_percentage`, and `displayed_context_limit`).
- Removed the duplicate usable-context percentage widget after adopting the live displayed context limit.

## 0.1.13

- Realigned context and remaining-token widgets with verified Copilot payload semantics.

## 0.1.12

- Added `git-worktree` and `git-worktree-mode` widgets backed by local git probing.

## 0.1.11

- Trusted explicit Copilot thinking effort fields before falling back to `model.display_name` parsing.
