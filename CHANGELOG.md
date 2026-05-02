# Changelog

## Unreleased

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
