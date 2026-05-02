import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getGitFileStatusCounts,
    isInsideGitWorkTree
} from '../utils/git';

import { makeModifierText } from './shared/editor-display';
import {
    getHideNoGitKeybinds,
    getHideNoGitLabel,
    handleToggleNoGitAction,
    isHideNoGitEnabled
} from './shared/git-no-git';
import {
    getHideWhenZeroKeybinds,
    getHideWhenZeroLabel,
    handleToggleHideWhenZeroAction,
    isHideWhenZeroEnabled
} from './shared/hide-when-zero';

export class GitStagedFilesWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows count of staged files'; }
    getDisplayName(): string { return 'Git Staged Files'; }
    getCategory(): string { return 'Git'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const labels = [getHideNoGitLabel(item), getHideWhenZeroLabel(item)]
            .filter((label): label is string => label !== undefined);

        return {
            displayText: this.getDisplayName(),
            modifierText: makeModifierText(labels)
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleToggleNoGitAction(action, item) ?? handleToggleHideWhenZeroAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        const hideNoGit = isHideNoGitEnabled(item);

        if (context.isPreview) {
            return item.rawValue ? '3' : 'S:3';
        }

        if (!isInsideGitWorkTree(context)) {
            return hideNoGit ? null : '(no git)';
        }

        const count = getGitFileStatusCounts(context).staged;
        if (count === 0 && isHideWhenZeroEnabled(item)) {
            return null;
        }
        return item.rawValue ? count.toString() : `S:${count}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [...getHideNoGitKeybinds(), ...getHideWhenZeroKeybinds()];
    }

    getNumericValue(context: RenderContext, _item: WidgetItem): number | null {
        if (!isInsideGitWorkTree(context))
            return null;
        return getGitFileStatusCounts(context).staged;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}