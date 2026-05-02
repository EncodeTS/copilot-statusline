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
import {
    cycleContextSliderMode,
    getContextSliderKeybinds,
    getContextSliderMode,
    getContextSliderModifierText,
    renderContextSlider
} from './shared/context-slider';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class ContextPercentageWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows percentage of context window used or remaining'; }
    getDisplayName(): string { return 'Context %'; }
    getCategory(): string { return 'Context'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const modifiers = [
            getContextInverseModifierText(item),
            getContextSliderModifierText(item)
        ].filter((modifier): modifier is string => modifier !== undefined);

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0
                ? `(${modifiers.map(modifier => modifier.replace(/^\(|\)$/g, '')).join(', ')})`
                : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-slider') {
            return cycleContextSliderMode(item);
        }
        return handleContextInverseAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const isInverse = isContextInverse(item);
        const label = isInverse ? 'Ctx Left: ' : 'Ctx Used: ';
        const sliderMode = getContextSliderMode(item);

        const formatPercentage = (displayPercentage: number): string => {
            const sliderDisplay = renderContextSlider(sliderMode, displayPercentage);
            return formatRawOrLabeledValue(item, label, sliderDisplay ?? `${displayPercentage.toFixed(1)}%`);
        };

        if (context.isPreview) {
            return formatPercentage(isInverse ? 90.7 : 9.3);
        }

        const metrics = getContextWindowMetrics(context.data);
        if (metrics.currentContextUsedPercentage !== null) {
            const pct = metrics.currentContextUsedPercentage;
            const displayPercentage = isInverse ? (100 - pct) : pct;
            return formatPercentage(displayPercentage);
        }

        return null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'u', label: '(u)sed/remaining', action: 'toggle-inverse' },
            ...getContextSliderKeybinds()
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}