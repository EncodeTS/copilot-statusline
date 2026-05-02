import type {
    Widget,
    WidgetItemType
} from '../types/Widget';
import * as widgets from '../widgets';

export interface WidgetManifestEntry {
    type: WidgetItemType;
    create: () => Widget;
}

export interface LayoutWidgetManifestEntry {
    type: WidgetItemType;
    displayName: string;
    description: string;
    category: string;
}

export const WIDGET_MANIFEST: WidgetManifestEntry[] = [
    { type: 'model', create: () => new widgets.ModelWidget() },
    { type: 'version', create: () => new widgets.VersionWidget() },
    { type: 'session-name', create: () => new widgets.SessionNameWidget() },
    { type: 'session-id', create: () => new widgets.SessionIdWidget() },
    { type: 'thinking-effort', create: () => new widgets.ThinkingEffortWidget() },
    { type: 'model-multiplier', create: () => new widgets.ModelMultiplierWidget() },
    { type: 'tokens-input', create: () => new widgets.TokensInputWidget() },
    { type: 'tokens-output', create: () => new widgets.TokensOutputWidget() },
    { type: 'tokens-cached', create: () => new widgets.TokensCachedWidget() },
    { type: 'tokens-reasoning', create: () => new widgets.TokensReasoningWidget() },
    { type: 'tokens-total', create: () => new widgets.TokensTotalWidget() },
    { type: 'context-length', create: () => new widgets.ContextLengthWidget() },
    { type: 'context-window', create: () => new widgets.ContextWindowWidget() },
    { type: 'context-percentage', create: () => new widgets.ContextPercentageWidget() },
    { type: 'context-bar', create: () => new widgets.ContextBarWidget() },
    { type: 'session-clock', create: () => new widgets.SessionClockWidget() },
    { type: 'premium-requests', create: () => new widgets.PremiumRequestsWidget() },
    { type: 'api-calls', create: () => new widgets.ApiCallsWidget() },
    { type: 'premium-rate', create: () => new widgets.PremiumRateWidget() },
    { type: 'last-call-input', create: () => new widgets.LastCallInputWidget() },
    { type: 'last-call-output', create: () => new widgets.LastCallOutputWidget() },
    { type: 'remaining-tokens', create: () => new widgets.RemainingTokensWidget() },
    { type: 'cache-read-tokens', create: () => new widgets.CacheReadTokensWidget() },
    { type: 'cache-write-tokens', create: () => new widgets.CacheWriteTokensWidget() },
    { type: 'git-branch', create: () => new widgets.GitBranchWidget() },
    { type: 'git-changes', create: () => new widgets.GitChangesWidget() },
    { type: 'git-insertions', create: () => new widgets.GitInsertionsWidget() },
    { type: 'git-deletions', create: () => new widgets.GitDeletionsWidget() },
    { type: 'git-root-dir', create: () => new widgets.GitRootDirWidget() },
    { type: 'git-pr', create: () => new widgets.GitPrWidget() },
    { type: 'git-status', create: () => new widgets.GitStatusWidget() },
    { type: 'git-staged', create: () => new widgets.GitStagedWidget() },
    { type: 'git-staged-files', create: () => new widgets.GitStagedFilesWidget() },
    { type: 'git-unstaged', create: () => new widgets.GitUnstagedWidget() },
    { type: 'git-unstaged-files', create: () => new widgets.GitUnstagedFilesWidget() },
    { type: 'git-untracked', create: () => new widgets.GitUntrackedWidget() },
    { type: 'git-untracked-files', create: () => new widgets.GitUntrackedFilesWidget() },
    { type: 'git-clean-status', create: () => new widgets.GitCleanStatusWidget() },
    { type: 'git-ahead-behind', create: () => new widgets.GitAheadBehindWidget() },
    { type: 'git-conflicts', create: () => new widgets.GitConflictsWidget() },
    { type: 'git-sha', create: () => new widgets.GitShaWidget() },
    { type: 'git-origin-owner', create: () => new widgets.GitOriginOwnerWidget() },
    { type: 'git-origin-repo', create: () => new widgets.GitOriginRepoWidget() },
    { type: 'git-origin-owner-repo', create: () => new widgets.GitOriginOwnerRepoWidget() },
    { type: 'git-upstream-owner', create: () => new widgets.GitUpstreamOwnerWidget() },
    { type: 'git-upstream-repo', create: () => new widgets.GitUpstreamRepoWidget() },
    { type: 'git-upstream-owner-repo', create: () => new widgets.GitUpstreamOwnerRepoWidget() },
    { type: 'git-is-fork', create: () => new widgets.GitIsForkWidget() },
    { type: 'git-worktree', create: () => new widgets.GitWorktreeWidget() },
    { type: 'git-worktree-mode', create: () => new widgets.GitWorktreeModeWidget() },
    { type: 'current-working-dir', create: () => new widgets.CurrentWorkingDirWidget() },
    { type: 'terminal-width', create: () => new widgets.TerminalWidthWidget() },
    { type: 'free-memory', create: () => new widgets.FreeMemoryWidget() },
    { type: 'custom-text', create: () => new widgets.CustomTextWidget() },
    { type: 'custom-symbol', create: () => new widgets.CustomSymbolWidget() },
    { type: 'custom-command', create: () => new widgets.CustomCommandWidget() },
    { type: 'link', create: () => new widgets.LinkWidget() }
];

export const LAYOUT_WIDGET_MANIFEST: LayoutWidgetManifestEntry[] = [
    {
        type: 'separator',
        displayName: 'Separator',
        description: 'A separator character between status line widgets',
        category: 'Layout'
    },
    {
        type: 'flex-separator',
        displayName: 'Flex Separator',
        description: 'Expands to fill available terminal width',
        category: 'Layout'
    }
];