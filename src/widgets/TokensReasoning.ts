import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import { formatTokens } from '../utils/format-tokens';

import { makeModifierText } from './shared/editor-display';
import {
    getHideWhenZeroKeybinds,
    getHideWhenZeroLabel,
    handleToggleHideWhenZeroAction,
    isHideWhenZeroEnabled
} from './shared/hide-when-zero';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class TokensReasoningWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return 'Shows total reasoning (thinking) tokens consumed this session'; }
    getDisplayName(): string { return 'Tokens Reasoning'; }
    getCategory(): string { return 'Tokens'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: makeModifierText([getHideWhenZeroLabel(item)].filter((label): label is string => label !== undefined))
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleToggleHideWhenZeroAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Reasoning: ', '1.2k');
        }

        const metrics = getContextWindowMetrics(context.data);
        if (metrics.reasoningTokens !== null) {
            if (metrics.reasoningTokens === 0 && isHideWhenZeroEnabled(item)) {
                return null;
            }
            return formatRawOrLabeledValue(item, 'Reasoning: ', formatTokens(metrics.reasoningTokens));
        }
        return null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return getHideWhenZeroKeybinds();
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}