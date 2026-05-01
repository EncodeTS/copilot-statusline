import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';

import {
    getContextInverseModifierText,
    handleContextInverseAction,
    isContextInverse
} from './shared/context-inverse';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class ContextPercentageUsableWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows percentage of usable context (current_context_tokens / displayed_context_limit)'; }
    getDisplayName(): string { return 'Context % (Usable)'; }
    getCategory(): string { return 'Context'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: getContextInverseModifierText(item)
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleContextInverseAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const isInverse = isContextInverse(item);

        if (context.isPreview) {
            const previewValue = isInverse ? '88.4%' : '11.6%';
            return formatRawOrLabeledValue(item, 'Usable: ', previewValue);
        }

        const metrics = getContextWindowMetrics(context.data);
        if (metrics.currentContextTokens !== null && metrics.displayedContextLimit !== null && metrics.displayedContextLimit > 0) {
            const usablePercent = Math.min(100, (metrics.currentContextTokens / metrics.displayedContextLimit) * 100);
            const displayPercentage = isInverse ? (100 - usablePercent) : usablePercent;
            return formatRawOrLabeledValue(item, 'Usable: ', `${displayPercentage.toFixed(1)}%`);
        }

        return null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'u', label: '(u)sed/remaining', action: 'toggle-inverse' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}