import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import { makeUsageProgressBar } from '../utils/progress-bar';

import { renderContextSlider } from './shared/context-slider';

type DisplayMode = 'progress' | 'progress-short' | 'slider' | 'slider-only';

function getDisplayMode(item: WidgetItem): DisplayMode {
    const mode = item.metadata?.display;
    if (mode === 'progress' || mode === 'slider' || mode === 'slider-only') {
        return mode;
    }
    return 'progress-short';
}

function isSliderMode(mode: DisplayMode): mode is 'slider' | 'slider-only' {
    return mode === 'slider' || mode === 'slider-only';
}

export class ContextBarWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows context usage as a progress bar'; }
    getDisplayName(): string { return 'Context Bar'; }
    getCategory(): string { return 'Context'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = getDisplayMode(item);
        const modifiers: string[] = [];

        if (mode === 'progress-short') {
            modifiers.push('medium bar');
        } else if (mode === 'slider') {
            modifiers.push('short bar');
        } else if (mode === 'slider-only') {
            modifiers.push('short bar only');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action !== 'toggle-progress') {
            return null;
        }

        const currentMode = getDisplayMode(item);
        const nextMode: DisplayMode = currentMode === 'progress-short'
            ? 'progress'
            : currentMode === 'progress'
                ? 'slider'
                : currentMode === 'slider'
                    ? 'slider-only'
                    : 'progress-short';

        return {
            ...item,
            metadata: {
                ...(item.metadata ?? {}),
                display: nextMode
            }
        };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = getDisplayMode(item);
        const barWidth = displayMode === 'progress' ? 32 : 16;
        const powerlineMode = settings.powerline.enabled;

        if (context.isPreview) {
            if (isSliderMode(displayMode)) {
                const slider = renderContextSlider('slider-only', 25);
                const sliderDisplay = displayMode === 'slider' ? `${slider} 50k/200k (25%)` : slider;
                return item.rawValue ? sliderDisplay : `Context: ${sliderDisplay}`;
            }

            const previewDisplay = `${makeUsageProgressBar(25, barWidth, powerlineMode)} 50k/200k (25%)`;
            return item.rawValue ? previewDisplay : `Context: ${previewDisplay}`;
        }

        const contextWindowMetrics = getContextWindowMetrics(context.data);

        const total = contextWindowMetrics.displayedContextLimit ?? contextWindowMetrics.windowSize;
        const used = contextWindowMetrics.currentContextTokens;
        const upstreamPct = contextWindowMetrics.currentContextUsedPercentage;

        if (used === null || total === null || total <= 0 || upstreamPct === null) {
            return null;
        }

        const clampedPercent = Math.max(0, Math.min(100, upstreamPct));

        const usedK = Math.round(used / 1000);
        const totalK = Math.round(total / 1000);

        if (isSliderMode(displayMode)) {
            const slider = renderContextSlider('slider-only', clampedPercent);
            const sliderDisplay = displayMode === 'slider' ? `${slider} ${usedK}k/${totalK}k (${Math.round(clampedPercent)}%)` : slider;
            return item.rawValue ? sliderDisplay : `Context: ${sliderDisplay}`;
        }

        const display = `${makeUsageProgressBar(clampedPercent, barWidth, powerlineMode)} ${usedK}k/${totalK}k (${Math.round(clampedPercent)}%)`;

        return item.rawValue ? display : `Context: ${display}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}