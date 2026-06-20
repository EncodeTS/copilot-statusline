import type { RenderContext } from '../types/RenderContext';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetEditorProps,
    WidgetItem
} from '../types/Widget';
import {
    isInsideGitWorkTree,
    runGit
} from '../utils/git';

import {
    getSymbol,
    getSymbolKeybind,
    renderSymbolOverrideEditor
} from './shared/symbol-override';

const DEFAULT_SYMBOL = '⎇';

export class GitWorktreeModeWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Shows indicator when current dir is a non-main git worktree'; }
    getDisplayName(): string { return 'Git Worktree Mode'; }
    getCategory(): string { return 'Git'; }

    getEditorDisplay(_item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext): string | null {
        const isInWorktree = context.isPreview ? true : this.isInLinkedWorktree(context);

        if (item.rawValue) {
            return isInWorktree ? 'true' : 'false';
        }

        if (!isInWorktree) {
            return null;
        }

        const symbol = getSymbol(item, DEFAULT_SYMBOL);
        return symbol.length > 0 ? symbol : null;
    }

    private isInLinkedWorktree(context: RenderContext): boolean {
        if (!isInsideGitWorkTree(context))
            return false;

        const gitDir = runGit('rev-parse --git-dir', context);
        if (!gitDir)
            return false;

        const normalized = gitDir.replace(/\\/g, '/');
        // linked worktrees live under <repo>/.git/worktrees/<name> or <bare>/worktrees/<name>
        return normalized.includes('/worktrees/');
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [getSymbolKeybind()];
    }

    renderEditor(props: WidgetEditorProps) {
        return renderSymbolOverrideEditor(props, DEFAULT_SYMBOL);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}